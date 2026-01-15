import { Agent } from "@/agent";
import type { AgentOutputType } from "@/agent/types";
import type { UnknownContext } from "@/context";
import type { AgentRegistry } from "@/kernl/registry";
import type { TextOutput } from "@/thread/types";

/**
 * Agents resource.
 *
 * Thin facade over the in-process agent registry, returning live Agent instances.
 *
 * Note: agents are code, not persisted data; this is process-local.
 *
 * Currently only exposes LLM agents (kind: "llm"). RealtimeAgents are stored
 * in the internal registry but not returned by these methods. If public access
 * to realtime agents is needed, add a separate `kernl.realtimeAgents` resource.
 */
export class RAgents {
  constructor(private readonly registry: AgentRegistry) {}

  /**
   * Get a live Agent instance by id.
   *
   * Only returns LLM agents. Returns undefined for realtime agents.
   *
   * Callers are expected to know the concrete TContext/TOutput types
   * for their own agents and can specify them via generics.
   */
  get<
    TContext = UnknownContext,
    TOutput extends AgentOutputType = TextOutput,
  >(id: string): Agent<TContext, TOutput> | undefined {
    const agent = this.registry.get(id);
    if (agent?.kind === "llm") {
      return agent as Agent<TContext, TOutput>;
    }
    return undefined;
  }

  /**
   * Check if an LLM agent with the given id is registered.
   */
  has(id: string): boolean {
    return this.registry.get(id)?.kind === "llm";
  }

  /**
   * List all registered LLM agents as live instances.
   */
  list(): Agent<UnknownContext, AgentOutputType>[] {
    return Array.from(this.registry.values()).filter(
      (a): a is Agent<UnknownContext, AgentOutputType> => a.kind === "llm",
    );
  }

  /**
   * Unregister an agent at runtime.
   */
  unregister(id: string): boolean {
    return this.registry.unregister(id);
  }
}
