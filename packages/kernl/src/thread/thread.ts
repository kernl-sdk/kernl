/**
 * /packages/kernl/src/thread/thread.ts
 */
import assert from "assert";
import { ZodType } from "zod";
import * as z from "zod";

import { Agent } from "@/agent";
import { Context } from "@/context";
import type { Task } from "@/task";
import type { ResolvedAgentResponse } from "@/guardrail";
import type { ThreadStore } from "@/storage";

import { logger } from "@/lib/logger";

import {
  FAILED,
  RUNNING,
  STOPPED,
  message,
  ToolCall,
  LanguageModel,
  LanguageModelItem,
  LanguageModelRequest,
  INTERRUPTIBLE
} from "@kernl-sdk/protocol";
import { randomID, filter } from "@kernl-sdk/shared/lib";

import type {
  ActionSet,
  ThreadEvent,
  ThreadState,
  ThreadOptions,
  ThreadEventInner,
  ThreadStreamEvent,
  ThreadExecuteResult,
  PerformActionsResult,
} from "./types";
import type { AgentOutputType } from "@/agent/types";
import type { LanguageModelResponseType } from "@kernl-sdk/protocol";

import {
  tevent,
  notDelta,
  getIntentions,
  getFinalResponse,
  parseFinalResponse,
} from "./utils";

/**
 * A thread drives the execution loop for an agent.
 *
 * Ground principles:
 *
 *   1) Event log is source of truth.
 *      - Persistent storage (e.g. Postgres) is treated as an append-only per-thread log of `ThreadEvent`s:
 *        monotonic `seq`, no gaps, no updates/deletes.
 *      - `Thread.state`, `tick`, etc. are projections of that log, not an alternative source of truth.
 *
 *   2) Single writer per thread.
 *      - At most one executor is allowed for a given `tid` at a time.
 *      - Callers are responsible for enforcing this (e.g. locking/versioning) so two processes cannot
 *        interleave or race on `seq` or state.
 *
 *   3) Persist before use / observation.
 *      - Before an event can:
 *        - influence a future tick (i.e. be part of `history` fed back into the model), or
 *        - be considered “delivered” to a client,
 *        it SHOULD be durably written to storage when storage is configured.
 *
 *   4) Transaction boundaries match semantic steps.
 *      - The intended strategy is to buffer within a tick, then atomically persist all new events + state
 *        at the end of `tick()`.
 *      - After a crash, you only ever see whole ticks or none, never half a tick, from the store’s
 *        point of view.
 *
 *   5) Recovery is replay.
 *      - On restart, callers rebuild a `Thread` from the stored event log (plus optional snapshots).
 *      - Any incomplete tick or pending tool call is handled by a clear, deterministic policy at a
 *        higher layer (e.g. re-run, mark failed, or require manual intervention).
 *
 * On storage failures:
 *
 *   “If storage is configured, it is authoritative” → fail hard on persist errors rather than
 *   treating persistence as best-effort.
 *
 *   If a storage implementation is present, `persist(...)` is expected to throw on failure, and
 *   that error should bubble out of `_execute()` / `stream()` and stop the thread.
 */
export class Thread<
  TContext = unknown,
  TOutput extends AgentOutputType = "text",
> {
  readonly tid: string;
  readonly namespace: string;
  readonly agent: Agent<TContext, TOutput>;
  readonly context: Context<TContext>;
  readonly model: LanguageModel; /* inherited from the agent unless specified */
  readonly parent: Task<TContext> | null; /* parent task which spawned this thread */
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly metadata: Record<string, unknown> | null;
  // readonly stats: ThreadMetrics;

  /* state */
  _tick: number; /* number of LLM roundtrips */
  _seq: number; /* monotonic event sequence */
  state: ThreadState;
  private cpbuf: ThreadEvent[]; /* checkpoint buffer - events pending persistence */
  private persisted: boolean; /* indicates thread was hydrated from storage */
  private history: ThreadEvent[] /* history representing the event log for the thread */;

  private abort?: AbortController;
  private storage?: ThreadStore;

  constructor(options: ThreadOptions<TContext, TOutput>) {
    this.tid = options.tid ?? `tid_${randomID()}`;
    this.namespace = options.namespace ?? "kernl";
    this.agent = options.agent;
    this.context =
      options.context ?? new Context<TContext>(this.namespace, {} as TContext);
    this.context.agent = options.agent;
    this.parent = options.task ?? null;
    this.model = options.model ?? options.agent.model;
    this.storage = options.storage;
    this.createdAt = options.createdAt ?? new Date();
    this.updatedAt = options.updatedAt ?? new Date();
    this.metadata = options.metadata ?? null;

    this._tick = options.tick ?? 0;
    this._seq = -1;
    this.state = options.state ?? STOPPED;
    this.cpbuf = [];
    this.persisted = options.persisted ?? false;
    this.history = options.history ?? [];

    // seek to latest seq (not persisted)
    if (this.history.length > 0) {
      this._seq = Math.max(...this.history.map((e) => e.seq));
    }

    // append initial input if provided (for new threads)
    if (options.input && options.input.length > 0) {
      this.append(...options.input);
    }
  }

  // MARK: Execute
  /**
   * Blocking execution - runs until terminal state or interruption
   */
  async execute(): Promise<
    ThreadExecuteResult<ResolvedAgentResponse<TOutput>>
  > {
    for await (const _event of this.stream()) {
      // just consume the stream (already in history in _execute())
    }

    // filter for language model items
    const items = this.history
      .filter((e) => e.kind !== "system")
      .map((e) => {
        const { tid, seq, timestamp, metadata, ...item } = e;
        return item as LanguageModelItem;
      });

    const text = getFinalResponse(items);
    assert(text, "_execute continues until text !== null"); // (TODO): consider preventing infinite loops here
    const parsed = parseFinalResponse(text, this.agent.output);

    return { response: parsed, state: this.state };
  }

  /**
   * Streaming execution - returns async iterator of events
   */
  async *stream(): AsyncIterable<ThreadStreamEvent> {
    if (this.state === RUNNING && this.abort) {
      throw new Error("thread already running");
    }

    this.state = RUNNING;
    this.abort = new AbortController();

    await this.checkpoint(); /* c1: persist RUNNING state + initial input */

    yield { kind: "stream-start" }; // always yield start immediately

    try {
      yield* this._execute();
    } catch (err) {
      throw err;
    } finally {
      // Preserve INTERRUPTIBLE state (set by sleep/approval flows).
      // Only transition to STOPPED if we're still RUNNING.
      if (this.state === RUNNING) {
        this.state = STOPPED;
      }
      this.abort = undefined;
      await this.checkpoint(); /* c4: final checkpoint - persist final state */
    }
  }

  // MARK: _execute main loop
  /**
   * Main execution loop - always yields events, callers can propagate or discard.
   *
   * NOTE: Streaming structured output deferred for now. Prioritizing correctness + simplicity,
   * and unclear what use cases there would actually be for streaming a structured output (other than maybe gen UI).
   */
  private async *_execute(): AsyncGenerator<ThreadStreamEvent, void> {
    for (;;) {
      let err = false;

      if (this.abort?.signal.aborted) {
        return;
      }

      const events = [];
      for await (const e of this.tick()) {
        if (e.kind === "error") {
          err = true;
          logger.error(e.error); // (TODO): onError callback in options
        }
        // we don't want deltas in the history
        if (notDelta(e)) {
          events.push(e);
          this.append(e);
        }
        yield e;
      }

      // if an error event occurred → terminate
      if (err) {
        return;
      }

      // if model returns a message with no action intentions → terminal state
      const intentions = getIntentions(events);
      if (!intentions) {
        const text = getFinalResponse(events);
        if (!text) continue; // run again, policy-dependent? (how to ensure no infinite loop here?)

        await this.checkpoint(); /* c2: terminal tick - no tool calls */

        // await this.agent.runOutputGuardails(context, state);
        // this.kernl.emit("thread.terminated", context, output);
        return;
      }

      // perform intended actions
      const { actions, pendingApprovals } =
        await this.performActions(intentions);

      // append + yield action events
      for (const a of actions) {
        this.append(a);
        yield a;
      }

      await this.checkpoint(); /* c3: tick complete */

      if (pendingApprovals.length > 0) {
        // Thread halts when actions require approval (e.g., sleep).
        // External scheduler will resume the thread later.
        // Set state to INTERRUPTIBLE so callers know the thread is sleeping, not stopped.
        this.state = INTERRUPTIBLE;
        return;
      }
    }
  }

  /**
   * A single tick - calls model and yields events as they arrive
   *
   * NOTE: Streaming structured outputs deferred until concrete use cases emerge.
   * For now, we stream text-delta and tool events, final validation happens in _execute().
   */
  private async *tick(): AsyncGenerator<ThreadStreamEvent> {
    this._tick++;

    // (TODO): check limits (if this._tick > this.limits.maxTicks)
    // (TODO): run input guardrails on first tick (if this._tick === 1)

    const req = await this.prepareModelRequest(this.history);

    try {
      if (this.model.stream) {
        const stream = this.model.stream(req);
        for await (const event of stream) {
          yield event; // [text-delta, tool-call, message, reasoning, ...]
        }
      } else {
        // fallback: blocking generate, yield events as batch
        const res = await this.model.generate(req);
        for (const event of res.content) {
          yield event;
        }
        // (TODO): this.stats.usage.add(res.usage)
      }
    } catch (error) {
      yield {
        kind: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Persist current thread state to storage.
   *
   * - If storage is configured, it is authoritative - failures throw and halt execution.
   * - No-op if storage is not configured.
   */
  private async checkpoint(): Promise<void> {
    if (!this.storage) {
      logger.warn(
        "thread: storage is not configured, thread will not be persisted",
      );
      return;
    }

    // insert thread record on first persist for new threads
    if (!this.persisted) {
      await this.storage.insert({
        id: this.tid,
        namespace: this.namespace,
        agentId: this.agent.id,
        parentTaskId: this.parent?.id ?? null,
        model: `${this.model.provider}/${this.model.modelId}`,
        context: this.context.context,
        tick: this._tick,
        state: this.state,
        metadata: this.metadata,
      });
      this.persisted = true;
    }

    // append + drain events from checkpoint buffer
    if (this.cpbuf.length > 0) {
      await this.storage.append(this.cpbuf);
      this.cpbuf = [];
    }

    // update thread state
    await this.storage.update(this.tid, {
      state: this.state,
      tick: this._tick,
      context: this.context,
      // no metadata - not owned by checkpoint
    });
  }

  /**
   * Append one or more items to history + enrich w/ runtime headers.
   *
   * Core rule:
   *
   * > An event becomes a ThreadEvent (and gets seq/timestamp) exactly when it is appended to history. <
   */
  append(...items: ThreadEventInner[]): ThreadEvent[] {
    const events: ThreadEvent[] = [];
    for (const item of items) {
      const seq = ++this._seq;
      const e = tevent({
        tid: this.tid,
        seq,
        kind: item.kind,
        data: item,
      });
      this.history.push(e);
      this.cpbuf.push(e);
      events.push(e);
    }
    return events;
  }

  /**
   * Cancel the running thread
   */
  cancel() {
    this.abort?.abort();
  }

  // ----------------------------
  // utils
  // ----------------------------

  /**
   * Perform the actions returned by the model
   */
  private async performActions(
    intentions: ActionSet,
  ): Promise<PerformActionsResult> {
    // // priority 1: syscalls first - these override all other actions
    // if (actions.syscalls.length > 0) {
    //   switch (actions.syscalls.kind) { // is it possible to have more than one?
    //     case SYS_WAIT:
    //       return this.state;
    //     case SYS_EXIT:
    //       return { state: this.state, output: this.output }
    //     default:
    //   }
    // }

    // (TODO): refactor into a general actions system - probably shouldn't be handled by Thread
    const toolEvents = await this.executeTools(intentions.toolCalls);
    // const mcpEvents = await this.executeMCPRequests(actions.mcpRequests);

    const actions: ThreadEventInner[] = [];
    const pendingApprovals: ToolCall[] = [];

    for (const e of toolEvents) {
      actions.push(e); // always record the tool call in history

      // Only system tools are allowed to affect control flow.
      if (e.kind === "tool-result" && this.agent.isSysTool(e.toolId)) {
        // 1) Future-proof: generic approval-based interrupts (other sys tools)
        //    If you later add real approval flows that still use INTERRUPTIBLE,
        //    this branch continues to work.
        if (e.state === INTERRUPTIBLE) {
          const call = intentions.toolCalls.find((c) => c.callId === e.callId);
          if (call) pendingApprovals.push(call);
          continue;
        }

        // 2) Sleep tool: state is COMPLETED, but semantically it means
        //    "alarm set, thread should pause until wakeup."
        if (e.toolId === "wait_until") {
          const call = intentions.toolCalls.find((c) => c.callId === e.callId);
          if (call) pendingApprovals.push(call);
          continue;
        }
      }
    }
    // const actions: ThreadEventInner[] = [];
    // const pendingApprovals: ToolCall[] = [];

    // // (TODO): clean this - approval tracking should be handled differently
    // for (const e of toolEvents) {
    //   // actions.push(e);
    //   if (
    //     e.kind === "tool-result" &&
    //     e.state === INTERRUPTIBLE &&
    //     this.agent.isSysTool(e.toolId)
    //   ) {
    //     // find the original tool call for this pending approval
    //     const call = intentions.toolCalls.find((c) => c.callId === e.callId);
    //     call && pendingApprovals.push(call);
    //   } else {
    //     actions.push(e);
    //   }
    // }

    return {
      actions: actions,
      pendingApprovals,
    };
  }

  /**
   * Execute function calls requested by the model
   *
   * TODO: refactor into actions system
   */
  private async executeTools(calls: ToolCall[]): Promise<ThreadEventInner[]> {
    return await Promise.all(
      calls.map(async (call: ToolCall) => {
        try {
          const tool = this.agent.tool(call.toolId);
          if (!tool) {
            throw new Error(`Tool ${call.toolId} not found`);
          }

          // hosted tools are executed server-side by the provider, not locally
          assert(
            tool.type === "function",
            `Tool ${call.id} is a hosted tool and should not be executed locally`,
          );

          // (TMP) - passing the approval status through the context until actions system
          // is refined
          const ctx = new Context(this.namespace, this.context.context);
          ctx.agent = this.agent;
          ctx.threadId = this.tid;

          // Don't pre-approve system tools - they use requiresApproval to signal
          // INTERRUPTIBLE state (e.g., sleep tool halts the execution loop)
          if (!this.agent.isSysTool(call.toolId)) {
            ctx.approve(call.callId);
          }

          const res = await tool.invoke(ctx, call.arguments, call.callId);

          return {
            kind: "tool-result" as const,
            callId: call.callId,
            toolId: call.toolId,
            state: res.state,
            result: res.result,
            error: res.error,
          };
        } catch (error) {
          return {
            kind: "tool-result" as const,
            callId: call.callId,
            toolId: call.toolId,
            state: FAILED,
            result: undefined as any,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );
  }

  /**
   * Applies call-level filters and prepares the model request for the language model
   */
  private async prepareModelRequest(
    history: ThreadEvent[],
  ): Promise<LanguageModelRequest> {
    let settings = {
      ...this.agent.modelSettings,
    };

    // (TODO): what do we want to do with this?
    // settings = maybeResetToolChoice(this.agent, this.state.toolUse, settings);

    const system = await this.agent.instructions(this.context);

    // filter for model items + strip event headers
    const items = history
      .filter((e) => e.kind !== "system") // system events are not sent to model
      .map((event) => {
        const { id, tid, seq, timestamp, metadata, ...item } = event;
        return item as LanguageModelItem;
      });

    const input: LanguageModelItem[] = system
      ? [message({ role: "system", text: system }), ...items]
      : items;

    // (TODO): apply custom input filters - arguably want global + agent-scoped -> apply in a middleware-like chain
    // const filtered = await applyInputFilters(inputWithSystem, context);

    const filtered = input;

    // serialize action repertoire
    const all = await this.agent.tools(this.context);
    const enabled = await filter(
      all,
      async (tool) => await tool.isEnabled(this.context, this.agent),
    );
    const tools = enabled.map((tool) => tool.serialize());

    // derive responseType from agent.output
    let responseType: LanguageModelResponseType | undefined;
    if (this.agent.output && this.agent.output !== "text") {
      const schema = this.agent.output as ZodType;
      responseType = {
        kind: "json",
        schema: z.toJSONSchema(schema, { target: "draft-7" }) as any,
      };
    }

    return {
      input: filtered,
      settings,
      tools,
      responseType,
    };
  }
}
