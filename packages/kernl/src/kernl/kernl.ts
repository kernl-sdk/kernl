import type { LanguageModel } from "@kernl-sdk/protocol";
import { resolveEmbeddingModel } from "@kernl-sdk/retrieval";

import { BaseAgent } from "@/agent/base";
import { KernlHooks } from "@/lifecycle";
import type { Thread } from "@/thread";
import type { ResolvedAgentResponse } from "@/guardrail";
import { InMemoryStorage, type KernlStorage } from "@/storage";
import {
  Memory,
  MemoryByteEncoder,
  MemoryIndexHandle,
  MemoryStore,
  buildMemoryIndexSchema,
} from "@/memory";
import { setSubscriber, clearSubscriber, type Subscriber } from "@/tracing";

import { logger } from "@/lib/logger";
import { RThreads } from "@/api/resources/threads";
import { RAgents } from "@/api/resources/agents";
import type { ThreadExecuteResult, ThreadStreamEvent } from "@/thread/types";
import type { AgentOutputType } from "@/agent/types";

import type { KernlOptions, MemoryOptions, StorageOptions } from "./types";
import { AgentRegistry, ModelRegistry } from "./registry";

/**
 * The kernl - manages agent processes, scheduling, and task lifecycle.
 *
 * Orchestrates agent execution, including guardrails, tool calls, session persistence, and
 * tracing.
 */
export class Kernl extends KernlHooks {
  private readonly _agents: AgentRegistry;
  private readonly _models: ModelRegistry;
  private readonly _memopts: MemoryOptions | undefined;
  private readonly _storopts: StorageOptions | undefined;
  private readonly _subscriber: Subscriber | null = null;

  readonly storage: KernlStorage;
  athreads: Map<string, Thread<any, any>> = new Map(); /* active threads */

  private warnings = {
    embedding: false, // "Embeddings are not configured. If you want memories to auto-embed text content..."
    vector: false, // "No vector storage configured. The memories.search() function will not be..."
  }; /* tracks warnings that have been logged */

  // --- public API ---
  readonly threads: RThreads;
  readonly agents: RAgents;
  readonly memories: MemoryStore;

  constructor(options: KernlOptions = {}) {
    super();

    this._memopts = options.memory;
    this._storopts = options.storage;

    this._agents = new AgentRegistry();
    this._models = new ModelRegistry();
    this.storage = options.storage?.db ?? new InMemoryStorage();
    this.storage.bind({ agents: this._agents, models: this._models });
    this.threads = new RThreads(this.storage.threads);
    this.agents = new RAgents(this._agents);
    this.memories = this.initmem();

    // wire tracing
    if (options.tracer) {
      this._subscriber = options.tracer;
      setSubscriber(this._subscriber);
    }
  }

  /**
   * Registers a new agent with the kernl instance.
   */
  register(agent: BaseAgent<any>): void {
    this._agents.register(agent);
    agent.bind(this);

    // memory config warnings (log once)
    if (agent.memory.enabled) {
      if (!this._memopts?.embedding && !this.warnings.embedding) {
        logger.warn(
          "Embeddings are not configured. If you want memories to auto-embed text content, " +
            "pass an embedding model into the memory config in new Kernl()",
        );
        this.warnings.embedding = true;
      }

      if (!this._storopts?.vector && !this.warnings.vector) {
        logger.warn(
          "No vector storage configured. The memories.search() function will not be " +
            "available. To enable memory search, pass storage.vector in new Kernl()",
        );
        this.warnings.vector = true;
      }
    }

    // auto-populate model registry for storage hydration (llm agents only - for now)
    if (agent.kind === "llm") {
      this._models.register(agent.model as LanguageModel);
    }
  }

  /**
   * Spawn a new thread - blocking execution
   */
  async spawn<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>> {
    this._models.register(thread.model);
    this.athreads.set(thread.tid, thread);
    try {
      return await thread.execute();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }

  /**
   * Schedule an existing thread - blocking execution
   *
   * NOTE: just blocks for now
   */
  async schedule<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>> {
    this._models.register(thread.model);
    this.athreads.set(thread.tid, thread);
    try {
      return await thread.execute();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }

  /**
   * (TMP) - won't make sense in async scheduling contexts
   *
   * Spawn a new thread - streaming execution
   */
  async *spawnStream<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): AsyncIterable<ThreadStreamEvent> {
    this._models.register(thread.model);
    this.athreads.set(thread.tid, thread);
    try {
      yield* thread.stream();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }

  /**
   * (TMP) - won't make sense with async scheduling contexts
   *
   * Schedule an existing thread - streaming execution
   */
  async *scheduleStream<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): AsyncIterable<ThreadStreamEvent> {
    this._models.register(thread.model);
    this.athreads.set(thread.tid, thread);
    try {
      yield* thread.stream();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }

  // --- private utils ---

  /**
   * @internal
   *
   * Initialize the memory system based on the storage + memory configuration.
   */
  private initmem(): Memory {
    const embeddingModel = this._memopts?.embedding;
    const embedder = embeddingModel
      ? typeof embeddingModel === "string"
        ? resolveEmbeddingModel<string>(embeddingModel)
        : embeddingModel
      : undefined;
    const encoder = new MemoryByteEncoder(embedder);

    const vector = this._storopts?.vector;
    const indexId = this._memopts?.indexId ?? "memories_sindex";
    const dimensions = this._memopts?.dimensions ?? 1536;
    const providerOptions = this._memopts?.indexProviderOptions ?? {
      schema: "kernl",
    };

    return new Memory({
      store: this.storage.memories,
      search: vector
        ? new MemoryIndexHandle({
            index: vector,
            indexId,
            schema: buildMemoryIndexSchema({ dimensions }),
            providerOptions,
          })
        : undefined,
      encoder,
    });
  }

  /**
   * Gracefully shutdown the Kernl instance.
   * Flushes and shuts down tracing subscribers, closes storage connections.
   */
  async shutdown(timeout?: number): Promise<void> {
    if (this._subscriber) {
      await this._subscriber.flush();
      await this._subscriber.shutdown(timeout);
      clearSubscriber();
    }
    // TODO: close storage connections when storage supports it
  }
}
