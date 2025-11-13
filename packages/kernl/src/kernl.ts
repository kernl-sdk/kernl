import { Agent } from "./agent";
import { UnknownContext } from "./context";
import { KernlHooks } from "./lifecycle";
import type { Thread } from "./thread";

import type { AgentResponseType } from "./types/agent";
import type { ThreadExecuteResult, ThreadStreamEvent } from "./types/thread";
import type { ResolvedAgentResponse } from "./guardrail";

/**
 * The kernl - manages agent processes, scheduling, and task lifecycle
 *
 * Orchestrates agent execution, including guardrails, tool calls, session persistence, and
 * tracing.
 */
export class Kernl extends KernlHooks<UnknownContext, AgentResponseType> {
  private agents: Map<string, Agent> = new Map();
  threads: Map<string, Thread<any, any>> = new Map();

  /**
   * Registers a new agent with the kernl instance.
   */
  register(agent: Agent): void {
    this.agents.set(agent.id, agent);
    agent.bind(this);
  }

  /**
   * Spawn a new thread - blocking execution
   */
  async spawn<TContext, TResponse extends AgentResponseType>(
    thread: Thread<TContext, TResponse>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TResponse>>> {
    this.threads.set(thread.id, thread);
    return await thread.execute();
  }

  /**
   * Schedule an existing thread - blocking execution
   *
   * NOTE: just blocks for now
   */
  async schedule<TContext, TResponse extends AgentResponseType>(
    thread: Thread<TContext, TResponse>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TResponse>>> {
    return await thread.execute();
  }

  /**
   * (TMP) - probably won't make sense with assync scheduling contexts
   *
   * Spawn a new thread - streaming execution
   */
  async *spawnStream<TContext, TResponse extends AgentResponseType>(
    thread: Thread<TContext, TResponse>,
  ): AsyncIterable<ThreadStreamEvent> {
    this.threads.set(thread.id, thread);
    yield* thread.stream();
  }

  /**
   * (TMP) - probably won't make sense with assync scheduling contexts
   *
   * Schedule an existing thread - streaming execution
   */
  async *scheduleStream<TContext, TResponse extends AgentResponseType>(
    thread: Thread<TContext, TResponse>,
  ): AsyncIterable<ThreadStreamEvent> {
    yield* thread.stream();
  }
}
