import assert from "assert";

import { Kernl } from "@/kernl";
import { Agent } from "@/agent";
import { Context } from "@/context";
import type { Task } from "@/task";
import type { ResolvedAgentResponse } from "@/guardrail";

import { logger } from "@/lib/logger";

import {
  ToolCall,
  LanguageModel,
  LanguageModelRequest,
  LanguageModelItem,
  FAILED,
  RUNNING,
  STOPPED,
} from "@kernl-sdk/protocol";
import { randomID, filter } from "@kernl-sdk/shared/lib";

import type {
  ActionSet,
  ThreadEvent,
  ThreadOptions,
  ThreadExecuteResult,
  PerformActionsResult,
  ThreadState,
  ThreadStreamEvent,
} from "@/types/thread";
import type { AgentResponseType } from "@/types/agent";

import {
  notDelta,
  getFinalResponse,
  getIntentions,
  parseFinalResponse,
} from "./utils";

/**
 * A thread drives the execution loop for an agent.
 */
export class Thread<
  TContext = unknown,
  TResponse extends AgentResponseType = "text",
> {
  private kernl: Kernl;

  readonly id: string;
  readonly agent: Agent<TContext, TResponse>;
  readonly context: Context<TContext>;
  readonly model: LanguageModel; /* inherited from the agent unless specified */
  readonly parent: Task<TContext> | null; /* parent task which spawned this thread */
  readonly mode: "blocking" | "stream"; /* TODO */
  readonly input: ThreadEvent[]; /* the initial input for the thread */
  // readonly stats: ThreadMetrics;

  /* state */
  _tick: number;
  state: ThreadState;
  private history: ThreadEvent[] /* events generated during this thread's execution */;
  private abort?: AbortController;

  constructor(
    kernl: Kernl,
    agent: Agent<TContext, TResponse>,
    input: ThreadEvent[],
    options?: ThreadOptions<TContext>,
  ) {
    this.id = `tid_${randomID()}`;
    this.agent = agent;
    this.context = options?.context ?? new Context<TContext>();
    this.kernl = kernl;
    this.parent = options?.task ?? null;
    this.model = options?.model ?? agent.model;
    this.mode = "blocking"; // (TODO): add streaming
    this.input = input;

    this._tick = 0;
    this.state = STOPPED;
    this.history = input;
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

    // extract final response from accumulated history
    const text = getFinalResponse(this.history);
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

    yield { kind: "stream-start" }; // always yield start immediately

    try {
      yield* this._execute();
    } catch (err) {
      throw err;
    } finally {
      this.state = STOPPED;
      this.abort = undefined;
    }
  }

  /**
   * Cancel the running thread
   */
  cancel() {
    this.abort?.abort();
  }

  /**
   * Append a new event to the thread history
   */
  append(events: ThreadEvent[]): void {
    this.history.push(...events);
  }

  /**
   * Main execution loop - always yields events, callers can propagate or discard (as in execute())
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
          this.history.push(e);
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

        // await this.agent.runOutputGuardails(context, state);
        // this.kernl.emit("thread.terminated", context, output);
        return;
      }

      // perform actions intended by the model
      const { actions, pendingApprovals } =
        await this.performActions(intentions);

      // yield action events
      for (const a of actions) {
        this.history.push(a);
        yield a;
      }

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
      // try to stream if model supports it
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
        // (TODO): track usage (this.stats.usage.add(res.usage))
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

    const actions: ThreadEvent[] = [];
    const pendingApprovals: ToolCall[] = [];

    // (TODO): clean this - approval tracking should be handled differently
    for (const e of toolEvents) {
      if (
        e.kind === "tool-result" &&
        (e.state as any) === "requires_approval" // (TODO): fix this
      ) {
        // Find the original tool call for this pending approval
        const originalCall = intentions.toolCalls.find(
          (call) => call.callId === e.callId,
        );
        if (originalCall) {
          pendingApprovals.push(originalCall);
        }
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
  private async executeTools(calls: ToolCall[]): Promise<ThreadEvent[]> {
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
          // Handles both tool not found AND any execution errors
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

    // // TODO: what do we want to do with this?
    // settings = maybeResetToolChoice(this.agent, this.state.toolUse, settings);

    const system = await this.agent.instructions(this.context);
    const input: LanguageModelItem[] = system
      ? [
          // (TODO): add message(role, text) helper
          {
            kind: "message",
            id: randomID(),
            role: "system",
            content: [{ kind: "text", text: system }],
          },
          ...history, // (TODO): filter for LanguageModelItem specifically - there may be other thread events
        ]
      : history;

    // TODO: apply custom input filters - arguably want global + agent-scoped -> apply in a middleware-like chain
    // const filtered = await applyInputFilters(inputWithSystem, context);

    const filtered = input;

    // serialize action repertoire
    const allTools = await this.agent.tools(this.context);
    const enabled = await filter(
      allTools,
      async (tool) => await tool.isEnabled(this.context, this.agent),
    );
    const tools = enabled.map((tool) => tool.serialize());

    return {
      input: filtered,
      settings,
      tools,
    };
  }
}
