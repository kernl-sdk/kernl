/**
 * /packages/kernl/src/kernl/kernl.ts
 */
import type { LanguageModel } from "@kernl-sdk/protocol";
import { resolveEmbeddingModel } from "@kernl-sdk/retrieval";

import { Agent } from "@/agent";
import { UnknownContext } from "@/context";
import { KernlHooks } from "@/lifecycle";
import type { Thread } from "@/thread";
import type { ResolvedAgentResponse } from "@/guardrail";
import { InMemoryStorage, type KernlStorage } from "@/storage";
import { RThreads } from "@/api/resources/threads";
import { RAgents } from "@/api/resources/agents";
import {
  Memory,
  MemoryByteEncoder,
  MemoryIndexHandle,
  buildMemoryIndexSchema,
} from "@/memory";

import type { ThreadExecuteResult, ThreadStreamEvent } from "@/thread/types";
import type { AgentOutputType } from "@/agent/types";

import type { KernlOptions } from "./types";

/**
 * The kernl - manages agent processes, scheduling, and task lifecycle.
 *
 * Orchestrates agent execution, including guardrails, tool calls, session persistence, and
 * tracing.
 */
export class Kernl extends KernlHooks<UnknownContext, AgentOutputType> {
  private readonly _agents: Map<string, Agent> = new Map();
  private readonly _models: Map<string, LanguageModel> = new Map();

  readonly storage: KernlStorage;
  athreads: Map<string, Thread<any, any>> = new Map(); /* active threads */

  // --- public API ---
  readonly threads: RThreads;
  readonly agents: RAgents;
  readonly memories: Memory;

  constructor(options: KernlOptions = {}) {
    super();
    this.storage = options.storage?.db ?? new InMemoryStorage();
    this.storage.bind({ agents: this._agents, models: this._models });
    this.threads = new RThreads(this.storage.threads);
    this.agents = new RAgents(this._agents);

    // initialize memory
    const embeddingModel =
      options.memory?.embeddingModel ?? "openai/text-embedding-3-small";
    const embedder =
      typeof embeddingModel === "string"
        ? resolveEmbeddingModel<string>(embeddingModel)
        : embeddingModel;
    const encoder = new MemoryByteEncoder(embedder);

    const vector = options.storage?.vector;
    const indexId = options.memory?.indexId ?? "memories_sindex";
    const dimensions = options.memory?.dimensions ?? 1536;
    const providerOptions = options.memory?.indexProviderOptions ?? { schema: "kernl" };

    this.memories = new Memory({
      store: this.storage.memories,
      search:
        vector !== undefined
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
   * Registers a new agent with the kernl instance.
   */
  register(agent: Agent): void {
    this._agents.set(agent.id, agent);
    agent.bind(this);

    // (TODO): implement exhaustive model registry in protocol/ package
    //
    // auto-populate model registry for storage hydration
    const key = `${agent.model.provider}/${agent.model.modelId}`;
    if (!this._models.has(key)) {
      this._models.set(key, agent.model);
    }
  }

  /**
   * Spawn a new thread - blocking execution
   */
  async spawn<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>> {
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
    this.athreads.set(thread.tid, thread);
    try {
      yield* thread.stream();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }
}
