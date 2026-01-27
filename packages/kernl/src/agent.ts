import {
  message,
  LanguageModel,
  LanguageModelItem,
  LanguageModelRequestSettings,
} from "@kernl-sdk/protocol";

import { Thread } from "./thread";
import type {
  RThreadsListParams,
  RThreadCreateParams,
  RThreadGetOptions,
  RThreadHistoryParams,
  RThreadUpdateParams,
} from "@/api/resources/threads/types";
import { Context, type UnknownContext } from "./context";
import type { ResolvedAgentResponse } from "./agent/types";
import { BaseAgent } from "./agent/base";

import { MisconfiguredError, RuntimeError } from "./error";

import type {
  AgentConfig,
  AgentMemoryConfig,
  AgentOutputType,
} from "./agent/types";
import { pipe, type Pipe } from "./thread/pipe";
import type {
  TextOutput,
  ThreadExecuteOptions,
  ThreadExecuteResult,
  ThreadStreamEvent,
} from "./thread/types";

export class Agent<
    TContext = UnknownContext,
    TOutput extends AgentOutputType = TextOutput,
  >
  extends BaseAgent<TContext, TOutput>
  implements AgentConfig<TContext, TOutput>
{
  readonly kind = "llm";
  readonly model: LanguageModel;
  readonly modelSettings: LanguageModelRequestSettings;
  readonly memory?: AgentMemoryConfig<TContext>;
  readonly processors: { pre: Pipe; post: Pipe };
  readonly output: TOutput = "text" as TOutput;

  constructor(config: AgentConfig<TContext, TOutput>) {
    super(config);

    this.model = config.model;
    this.modelSettings = config.modelSettings ?? {};
    this.memory = config.memory;
    this.processors = {
      pre: config.processors?.pre ?? pipe,
      post: config.processors?.post ?? pipe,
    };
    if (config.output) {
      this.output = config.output;
    }
  }

  /**
   * Thread management scoped to this agent.
   *
   * Convenience wrapper around kernl.threads that automatically filters to this agent's threads.
   */
  get threads() {
    if (!this.kernl) {
      throw new MisconfiguredError(
        `Agent ${this.id} not bound to kernl. Call kernl.register(agent) first.`,
      );
    }

    const agentId = this.id;
    const kthreads = this.kernl.threads;

    return {
      get: (tid: string, options?: RThreadGetOptions) =>
        kthreads.get(tid, options),
      list: (params: Omit<RThreadsListParams, "agentId"> = {}) =>
        kthreads.list({ ...params, agentId }),
      delete: (tid: string) => kthreads.delete(tid),
      history: (tid: string, params?: RThreadHistoryParams) =>
        kthreads.history(tid, params),
      create: (params: Omit<RThreadCreateParams, "agentId" | "model">) =>
        kthreads.create({
          ...params,
          agentId,
          model: {
            provider: this.model.provider,
            modelId: this.model.modelId,
          },
        }),
      update: (tid: string, patch: RThreadUpdateParams) =>
        kthreads.update(tid, patch),
    };
  }

  /**
   * Blocking execution - spawns or resumes thread and waits for completion
   *
   * @throws {RuntimeError} If the specified thread is already running (concurrent execution not allowed)
   * @throws {MisconfiguredError} If the agent is not bound to a kernl instance
   */
  async run(
    input: string | LanguageModelItem[],
    options?: ThreadExecuteOptions<TContext>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>> {
    let thread: Thread<TContext, TOutput> | null = null;

    if (!this.kernl) {
      throw new MisconfiguredError(
        `Agent ${this.id} not bound to kernl. Call kernl.register(agent) first.`,
      );
    }

    const tid = options?.threadId;
    if (tid) {
      // no concurrent execution of same thread - correctness contract
      // TODO: race condition - need to check again after async storage.get()
      if (this.kernl.athreads.has(tid)) {
        throw new RuntimeError(`Thread ${tid} is already running.`);
      }

      // try to resume from storage if available
      if (this.kernl.storage?.threads) {
        thread = (await this.kernl.storage.threads.get(tid, {
          history: true,
        })) as Thread<TContext, TOutput> | null;
      }
    }

    const items =
      typeof input === "string"
        ? [message({ role: "user", text: input })]
        : input;

    // create new thread if not found in storage or no tid provided
    if (!thread) {
      const ctx = options?.context
        ? new Context<TContext>(options?.namespace ?? "kernl", options.context)
        : undefined;

      thread = new Thread({
        agent: this,
        input: items,
        context: ctx,
        model: options?.model,
        task: options?.task,
        tid: options?.threadId,
        namespace: options?.namespace,
        storage: this.kernl.storage?.threads,
        abort: options?.abort,
      });
      return this.kernl.spawn(thread);
    }

    // resume existing thread from storage
    if (options?.context) {
      thread.context.context = options.context;
    }
    if (options?.model) {
      thread.model = options.model;
    }
    thread._abort = options?.abort;

    thread.append(...items);
    return this.kernl.schedule(thread);
  }

  /**
   * Streaming execution - spawns or resumes thread and returns async iterator
   *
   * NOTE: streaming probably won't make sense in scheduling contexts so spawnStream etc. won't make sense
   *
   * @throws {RuntimeError} If the specified thread is already running (concurrent execution not allowed)
   * @throws {MisconfiguredError} If the agent is not bound to a kernl instance
   */
  async *stream(
    input: string | LanguageModelItem[],
    options?: ThreadExecuteOptions<TContext>,
  ): AsyncIterable<ThreadStreamEvent> {
    if (!this.kernl) {
      throw new MisconfiguredError(
        `Agent ${this.id} not bound to kernl. Call kernl.register(agent) first.`,
      );
    }

    const items =
      typeof input === "string"
        ? [message({ role: "user", text: input })]
        : input;
    const tid = options?.threadId;

    let thread: Thread<TContext, TOutput> | null = null;

    if (tid) {
      // no concurrent execution of same thread - correctness contract
      // TODO: race condition - need to check again after async storage.get()
      if (this.kernl.athreads.has(tid)) {
        throw new RuntimeError(`Thread ${tid} is already running.`);
      }

      // try to resume from storage if available
      if (this.kernl.storage?.threads) {
        thread = (await this.kernl.storage.threads.get(tid, {
          history: true,
        })) as Thread<TContext, TOutput> | null;
      }
    }

    // create new thread if not found in storage or no tid provided
    if (!thread) {
      const ctx = options?.context
        ? new Context<TContext>(options?.namespace ?? "kernl", options.context)
        : undefined;

      thread = new Thread({
        agent: this,
        input: items,
        context: ctx,
        model: options?.model,
        task: options?.task,
        tid: options?.threadId,
        namespace: options?.namespace,
        storage: this.kernl.storage?.threads,
        abort: options?.abort,
      });
      yield* this.kernl.spawnStream(thread);
      return;
    }

    // resume existing thread from storage
    if (options?.context) {
      thread.context.context = options.context;
    }
    if (options?.model) {
      thread.model = options.model;
    }
    thread._abort = options?.abort;
    thread.append(...items);
    yield* this.kernl.scheduleStream(thread);
  }
}
