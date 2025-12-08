/**
 * /packages/kernl/src/agent.ts
 */

import {
  message,
  LanguageModel,
  LanguageModelItem,
  LanguageModelRequestSettings,
} from "@kernl-sdk/protocol";

import { Thread } from "./thread";
import type { Kernl } from "./kernl";
import type {
  RThreadsListParams,
  RThreadCreateParams,
  RThreadGetOptions,
  RThreadHistoryParams,
  RThreadUpdateParams,
} from "@/api/resources/threads/types";
import type { Context, UnknownContext } from "./context";
import { Tool, memory } from "./tool";
import { BaseToolkit } from "./tool/toolkit";
import {
  InputGuardrail,
  OutputGuardrail,
  type ResolvedAgentResponse,
} from "./guardrail";
import { AgentHooks } from "./lifecycle";
import type {
  AgentMemoryCreate,
  AgentMemoryUpdate,
  MemoryListOptions,
  MemorySearchQuery,
} from "./memory";

import { randomID } from "@kernl-sdk/shared/lib";
import { MisconfiguredError, RuntimeError } from "./lib/error";

/* types */
import type {
  AgentConfig,
  AgentMemoryConfig,
  AgentOutputType,
} from "./agent/types";
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
  extends AgentHooks<TContext, TOutput>
  implements AgentConfig<TContext, TOutput>
{
  private kernl?: Kernl;

  id: string;
  name: string;
  description?: string;
  instructions: (context: Context<TContext>) => Promise<string> | string;

  model: LanguageModel;
  modelSettings: LanguageModelRequestSettings;
  // actions: ActionSet; /* TODO */
  toolkits: BaseToolkit<TContext>[];
  systools: BaseToolkit<TContext>[];
  memory: AgentMemoryConfig;

  guardrails: {
    input: InputGuardrail[];
    output: OutputGuardrail<AgentOutputType>[];
  };
  output: TOutput = "text" as TOutput;
  resetToolChoice: boolean;

  constructor(config: AgentConfig<TContext, TOutput>) {
    super();
    if (config.id.trim() === "") {
      throw new MisconfiguredError("Agent must have an id.");
    }
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.instructions =
      typeof config.instructions === "function"
        ? config.instructions
        : () => config.instructions as string;
    this.model = config.model; // (TODO): include optional default setting for convenience like env.DEFAULT_LLM = "gpt-5"
    this.modelSettings = config.modelSettings ?? {};

    this.toolkits = config.toolkits ?? [];
    this.systools = [];
    this.memory = config.memory ?? { enabled: false };

    for (const toolkit of this.toolkits) {
      toolkit.bind(this);
    }

    this.guardrails = config.guardrails ?? { input: [], output: [] };
    if (config.output) {
      this.output = config.output;
    }
    this.resetToolChoice = config.resetToolChoice ?? true;
    // this.toolUseBehavior = config.toolUseBehavior ?? "run_llm_again";
  }

  /**
   * Bind this agent to a kernl instance. Called by kernl.register().
   */
  bind(kernl: Kernl): void {
    this.kernl = kernl;

    // initialize system toolkits
    if (this.memory.enabled) {
      // safety: system tools only rely on ctx.agent, not ctx.context
      const toolkit = memory as unknown as BaseToolkit<TContext>;
      this.systools.push(toolkit);
      toolkit.bind(this);
    }
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
      thread = new Thread({
        agent: this,
        input: items,
        context: options?.context,
        model: options?.model,
        task: options?.task,
        tid: options?.threadId,
        namespace: options?.namespace,
        storage: this.kernl.storage?.threads,
      });
      return this.kernl.spawn(thread);
    }

    // resume existing thread from storage
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
      thread = new Thread({
        agent: this,
        input: items,
        context: options?.context,
        model: options?.model,
        task: options?.task,
        tid: options?.threadId,
        namespace: options?.namespace,
        storage: this.kernl.storage?.threads,
      });
      yield* this.kernl.spawnStream(thread);
      return;
    }

    // resume existing thread from storage
    thread.append(...items);
    yield* this.kernl.scheduleStream(thread);
  }

  /**
   * @internal
   *
   * Get a specific tool by ID from systools and toolkits.
   *
   * @param id The tool ID to look up
   * @returns The tool if found, undefined otherwise
   */
  tool(id: string): Tool<TContext> | undefined {
    // Check systools first
    for (const toolkit of this.systools) {
      const tool = toolkit.get(id);
      if (tool) return tool;
    }
    // Then user toolkits
    for (const toolkit of this.toolkits) {
      const tool = toolkit.get(id);
      if (tool) return tool;
    }
    return undefined;
  }

  /**
   * @internal
   *
   * Get all tools available from systools and toolkits for the given context.
   * Checks for duplicate tool IDs across toolkits and throws an error if found.
   *
   * (TODO): Consider returning toolkits alongside tools so we can serialize them
   * together and give agents more options for dealing with tool groups.
   *
   * @param context The context to use for filtering tools
   * @returns Array of all available tools
   * @throws {MisconfiguredError} If duplicate tool IDs are found across toolkits
   */
  async tools(context: Context<TContext>): Promise<Tool<TContext>[]> {
    const all: Tool<TContext>[] = [];

    for (const toolkit of [...this.systools, ...this.toolkits]) {
      all.push(...(await toolkit.list(context)));
    }

    const ids = all.map((t) => t.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);

    if (duplicates.length > 0) {
      throw new MisconfiguredError(
        `Duplicate tool IDs found: ${[...new Set(duplicates)].join(", ")}`,
      );
    }

    return all;
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
   * Memory management scoped to this agent.
   *
   * Provides a simplified API for creating memories with:
   * - Auto-generated IDs
   * - Flattened scope fields (namespace, entityId) - agentId is implicit
   * - Default kind of "semantic"
   *
   * @example
   * ```ts
   * await agent.memories.create({
   *   namespace: "user-123",
   *   collection: "preferences",
   *   content: { text: "User prefers TypeScript" },
   * });
   * ```
   */
  get memories() {
    if (!this.kernl) {
      throw new MisconfiguredError(
        `Agent ${this.id} not bound to kernl. Call kernl.register(agent) first.`,
      );
    }

    const agentId = this.id;
    const kmem = this.kernl.memories;

    return {
      /**
       * List memories scoped to this agent.
       */
      list: (
        params?: Omit<MemoryListOptions, "filter"> & {
          collection?: string;
          limit?: number;
          // (TODO): we might want to add the filter back here
        },
      ) =>
        kmem.list({
          filter: {
            scope: { agentId },
            collections: params?.collection ? [params.collection] : undefined,
          },
          limit: params?.limit,
        }),

      /**
       * Create a new memory scoped to this agent.
       */
      create: (params: AgentMemoryCreate) =>
        kmem.create({
          id: params.id ?? `mem_${randomID()}`,
          scope: {
            namespace: params.namespace,
            entityId: params.entityId,
            agentId,
          },
          kind: "semantic",
          collection: params.collection,
          content: params.content,
          wmem: params.wmem,
          smem: params.smem,
          timestamp: params.timestamp,
          metadata: params.metadata,
        }),

      /**
       * Update an existing memory scoped to this agent.
       */
      update: (params: AgentMemoryUpdate) =>
        kmem.update({
          id: params.id,
          content: params.content,
          collection: params.collection,
          wmem: params.wmem,
          smem: params.smem,
          metadata: params.metadata,
        }),

      /**
       * Search memories scoped to this agent.
       */
      search: (
        params: Omit<MemorySearchQuery, "filter"> & {
          // (TODO): is this correct?
          filter?: Omit<NonNullable<MemorySearchQuery["filter"]>, "scope"> & {
            scope?: Omit<
              NonNullable<NonNullable<MemorySearchQuery["filter"]>["scope"]>,
              "agentId"
            >;
          };
        },
      ) =>
        kmem.search({
          ...params,
          filter: {
            ...params.filter,
            scope: {
              ...params.filter?.scope,
              agentId,
            },
          },
        }),
    };
  }
}
