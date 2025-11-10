import type { MCPServer } from "@/mcp/base";
import type { UnknownContext } from "@/context";

import type { FunctionTool, Tool, HostedTool } from ".";

/**
 * Toolkit manages all tools available to an agent.
 *
 * (TODO): might have to think about naming when we add toolkit installs
 */
export class Toolkit<TContext = UnknownContext> {
  private systools: Map<string, Tool<TContext>>;
  private functions: Map<string, FunctionTool<TContext>>;
  private mcpServers: Map<string, MCPServer>;

  constructor(config?: {
    tools?: Tool<TContext>[];
    mcpServers?: MCPServer[];
  }) {
    this.systools = new Map();
    this.functions = new Map();
    this.mcpServers = new Map();

    // organize tools into systools and functions
    const tools = config?.tools ?? [];
    for (const tool of tools) {
      if (tool.type === "function") {
        this.functions.set(tool.id, tool as FunctionTool<TContext>);
      } else {
        this.systools.set(tool.id, tool);
      }
    }

    // organize mcp servers by name
    const mcpServers = config?.mcpServers ?? [];
    for (const server of mcpServers) {
      this.mcpServers.set(server.name, server);
    }
  }

  /**
   * Get a tool by its ID.
   */
  get(id: string): Tool<TContext> | undefined {
    return this.systools.get(id) ?? this.functions.get(id);
  }

  /**
   * List all tools in the toolkit.
   */
  list(): Tool<TContext>[] {
    return [...this.systools.values(), ...this.functions.values()];
  }
}
