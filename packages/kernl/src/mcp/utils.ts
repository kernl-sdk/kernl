import { z } from "zod";

import { UnknownContext } from "@/context";
import { tool } from "@/tool";

import { MCPServer } from "./base";
import type { MCPTool, MCPToolFilter } from "./types";

/**
 * Converts an MCP tool definition into a function tool usable by the SDK.
 */
export function mcpToFunctionTool(server: MCPServer, mcpTool: MCPTool) {
  async function invoke(_ctx: UnknownContext, input: any) {
    const content = await server.callTool(mcpTool.name, input);
    return content.length === 1 ? content[0] : content;
  }

  const hasProperties =
    mcpTool.inputSchema &&
    Object.keys(mcpTool.inputSchema.properties || {}).length > 0;

  // If tool has properties, use passthrough to accept any object, else empty object (matches AI SDK)
  const parameters = hasProperties ? z.object({}).passthrough() : z.object({});

  return tool({
    id: mcpTool.name,
    name: mcpTool.name,
    description: mcpTool.description ?? "",
    parameters,
    execute: invoke,
  });
}

// ----------------------------
// Tool filters
// ----------------------------

/**
 * Creates a static tool filter from allowed and blocked tool name lists.
 * Returns a filter function that can be used with MCP servers.
 */
export function createMCPToolStaticFilter<TContext = UnknownContext>(options?: {
  allowed?: string[];
  blocked?: string[];
}): MCPToolFilter<TContext> | undefined {
  if (!options?.allowed && !options?.blocked) {
    return undefined;
  }

  const allowedToolNames = options.allowed ?? [];
  const blockedToolNames = options.blocked ?? [];

  return async (_ctx, tool) => {
    const allowed =
      allowedToolNames.length > 0 ? allowedToolNames.includes(tool.name) : true;
    const blocked =
      blockedToolNames.length > 0
        ? blockedToolNames.includes(tool.name)
        : false;

    return allowed && !blocked;
  };
}
