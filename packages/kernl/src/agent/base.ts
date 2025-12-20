import type { Context, UnknownContext } from "@/context";
import type { Tool, BaseToolkit } from "@/tool";

/**
 * Base interface for all agent types.
 *
 * Defines the common shape shared between text-based agents (Agent)
 * and realtime agents (RealtimeAgent).
 */
export interface BaseAgent<TContext = UnknownContext> {
  /**
   * Unique identifier for the agent.
   */
  readonly id: string;

  /**
   * Display name for the agent.
   */
  readonly name: string;

  /**
   * A brief description of the agent's purpose.
   */
  readonly description?: string;

  /**
   * The instructions for the agent.
   */
  readonly instructions: (
    context: Context<TContext>,
  ) => Promise<string> | string;

  /**
   * Toolkits available to the agent.
   */
  readonly toolkits: BaseToolkit<TContext>[];

  /**
   * Get a specific tool by ID from all toolkits.
   */
  tool(id: string): Tool<TContext> | undefined;

  /**
   * Get all tools available from all toolkits for the given context.
   */
  tools(context: Context<TContext>): Promise<Tool<TContext>[]>;
}
