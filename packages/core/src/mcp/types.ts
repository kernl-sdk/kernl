import { z } from "zod";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

import { Agent } from "@/agent";
import { Context, UnknownContext } from "@/context";
import { Logger } from "@/lib/logger";

/**
 * MCP tool type from the SDK.
 * We use the SDK's type directly to avoid compatibility issues.
 */
export type MCPTool = Tool;

/**
 * Custom MCP tool schema definition with stricter contracts.
 * NOTE: Currently not used, but kept for potential future runtime validation.
 * If needed, we could parse SDK tools through this schema to enforce stricter requirements.
 */
export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.any()),
    required: z.array(z.string()),
    additionalProperties: z.boolean(),
  }),
});

/**
 * Context provided to callable tool filters during tool resolution.
 */
export interface MCPToolFilterContext<TContext = UnknownContext> {
  context: Context<TContext>;
  agent: Agent<TContext, any>;
  serverName: string;
}

/**
 * Function that determines whether a tool should be made available to an agent.
 */
export type MCPToolFilter<TContext = UnknownContext> = (
  context: MCPToolFilterContext<TContext>,
  tool: MCPTool,
) => Promise<boolean>;

/**
 * Static tool filter using allowlist and blocklist of tool names.
 */
export interface MCPToolFilterStatic {
  allowedToolNames?: string[];
  blockedToolNames?: string[];
}

/**
 * JSON-RPC 2.0 request message.
 */
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 notification message (no response expected).
 */
export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 response message.
 */
export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: any;
}

/**
 * Response from calling an MCP tool.
 */
export interface CallToolResponse extends JsonRpcResponse {
  result: {
    content: { type: string; text: string }[];
  };
}
export type CallToolResult = CallToolResponse["result"];
export type CallToolResultContent = CallToolResult["content"];

/**
 * Response from MCP server initialization.
 */
export interface InitializeResponse extends JsonRpcResponse {
  result: {
    protocolVersion: string;
    capabilities: {
      tools: Record<string, unknown>;
    };
    serverInfo: {
      name: string;
      version: string;
    };
  };
}
export type InitializeResult = InitializeResponse["result"];

/**
 * Base configuration options for stdio-based MCP servers.
 */
export interface BaseMCPServerStdioOptions {
  env?: Record<string, string>;
  cwd?: string;
  cacheToolsList?: boolean;
  clientSessionTimeoutSeconds?: number;
  name?: string;
  encoding?: string;
  encodingErrorHandler?: "strict" | "ignore" | "replace";
  logger?: Logger;
  toolFilter?: MCPToolFilter;
  timeout?: number;
}

/**
 * Stdio MCP server options with command and args.
 */
export interface DefaultMCPServerStdioOptions
  extends BaseMCPServerStdioOptions {
  command: string;
  args?: string[];
}

/**
 * Stdio MCP server options with full command string.
 */
export interface FullCommandMCPServerStdioOptions
  extends BaseMCPServerStdioOptions {
  fullCommand: string;
}

export type MCPServerStdioOptions =
  | DefaultMCPServerStdioOptions
  | FullCommandMCPServerStdioOptions;

/**
 * Configuration options for streamable HTTP MCP servers.
 */
export interface MCPServerStreamableHttpOptions {
  url: string;
  cacheToolsList?: boolean;
  clientSessionTimeoutSeconds?: number;
  name?: string;
  logger?: Logger;
  toolFilter?: MCPToolFilter;
  timeout?: number;

  // ----------------------------------------------------
  // OAuth
  // import { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
  authProvider?: any;
  // RequestInit
  requestInit?: any;
  // Custom fetch implementation used for all network requests.
  // import { FetchLike } from '@modelcontextprotocol/sdk/shared/transport.js';
  fetch?: any;
  // import { StreamableHTTPReconnectionOptions } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
  reconnectionOptions?: any;
  sessionId?: string;
  // ----------------------------------------------------
}

/**
 * Configuration options for Server-Sent Events (SSE) MCP servers.
 */
export interface MCPServerSSEOptions {
  url: string;
  cacheToolsList?: boolean;
  clientSessionTimeoutSeconds?: number;
  name?: string;
  logger?: Logger;
  toolFilter?: MCPToolFilter;
  timeout?: number;

  // ----------------------------------------------------
  // OAuth
  // import { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
  authProvider?: any;
  // RequestInit
  requestInit?: any;
  // import { SSEReconnectionOptions } from '@modelcontextprotocol/sdk/client/sse.js';
  eventSourceInit?: any;
  // ----------------------------------------------------
}
