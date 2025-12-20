import { Context, UnknownContext } from "@/context";
import { Tool, BaseToolkit } from "@/tool";
import { MisconfiguredError } from "@/lib/error";
import type { BaseAgent } from "@/agent/base";

import type { RealtimeAgentConfig, RealtimeAgentVoiceConfig } from "./types";

/**
 * A realtime agent definition.
 *
 * Stateless configuration that describes what a realtime voice agent does.
 * Create sessions with `new RealtimeSession(agent, options)`.
 */
export class RealtimeAgent<TContext = UnknownContext>
  implements BaseAgent<TContext>
{
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly instructions: (context: Context<TContext>) => Promise<string> | string;
  readonly toolkits: BaseToolkit<TContext>[];
  readonly voice?: RealtimeAgentVoiceConfig;

  constructor(config: RealtimeAgentConfig<TContext>) {
    if (config.id.trim() === "") {
      throw new MisconfiguredError("RealtimeAgent must have an id.");
    }

    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.instructions =
      typeof config.instructions === "function"
        ? config.instructions
        : () => config.instructions as string;
    this.toolkits = config.toolkits ?? [];
    this.voice = config.voice;

    for (const toolkit of this.toolkits) {
      toolkit.bind(this);
    }
  }

  /**
   * Get a specific tool by ID.
   */
  tool(id: string): Tool<TContext> | undefined {
    for (const toolkit of this.toolkits) {
      const tool = toolkit.get(id);
      if (tool) return tool;
    }
    return undefined;
  }

  /**
   * Get all tools available for the given context.
   */
  async tools(context: Context<TContext>): Promise<Tool<TContext>[]> {
    const all: Tool<TContext>[] = [];

    for (const toolkit of this.toolkits) {
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
}
