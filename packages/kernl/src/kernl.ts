import type { LanguageModel } from "@kernl-sdk/protocol";

import { Agent } from "@/agent";
import { UnknownContext } from "@/context";
import { KernlHooks } from "@/lifecycle";
import type { Thread } from "@/thread";
import type { ResolvedAgentResponse } from "@/guardrail";
import { InMemoryStorage, type KernlStorage } from "@/storage";
import { RThreads } from "@/api/resources/threads";

import type { KernlOptions } from "@/types/kernl";
import type { ThreadExecuteResult, ThreadStreamEvent } from "@/types/thread";
import type { AgentResponseType } from "@/types/agent";

/**
 * The kernl - manages agent processes, scheduling, and task lifecycle.
 *
 * Orchestrates agent execution, including guardrails, tool calls, session persistence, and
 * tracing.
 */
export class Kernl extends KernlHooks<UnknownContext, AgentResponseType> {
  private agents: Map<string, Agent> = new Map();
  private models: Map<string, LanguageModel> = new Map();

  readonly storage: KernlStorage;
  athreads: Map<string, Thread<any, any>> = new Map(); /* active threads */

  // --- public API ---
  readonly threads: RThreads; /* Threads resource */

  constructor(options: KernlOptions = {}) {
    super();
    this.storage = options.storage?.db ?? new InMemoryStorage();
    this.storage.bind({ agents: this.agents, models: this.models });
    this.threads = new RThreads(this.storage.threads);
  }

  /**
   * Registers a new agent with the kernl instance.
   */
  register(agent: Agent): void {
    this.agents.set(agent.id, agent);
    agent.bind(this);

    // (TODO): implement exhaustive model registry in protocol/ package
    //
    // auto-populate model registry for storage hydration
    const key = `${agent.model.provider}/${agent.model.modelId}`;
    if (!this.models.has(key)) {
      this.models.set(key, agent.model);
    }
  }

  /**
   * Spawn a new thread - blocking execution
   */
  async spawn<TContext, TResponse extends AgentResponseType>(
    thread: Thread<TContext, TResponse>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TResponse>>> {
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
  async schedule<TContext, TResponse extends AgentResponseType>(
    thread: Thread<TContext, TResponse>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TResponse>>> {
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
  async *spawnStream<TContext, TResponse extends AgentResponseType>(
    thread: Thread<TContext, TResponse>,
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
  async *scheduleStream<TContext, TResponse extends AgentResponseType>(
    thread: Thread<TContext, TResponse>,
  ): AsyncIterable<ThreadStreamEvent> {
    this.athreads.set(thread.tid, thread);
    try {
      yield* thread.stream();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }
}
