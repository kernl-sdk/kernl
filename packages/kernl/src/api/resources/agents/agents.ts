import type { Agent } from "@/agent";
import type { AgentOutputType } from "@/agent/types";
import type { UnknownContext } from "@/context";
import type { TextOutput } from "@/thread/types";

/**
 * Agents resource.
 *
 * Thin facade over the in-process agent registry, returning live Agent instances.
 *
 * Note: agents are code, not persisted data; this is process-local.
 */
export class RAgents {
  constructor(private readonly registry: Map<string, Agent>) {}

  /**
   * Get a live Agent instance by id.
   *
   * Callers are expected to know the concrete TContext/TOutput types
   * for their own agents and can specify them via generics.
   */
  get<
    TContext = UnknownContext,
    TOutput extends AgentOutputType = TextOutput,
  >(id: string): Agent<TContext, TOutput> | undefined {
    const agent = this.registry.get(id);
    return agent as Agent<TContext, TOutput> | undefined;
  }

  /**
   * Check if an agent with the given id is registered.
   */
  has(id: string): boolean {
    return this.registry.has(id);
  }

  /**
   * List all registered agents as live instances.
   *
   * Since this is a heterogeneous collection, we expose the widest safe
   * type parameters here.
   */
  list(): Agent<UnknownContext, AgentOutputType>[] {
    return Array.from(this.registry.values()) as Agent<
      UnknownContext,
      AgentOutputType
    >[];
  }

  /**
   * Unregister an agent at runtime.
   */
  unregister(id: string): boolean {
    return this.registry.delete(id);
  }
}
