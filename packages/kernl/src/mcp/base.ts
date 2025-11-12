import { Logger } from "@/lib/logger";

import { MCPTool, MCPToolFilter, CallToolResultContent } from "./types";

export const DEFAULT_STDIO_MCP_CLIENT_LOGGER_NAME = "kernl:stdio-mcp-client";
export const DEFAULT_SSE_MCP_CLIENT_LOGGER_NAME = "kernl:sse-mcp-client";
export const DEFAULT_STREAMABLE_HTTP_MCP_CLIENT_LOGGER_NAME =
  "kernl:streamable-http-mcp-client";

/**
 * @example
 *
 *  const server = new MCPServerStdio({
 *    id: 'Filesystem Server',
 *    command: 'npx',
 *    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir']
 *  });
 *
 *  await server.connect();  // Establishes connection to the MCP server process
 */

/**
 * Cache storage for MCP tools by server id.
 * Enables reusing tool definitions across multiple agent executions.
 */
const _cachedTools: Record<string, MCPTool[]> = {};

/**
 * Interface for MCP server implementations.
 * Provides methods for connecting, listing tools, calling tools, and cleanup.
 */
export interface MCPServer {
  /**
   * The unique identifier for this MCP server.
   */
  readonly id: string;

  /**
   * Whether to cache the tools list after first fetch.
   */
  cacheToolsList: boolean;

  /**
   * Filter to control which tools are exposed to agents.
   * Always a callable function. Defaults to allowing all tools.
   */
  toolFilter: MCPToolFilter;

  /**
   * Establishes connection to the MCP server.
   */
  connect(): Promise<void>;

  /**
   * Closes the connection and cleans up resources.
   */
  close(): Promise<void>;

  /**
   * Fetches the list of available tools from the server.
   */
  listTools(): Promise<MCPTool[]>;

  /**
   * Executes a tool on the server with the provided arguments.
   */
  callTool(
    toolName: string,
    args: Record<string, unknown> | null,
  ): Promise<CallToolResultContent>;

  /**
   * Clears any cached tools, forcing a fresh fetch on next request.
   */
  invalidateCache(): Promise<void>;
}

/**
 * Base abstract class for MCP server implementations.
 * Provides common caching logic.
 */
export abstract class BaseMCPServer implements MCPServer {
  abstract readonly id: string;
  public cacheToolsList: boolean;
  public toolFilter: MCPToolFilter;
  protected logger: Logger;
  protected _cachedTools: MCPTool[] | undefined = undefined;
  protected _cacheDirty = true;

  constructor(options: {
    cacheToolsList?: boolean;
    toolFilter?: MCPToolFilter;
    logger: Logger;
  }) {
    this.logger = options.logger;
    this.cacheToolsList = options.cacheToolsList ?? false;
    this.toolFilter = options.toolFilter ?? (async () => true);
  }

  /**
   * Establishes connection to the MCP server.
   */
  abstract connect(): Promise<void>;

  /**
   * Closes the connection and cleans up resources.
   */
  abstract close(): Promise<void>;

  /**
   * Executes a tool on the server with the provided arguments.
   */
  abstract callTool(
    toolName: string,
    args: Record<string, unknown> | null,
  ): Promise<CallToolResultContent>;

  /**
   * Fetches the list of available tools from the server.
   * Handles caching and static filtering automatically.
   */
  async listTools(): Promise<MCPTool[]> {
    if (this.cacheToolsList && !this._cacheDirty && this._cachedTools) {
      return this._cachedTools;
    }

    this._cacheDirty = false;
    let tools = await this._listTools();

    // Apply static server-level filter (without context)
    // This is for static filtering like allowlist/blocklist
    const filteredTools: MCPTool[] = [];
    for (const tool of tools) {
      // Pass empty context for static filtering
      const allowed = await this.toolFilter({} as any, tool);
      if (allowed) {
        filteredTools.push(tool);
      }
    }
    tools = filteredTools;

    if (this.cacheToolsList) {
      this._cachedTools = tools;
    }

    return tools;
  }

  /**
   * Clears any cached tools, forcing a fresh fetch on next request.
   */
  async invalidateCache(): Promise<void> {
    delete _cachedTools[this.id];
    this._cacheDirty = true;
  }

  /**
   * Internal implementation: Fetches tools from the server (without caching logic).
   * Subclasses implement the transport-specific logic.
   */
  protected abstract _listTools(): Promise<MCPTool[]>;
}
