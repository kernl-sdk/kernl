import { Agent } from "@/agent";
import { Context, UnknownContext } from "@/context";
import { FunctionTool, Tool } from "@/tool";

import { Logger } from "@/lib/logger";
import { filter } from "@/lib/utils";
import { MisconfiguredError } from "@/lib/error";

import { mcpToFunctionTool } from "./utils";
import { MCPTool, MCPToolFilter, CallToolResultContent } from "./types";

export const DEFAULT_STDIO_MCP_CLIENT_LOGGER_NAME = "kernl:stdio-mcp-client";
export const DEFAULT_SSE_MCP_CLIENT_LOGGER_NAME = "kernl:sse-mcp-client";
export const DEFAULT_STREAMABLE_HTTP_MCP_CLIENT_LOGGER_NAME =
  "kernl:streamable-http-mcp-client";

/**
 * Cache storage for MCP tools by server name.
 * Enables reusing tool definitions across multiple agent executions.
 */
const _cachedTools: Record<string, MCPTool[]> = {};

/**
 * Interface for MCP server implementations.
 * Provides methods for connecting, listing tools, calling tools, and cleanup.
 */
export interface MCPServer {
  /**
   * The unique name identifier for this MCP server.
   */
  readonly name: string;

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
   * The unique name identifier for this MCP server.
   */
  abstract get name(): string;

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
   * Handles caching automatically.
   */
  async listTools(): Promise<MCPTool[]> {
    if (this.cacheToolsList && !this._cacheDirty && this._cachedTools) {
      return this._cachedTools;
    }

    this._cacheDirty = false;
    const tools = await this._listTools();

    if (this.cacheToolsList) {
      this._cachedTools = tools;
    }

    return tools;
  }

  /**
   * Clears any cached tools, forcing a fresh fetch on next request.
   */
  async invalidateCache(): Promise<void> {
    delete _cachedTools[this.name];
    this._cacheDirty = true;
  }

  /**
   * Internal implementation: Fetches tools from the server (without caching logic).
   * Subclasses implement the transport-specific logic.
   */
  protected abstract _listTools(): Promise<MCPTool[]>;
}

// ----------------------------
// Used by the agent when getting the tools
//
// ( CANDIDATE FOR REFACTOR INTO `class Kernel()` )
// ----------------------------

/**
 * Options for fetching MCP tools from multiple servers.
 */
export type GetAllMcpToolsOptions<TContext> = {
  mcpServers: MCPServer[];
  convertSchemasToStrict?: boolean;
  context?: Context<TContext>;
  agent?: Agent<TContext, any>;
};

/**
 * Fetches all tools from the provided MCP servers and converts them to function tools.
 */
export async function getAllMcpTools<TContext = UnknownContext>(
  mcpServers: MCPServer[],
): Promise<Tool<TContext>[]>;

export async function getAllMcpTools<TContext = UnknownContext>(
  opts: GetAllMcpToolsOptions<TContext>,
): Promise<Tool<TContext>[]>;

export async function getAllMcpTools<TContext = UnknownContext>(
  mcpServersOrOpts: MCPServer[] | GetAllMcpToolsOptions<TContext>,
  context?: Context<TContext>,
  agent?: Agent<TContext, any>,
  convertSchemasToStrict = false,
): Promise<Tool<TContext>[]> {
  const opts = Array.isArray(mcpServersOrOpts)
    ? {
        mcpServers: mcpServersOrOpts,
        context,
        agent,
        convertSchemasToStrict,
      }
    : mcpServersOrOpts;

  const {
    mcpServers,
    convertSchemasToStrict: convertSchemasToStrictFromOpts = false,
    context: runContextFromOpts,
    agent: agentFromOpts,
  } = opts;
  const allTools: Tool<TContext>[] = [];
  const toolNames = new Set<string>();

  for (const server of mcpServers) {
    const serverTools = await getFunctionToolsFromServer({
      server,
      convertSchemasToStrict: convertSchemasToStrictFromOpts,
      context: runContextFromOpts,
      agent: agentFromOpts,
    });
    const serverToolNames = new Set(
      serverTools
        .map((t) => t.name)
        .filter((n): n is string => n !== undefined),
    );
    const intersection = [...serverToolNames].filter((n) => toolNames.has(n));
    if (intersection.length > 0) {
      throw new MisconfiguredError(
        `Duplicate tool names found across MCP servers: ${intersection.join(", ")}`,
      );
    }
    for (const t of serverTools) {
      if (t.name) {
        toolNames.add(t.name);
      }
      allTools.push(t);
    }
  }
  return allTools;
}

/**
 * Fetches and filters tools from a single MCP server, applying any configured filters.
 */
async function getFunctionToolsFromServer<TContext = UnknownContext>({
  server,
  convertSchemasToStrict,
  context,
  agent,
}: {
  server: MCPServer;
  convertSchemasToStrict: boolean; // ??
  context?: Context<TContext>;
  agent?: Agent<any, any>;
}): Promise<FunctionTool<TContext, any, unknown>[]> {
  if (server.cacheToolsList && _cachedTools[server.name]) {
    return _cachedTools[server.name].map((t) => mcpToFunctionTool(t, server));
  }
  // (TODO): Analyze tracing flow to understand how tracing middleware might optionally hook into this here..
  // Tracing temporarily disabled - withMCPListToolsSpan not implemented yet
  // 1) Fetch the tool list from the server
  const fetched = await server.listTools();

  // 2) Filter based on the configured server.toolFilter
  let mcpTools: MCPTool[] = fetched;
  if (context && agent) {
    const ctx = { context, agent, serverName: server.name };
    mcpTools = await filter(fetched, (tool: MCPTool) =>
      server.toolFilter(ctx, tool),
    );
  }

  // 3) Map the MCP tools to function tools that the agent can call
  const tools: FunctionTool<TContext, any, unknown>[] = mcpTools.map((t) =>
    mcpToFunctionTool(t, server),
  );

  if (server.cacheToolsList) {
    _cachedTools[server.name] = mcpTools;
  }
  return tools;
}
