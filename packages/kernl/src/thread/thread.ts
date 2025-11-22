import assert from "assert";

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
  LanguageModelRequest,
  LanguageModelItem,
} from "@kernl-sdk/protocol";
import { randomID, filter } from "@kernl-sdk/shared/lib";

import type {
  ActionSet,
  ThreadEvent,
  ThreadEventInner,
  ThreadOptions,
  ThreadExecuteResult,
  PerformActionsResult,
  ThreadState,
  ThreadStreamEvent,
} from "@/types/thread";
import type { AgentResponseType } from "@/types/agent";

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
  TResponse extends AgentResponseType = "text",
> {
  readonly tid: string;
  readonly agent: Agent<TContext, TResponse>;
  readonly context: Context<TContext>;
  readonly model: LanguageModel; /* inherited from the agent unless specified */
  readonly parent: Task<TContext> | null; /* parent task which spawned this thread */
  readonly createdAt: Date;
  readonly updatedAt: Date;
  // readonly stats: ThreadMetrics;

  /* state */
  _tick: number; /* number of LLM roundtrips */
  _seq: number; /* monotonic event sequence */
  state: ThreadState;
  private history: ThreadEvent[] /* history representing the event log for the thread */;

  private abort?: AbortController;
  private storage?: ThreadStore;
  private persisted: boolean;
  private cpbuf: ThreadEvent[]; /* checkpoint buffer - events pending persistence */

  constructor(options: ThreadOptions<TContext, TResponse>) {
    this.tid = options.tid ?? `tid_${randomID()}`;
    this.agent = options.agent;
    this.context = options.context ?? new Context<TContext>();
    this.parent = options.task ?? null;
    this.model = options.model ?? options.agent.model;
    this.storage = options.storage;
    this.createdAt = options.createdAt ?? new Date();
    this.updatedAt = options.updatedAt ?? new Date();

    this._tick = options.tick ?? 0;
    this.state = options.state ?? STOPPED;

    // if hydrating from storage with history, restore _seq from last event
    if (options.history && options.history.length > 0) {
      this.history = options.history;
      const seq = Math.max(...options.history.map((e) => e.seq));
      this._seq = seq;
      this.persisted = true; // hydrated from storage, record already exists
    } else {
      this.history = [];
      this._seq = -1;
      this.persisted = false; // new thread, needs insert on first persist
    }

    // initialize checkpoint buffer (events pending persistence)
    this.cpbuf = [];

    // append initial input if provided (for new threads)
    if (options.input && options.input.length > 0) {
      this.append(...options.input);
    }
  }

  /**
   * Blocking execution loop - runs until terminal state or interruption
   */
  async execute(): Promise<
    ThreadExecuteResult<ResolvedAgentResponse<TResponse>>
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
    const parsed = parseFinalResponse(text, this.agent.responseType);

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
      this.state = STOPPED;
      this.abort = undefined;
      await this.checkpoint(); /* c4: final checkpoint - persist STOPPED state */
    }
  }

  /**
   * Cancel the running thread
   */
  cancel() {
    this.abort?.abort();
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

      // if an error event occurred, terminate
      if (err) {
        return;
      }

      // if model returns a message with no action intentions -> terminal state
      const intentions = getIntentions(events);
      if (!intentions) {
        const text = getFinalResponse(events);
        if (!text) continue; // run again, policy-dependent? (how to ensure no infinite loop here?)

        await this.checkpoint(); /* c2: terminal tick - no tool calls */

        // await this.agent.runOutputGuardails(context, state);
        // this.kernl.emit("thread.terminated", context, output);
        return;
      }

      // perform actions intended by the model
      const { actions, pendingApprovals } =
        await this.performActions(intentions);

      // append and yield action events
      for (const a of actions) {
        this.append(a);
        yield a;
      }

      await this.checkpoint(); /* c3: tick complete */

      if (pendingApprovals.length > 0) {
        // publish a batch approval request containing all of them
        //
        // const reqid = randomID();
        // this.kernl.publish(channel, approvalRequest);
        //
        // const filter = { reqid }
        // await wait_event(Action.ApprovalResponse, filter);
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
      // Convert model errors to error events
      yield {
        kind: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

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

    // (TODO): clean this - approval tracking should be handled differently
    for (const e of toolEvents) {
      if (
        e.kind === "tool-result" &&
        (e.state as any) === "requires_approval" // (TODO): fix this
      ) {
        // Find the original tool call for this pending approval
        const call = intentions.toolCalls.find((c) => c.callId === e.callId);
        call && pendingApprovals.push(call);
      } else {
        actions.push(e);
      }
    }

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
          const ctx = new Context(this.context.context);
          ctx.approve(call.callId); // mark this call as approved
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

    return {
      input: filtered,
      settings,
      tools,
    };
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
        "thread: storage is not configured, thread state will not be persisted",
      );
      return;
    }

    // insert thread record on first persist for new threads
    if (!this.persisted) {
      await this.storage.insert({
        id: this.tid,
        agentId: this.agent.id,
        model: `${this.model.provider}/${this.model.modelId}`,
        context: this.context.context,
        tick: this._tick,
        state: this.state,
        parentTaskId: this.parent?.id ?? null,
        metadata: null,
      });
      this.persisted = true;
    }

    // append events from checkpoint buffer
    if (this.cpbuf.length > 0) {
      await this.storage.append(this.cpbuf);
      this.cpbuf = []; // drain buffer after successful persist
    }

    // update thread state
    await this.storage.update(this.tid, {
      state: this.state,
      tick: this._tick,
      context: this.context,
    });
  }
}
