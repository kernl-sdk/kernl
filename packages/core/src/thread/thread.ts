import assert from "assert";

import { Kernl } from "@/kernl";
import { Agent } from "@/agent";
import { Context } from "@/context";
import type {
  LanguageModel,
  LanguageModelRequest,
  LanguageModelResponse,
} from "@/model";
import type { Task } from "@/task";

import { filter, randomID } from "@/lib/utils";

import type {
  ToolCall,
  ActionSet,
  ThreadEvent,
  ThreadOptions,
  TickResult,
  PerformActionsResult,
  ThreadExecuteResult,
} from "@/types/thread";

import { getFinalResponse, parseFinalResponse } from "./utils";

import type { AgentResponseType } from "@/types/agent";
import type { ResolvedAgentResponse } from "@/guardrail";

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
  readonly mode: "blocking" | "stream";

  readonly state: ThreadState;
  readonly input: ThreadEvent[] | string; /* the initial input for the thread */
  private history: ThreadEvent[] /* events generated during this thread's execution */;

  constructor(
    kernl: Kernl,
    agent: Agent<TContext, TResponse>,
    input: ThreadEvent[] | string,
    options?: ThreadOptions<TContext>,
  ) {
    this.id = `tid_${randomID()}`;
    this.agent = agent;
    this.context = options?.context ?? new Context<TContext>();
    this.kernl = kernl;
    this.parent = options?.task ?? null;
    this.model = options?.model ?? agent.model;
    this.state = new ThreadState(); // (TODO): checkpoint ?? new ThreadState()
    this.mode = "blocking"; // (TODO): add streaming
    this.input = input;

    // Convert string input to user message and initialize history
    if (typeof input === "string") {
      this.history = [
        {
          kind: "message",
          id: `msg_${randomID()}`,
          role: "user",
          content: [
            {
              kind: "text",
              text: input,
            },
          ],
        },
      ];
    } else {
      this.history = input;
    }
  }

  /**
   * Main thread execution loop - runs until terminal state or interruption
   */
  async execute(): Promise<
    ThreadExecuteResult<ResolvedAgentResponse<TResponse>>
  > {
    while (true) {
      const { events, intentions } = await this.tick(); // actions: { syscalls, functions, mcpApprovalRequests }

      this.history.push(...events);

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

      // if model returns a message with no actions, terminal state for the thread
      if (!intentions) {
        const text = getFinalResponse(events);
        if (!text) continue; // run again, policy-dependent?

        const parsed = parseFinalResponse(text, this.agent.responseType);

        // await this.agent.runOutputGuardails(context, state);
        // this.kernl.emit("thread.terminated", context, output);
        return { response: parsed, state: this.state };
      }

      // perform the actions intended by the model
      const { actions, pendingApprovals } =
        await this.performActions(intentions);

      this.history.push(...actions);

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

  // ----------------------
  // Internal helpers
  // ----------------------

  /**
   * A single tick of the thread's execution.
   *
   * Prepares the input for the model, gets the response, and then parses into a TickResult
   * with the events generated and the model's intentions (actions).
   */
  private async tick(): Promise<TickResult> {
    this.state.tick++;

    // // check limits
    // if (this.state.tick > this.limits.maxTicks) {
    //   throw new RuntimeError("resource_limit:max_ticks_exceeded");
    // }

    // run guardrails on the first tick
    if (this.state.tick === 1) {
      // await this.agent.runInputGuardrails(this.context, ...?);
    }

    const req = await this.prepareModelRequest(this.history); // (TODO): how to get input for this tick?

    // if (this.mode === "stream") {
    // const stream = this.model.stream(input, {
    //   system: systemPrompt,
    //   tools: this.agent.tools /* [systools, tools] */,
    //   settings: this.agent.modelSettings,
    //   responseSchema: this.agent.responseType,
    // });
    // for await (const event of stream) {
    //   // handle streaming events
    // }
    // response = stream.collect(); // something like this
    // } else {
    const res = await this.model.generate(req);

    this.state.modelResponses.push(res);
    // this.stats.usage.add(response.usage);

    return this.parseModelResponse(res);
  }

  /**
   * Perform the actions returned by the model
   */
  private async performActions(
    intentions: ActionSet,
  ): Promise<PerformActionsResult> {
    // (TODO): refactor into a general actions system - probably shouldn't be handled by Thread
    const toolEvents = await this.executeTools(intentions.toolCalls);
    // const mcpEvents = await this.executeMCPRequests(actions.mcpRequests);

    // Separate events and pending approvals
    const actions: ThreadEvent[] = [];
    const pendingApprovals: ToolCall[] = [];

    // (TODO): clean this
    for (const e of toolEvents) {
      if (e.kind === "tool-result" && e.status === "requires_approval") {
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
          const tool = this.agent.tool(call.id);
          if (!tool) {
            throw new Error(`Tool ${call.id} not found`);
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
            name: call.name ?? call.id,
            status: res.status,
            result: res.result,
            error: res.error,
          };
        } catch (error) {
          // Handles both tool not found AND any execution errors
          return {
            kind: "tool-result" as const,
            callId: call.callId,
            name: call.name || call.id,
            status: "error" as const,
            result: undefined,
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
    input: ThreadEvent[],
  ): Promise<LanguageModelRequest> {
    let settings = {
      ...this.agent.modelSettings,
    };

    // // TODO: what do we want to do with this?
    // settings = maybeResetToolChoice(this.agent, this.state.toolUse, settings);

    const system = await this.agent.instructions(this.context);

    // TODO: apply custom input filters - arguably want global + agent-scoped -> apply in a middleware-like chain
    // const filtered = await applyInputFilters(input, context);

    const filtered = input;

    // serialize action repertoire
    const allTools = await this.agent.tools(this.context);
    const enabled = await filter(
      allTools,
      async (tool) => await tool.isEnabled(this.context, this.agent),
    );
    const tools = enabled.map((tool) => tool.serialize());

    return {
      system,
      input: filtered,
      modelSettings: settings,
      tools,
      tracing: false, // TODO: make this configurable
    };
  }

  /**
   * @internal
   * Parses the model's response into events (for history) and actions (for execution).
   */
  private parseModelResponse(res: LanguageModelResponse): TickResult {
    const events: ThreadEvent[] = [];
    const toolCalls: ToolCall[] = [];

    for (const event of res.events) {
      switch (event.kind) {
        case "tool-call":
          // Add to both actions (for execution) and events (for history)
          toolCalls.push(event);
        // fallthrough
        default:
          events.push(event);
          break;
      }
    }

    return {
      events,
      intentions: toolCalls.length > 0 ? { toolCalls } : null,
    };
  }
}

/**
 * ThreadState tracks the execution state of a single thread.
 *
 * A thread is created each time a task is scheduled and executes
 * the main tick() loop until terminal state.
 */
export class ThreadState {
  tick: number /* current tick number (starts at 0, increments on each model call) */;
  modelResponses: LanguageModelResponse[] /* all model responses received during this thread's execution */;

  constructor() {
    this.tick = 0;
    this.modelResponses = [];
  }

  // /**
  //  * Check if the thread is in a terminal state - true when last event is an assistant
  //  * message with no tool calls
  //  */
  // isTerminal(): boolean {
  //   if (this.history.length === 0) return false;

  //   const lastEvent = this.history[this.history.length - 1];
  //   return lastEvent.kind === "message" && lastEvent.role === "assistant";
  // }
}

/**
 * Common thread options shared between streaming and non-streaming execution pathways.
 */
type SharedThreadOptions<TContext = undefined> = {
  context?: TContext | Context<TContext>;
  maxTurns?: number;
  abort?: AbortSignal;
  conversationId?: string;
  // sessionInputCallback?: SessionInputCallback;
  // callModelInputFilter?: CallModelInputFilter;
};

// /**
//  * The result of an agent run in streaming mode.
//  */
// export class StreamedRunResult<
//     TContext,
//     TAgent extends Agent<TContext, AgentResponseType>,
//   >
//   extends RunResultBase<TContext, TAgent>
//   implements AsyncIterable<ThreadStreamEvent>
// {
//   /**
//    * The current agent that is running
//    */
//   public get currentAgent(): TAgent | undefined {
//     return this.lastAgent;
//   }

//   /**
//    * The current turn number
//    */
//   public currentTurn: number = 0;

//   /**
//    * The maximum number of turns that can be run
//    */
//   public maxTurns: number | undefined;

//   #error: unknown = null;
//   #signal?: AbortSignal;
//   #readableController:
//     | ReadableStreamDefaultController<ThreadStreamEvent>
//     | undefined;
//   #readableStream: ReadableStream<ThreadStreamEvent>;
//   #completedPromise: Promise<void>;
//   #completedPromiseResolve: (() => void) | undefined;
//   #completedPromiseReject: ((err: unknown) => void) | undefined;
//   #cancelled: boolean = false;
//   #streamLoopPromise: Promise<void> | undefined;

//   constructor(
//     result: {
//       state: ThreadState<TContext, TAgent>;
//       signal?: AbortSignal;
//     } = {} as any,
//   ) {
//     super(result.state);

//     this.#signal = result.signal;

//     this.#readableStream = new ReadableStream<ThreadStreamEvent>({
//       start: (controller) => {
//         this.#readableController = controller;
//       },
//       cancel: () => {
//         this.#cancelled = true;
//       },
//     });

//     this.#completedPromise = new Promise((resolve, reject) => {
//       this.#completedPromiseResolve = resolve;
//       this.#completedPromiseReject = reject;
//     });

//     if (this.#signal) {
//       const handleAbort = () => {
//         if (this.#cancelled) {
//           return;
//         }

//         this.#cancelled = true;

//         const controller = this.#readableController;
//         this.#readableController = undefined;

//         if (this.#readableStream.locked) {
//           if (controller) {
//             try {
//               controller.close();
//             } catch (err) {
//               logger.debug(`Failed to close readable stream on abort: ${err}`);
//             }
//           }
//         } else {
//           void this.#readableStream
//             .cancel(this.#signal?.reason)
//             .catch((err) => {
//               logger.debug(`Failed to cancel readable stream on abort: ${err}`);
//             });
//         }

//         this.#completedPromiseResolve?.();
//       };

//       if (this.#signal.aborted) {
//         handleAbort();
//       } else {
//         this.#signal.addEventListener("abort", handleAbort, { once: true });
//       }
//     }
//   }

//   /**
//    * @internal
//    * Adds an item to the stream of output items
//    */
//   _addItem(item: ThreadStreamEvent) {
//     if (!this.cancelled) {
//       this.#readableController?.enqueue(item);
//     }
//   }

//   /**
//    * @internal
//    * Indicates that the stream has been completed
//    */
//   _done() {
//     if (!this.cancelled && this.#readableController) {
//       this.#readableController.close();
//       this.#readableController = undefined;
//       this.#completedPromiseResolve?.();
//     }
//   }

//   /**
//    * @internal
//    * Handles an error in the stream loop.
//    */
//   _raiseError(err: unknown) {
//     if (!this.cancelled && this.#readableController) {
//       this.#readableController.error(err);
//       this.#readableController = undefined;
//     }
//     this.#error = err;
//     this.#completedPromiseReject?.(err);
//     this.#completedPromise.catch((e) => {
//       logger.debug(`Resulted in an error: ${e}`);
//     });
//   }

//   /**
//    * Returns true if the stream has been cancelled.
//    */
//   get cancelled(): boolean {
//     return this.#cancelled;
//   }

//   /**
//    * Returns the underlying readable stream.
//    * @returns A readable stream of the agent run.
//    */
//   toStream(): ReadableStream<ThreadStreamEvent> {
//     return this.#readableStream as ReadableStream<ThreadStreamEvent>;
//   }

//   /**
//    * Await this promise to ensure that the stream has been completed if you are not consuming the
//    * stream directly.
//    */
//   get completed() {
//     return this.#completedPromise;
//   }

//   /**
//    * Error thrown during the run, if any.
//    */
//   get error() {
//     return this.#error;
//   }

//   /**
//    * Returns a readable stream of the final text output of the agent run.
//    *
//    * @returns A readable stream of the final output of the agent run.
//    * @remarks Pass `{ compatibleWithNodeStreams: true }` to receive a Node.js compatible stream
//    * instance.
//    */
//   toTextStream(): ReadableStream<string>;
//   toTextStream(options?: { compatibleWithNodeStreams: true }): Readable;
//   toTextStream(options?: {
//     compatibleWithNodeStreams?: false;
//   }): ReadableStream<string>;
//   toTextStream(
//     options: { compatibleWithNodeStreams?: boolean } = {},
//   ): Readable | ReadableStream<string> {
//     const stream = this.#readableStream.pipeThrough(
//       new TransformStream<ThreadStreamEvent, string>({
//         transform(event, controller) {
//           if (
//             event.kind === "raw_model_stream_event" && // (TODO): what to do here?
//             event.data.kind === "text-delta"
//           ) {
//             const item = TextDeltaEvent.parse(event); // ??
//             controller.enqueue(item.text); // (TODO): is it just the text that we want to return here?
//           }
//         },
//       }),
//     );

//     if (options.compatibleWithNodeStreams) {
//       return Readable.fromWeb(stream);
//     }

//     return stream as ReadableStream<string>;
//   }

//   [Symbol.asyncIterator](): AsyncIterator<ThreadStreamEvent> {
//     return this.#readableStream[Symbol.asyncIterator]();
//   }

//   /**
//    * @internal
//    * Sets the stream loop promise that completes when the internal stream loop finishes.
//    * This is used to defer trace end until all agent work is complete.
//    */
//   _setStreamLoopPromise(promise: Promise<void>) {
//     this.#streamLoopPromise = promise;
//   }

//   /**
//    * @internal
//    * Returns a promise that resolves when the stream loop completes.
//    * This is used by the tracing system to wait for all agent work before ending the trace.
//    */
//   _getStreamLoopPromise(): Promise<void> | undefined {
//     return this.#streamLoopPromise;
//   }
// }
