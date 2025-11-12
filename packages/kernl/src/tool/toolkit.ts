import type { Agent } from "@/agent";
import type { Context, UnknownContext } from "@/context";

import { MCPServer } from "@/mcp/base";
import { mcpToFunctionTool } from "@/mcp/utils";
import { filter } from "@kernl-sdk/shared/lib";

import type { Tool } from ".";
import type {
  FunctionToolkitConfig,
  MCPToolkitConfig,
  ToolkitFilter,
} from "./types";

/**
 * A toolkit is a collection of related tools that can be used by an agent.
 *
 * Toolkits can be static (FunctionToolkit) or dynamic (MCPToolkit), and provide
 * a unified interface for tool discovery and management.
 */
export abstract class Toolkit<TContext = UnknownContext> {
  /**
   * Unique identifier for this toolkit
   */
  abstract readonly id: string;

  /**
   * Description of what this toolkit provides
   */
  abstract readonly description: string;

  /**
   * The agent this toolkit is bound to (if any)
   */
  protected agent?: Agent<TContext, any>;

  /**
   * Bind this toolkit to an agent.
   * Called by Agent constructor.
   */
  bind(agent: Agent<TContext, any>): void {
    this.agent = agent;
  }

  /**
   * Get a specific tool by its ID.
   *
   * @param id The tool ID to look up
   * @returns The tool if found, undefined otherwise
   */
  abstract get(id: string): Tool<TContext> | undefined;

  /**
   * List all tools available for the given context.
   * If no context provided, returns all tools without filtering.
   *
   * @param context Optional context for filtering tools
   * @returns Array of tools available in this toolkit
   */
  abstract list(context?: Context<TContext>): Promise<Tool<TContext>[]>;

  /**
   * Cleanup resources held by this toolkit.
   * Override if your toolkit needs cleanup (e.g., closing connections).
   * Default implementation does nothing.
   */
  async destroy(): Promise<void> {
    // Default: no-op
  }
}

/**
 * A toolkit containing static function tools.
 *
 * @example
 * ```ts
 * const fs = new FunctionToolkit({
 *   id: "fs",
 *   tools: [readFile, writeFile, listDir, ...]
 * });
 * ```
 */
export class FunctionToolkit<
  TContext = UnknownContext,
> extends Toolkit<TContext> {
  readonly id: string;
  readonly description: string;
  private tools: Map<string, Tool<TContext>>;

  /**
   * Create a new function toolkit.
   *
   * @param config Toolkit configuration with id and tools array
   */
  constructor(config: FunctionToolkitConfig<TContext>) {
    super();
    this.id = config.id;
    this.description = config.description ?? "";
    this.tools = new Map(config.tools.map((t) => [t.id, t]));
  }

  /**
   * Get a specific tool by ID.
   *
   * @param id The tool ID to look up
   * @returns The tool if found, undefined otherwise
   */
  get(id: string): Tool<TContext> | undefined {
    return this.tools.get(id);
  }

  /**
   * List all tools in this toolkit.
   *
   * @param context Optional context for filtering tools (currently unused)
   * @returns Array of all tools in this toolkit
   */
  async list(context?: Context<TContext>): Promise<Tool<TContext>[]> {
    return Array.from(this.tools.values());
  }
}

/*
 * A toolkit that wraps an MCP server and provides tools from it.
 *
 * Handles connection lifecycle automatically - connects lazily on first tool request
 * and provides cleanup via destroy().
 *
 * @example
 * ```ts
 * const server = new MCPServerStdio({
 *   id: "github",
 *   command: "npx",
 *   args: ["-y", "@modelcontextprotocol/server-github"],
 *   env: {
 *     GITHUB_TOKEN: process.env.GITHUB_TOKEN,
 *   },
 * });
 *
 * const github = new MCPToolkit({
 *   id: "github",
 *   server,
 *   filter: async (ctx, tool) => {
 *     // Only allow certain tools
 *     return !tool.id.startsWith("dangerous_");
 *   },
 * });
 *
 * const agent = new Agent({
 *   toolkits: [github],
 * });
 * ```
 */
export class MCPToolkit<TContext = UnknownContext> extends Toolkit<TContext> {
  readonly id: string;
  readonly description: string;
  private server: MCPServer;
  private cache: Map<string, Tool<TContext>>;
  private filter: ToolkitFilter<TContext>;

  private connected = false;
  private cached = false;

  /**
   * Create a new MCP toolkit.
   *
   * @param config Toolkit configuration with id and server instance
   */
  constructor(config: MCPToolkitConfig<TContext>) {
    super();
    this.id = config.id;
    this.description = config.description ?? "";
    this.server = config.server;
    this.filter = config.filter ?? (() => true);
    this.cache = new Map();
  }

  /**
   * Get a specific tool by ID.
   *
   * Returns the tool from the local cache. The cache is populated on the first
   * call to list(). Returns undefined if list() hasn't been called yet.
   *
   * @param id The tool ID to look up
   * @returns The tool if found in cache, undefined otherwise
   */
  get(id: string): Tool<TContext> | undefined {
    return this.cache.get(id);
  }

  /**
   * List all tools available from the MCP server.
   *
   * Connects to the server lazily on first call. Tools are cached locally after
   * the first fetch. The MCP server itself also handles caching via the
   * cacheToolsList option, so the network call is only made once.
   *
   * @param context Optional context for filtering tools
   * @returns Array of tools from the MCP server
   */
  async list(context?: Context<TContext>): Promise<Tool<TContext>[]> {
    if (!this.connected) {
      await this.server.connect();
      this.connected = true;
    }

    // lazy cache population
    if (!this.cached) {
      const mcpTools = await this.server.listTools();

      for (const mcpTool of mcpTools) {
        const tool = mcpToFunctionTool(this.server, mcpTool);
        this.cache.set(tool.id, tool);
      }

      this.cached = true;
    }

    const tools = Array.from(this.cache.values());

    // apply filter
    if (context && this.agent) {
      const ctx = { context, agent: this.agent, toolkitId: this.id };
      return filter(tools, async (tool) => {
        return await this.filter(ctx, tool);
      });
    }

    return tools;
  }

  /**
   * Cleanup resources and close the MCP server connection.
   */
  async destroy(): Promise<void> {
    if (this.connected) {
      await this.server.close();
      this.connected = false;
      this.cache.clear();
      this.cached = false;
    }
  }
}
