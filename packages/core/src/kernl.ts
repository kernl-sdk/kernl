import { Agent } from "./agent";
import { UnknownContext } from "./context";
import { KernlHooks } from "./lifecycle";

import type { AgentResponseType } from "./types/agent";

/**
 * Central coordinator for the entire application.
 *
 * Orchestrates agent execution, including guardrails, tool calls, session persistence, and
 * tracing.
 */
export class Kernl extends KernlHooks<UnknownContext, AgentResponseType> {
  private agents: Map<string, Agent> = new Map();

  /**
   * Registers a new agent with the kernl instance.
   */
  register(agent: Agent): void {
    // TODO: Implement agent registration
  }
}
