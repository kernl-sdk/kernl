import { describe, it, expect, vi } from "vitest";
import { mcpToFunctionTool, createMCPToolStaticFilter } from "../utils";
import type { MCPServer } from "../base";
import type { MCPTool, MCPToolFilterContext } from "../types";
import { Context } from "@/context";
import { Agent } from "@/agent";

describe("mcpToFunctionTool", () => {
  // Create a mock MCP server
  const createMockServer = (): MCPServer => ({
    id: "mock-server",
    cacheToolsList: false,
    toolFilter: async () => true,
    connect: vi.fn(),
    close: vi.fn(),
    listTools: vi.fn(),
    callTool: vi.fn(),
    invalidateCache: vi.fn(),
  });

  it("should convert MCPTool to FunctionTool correctly", () => {
    const server = createMockServer();
    const mcpTool: MCPTool = {
      name: "test_tool",
      description: "A test tool",
      inputSchema: {
        type: "object",
        properties: {
          arg1: { type: "string" },
        },
      },
    };

    const functionTool = mcpToFunctionTool(server, mcpTool);

    expect(functionTool.id).toBe("test_tool");
    expect(functionTool.name).toBe("test_tool");
    expect(functionTool.description).toBe("A test tool");
    expect(functionTool.parameters).toBeDefined();
    // execute is private, but we can verify the tool has an invoke method
    expect(functionTool.invoke).toBeDefined();
  });

  it("should map tool metadata (name, description, inputSchema)", () => {
    const server = createMockServer();
    const mcpTool: MCPTool = {
      name: "calculator",
      description: "Performs calculations",
      inputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          values: { type: "array" },
        },
      },
    };

    const functionTool = mcpToFunctionTool(server, mcpTool);

    expect(functionTool.id).toBe("calculator");
    expect(functionTool.name).toBe("calculator");
    expect(functionTool.description).toBe("Performs calculations");
    expect(functionTool.parameters).toBeDefined();
  });

  it("should handle tools without inputSchema (empty object parameters)", () => {
    const server = createMockServer();
    // In practice, MCP SDK tools require inputSchema, but our function handles
    // the case where it might not be present. We use 'as any' to test this edge case.
    const mcpTool = {
      name: "no_params",
      description: "Tool without parameters",
    } as any as MCPTool;

    const functionTool = mcpToFunctionTool(server, mcpTool);

    expect(functionTool.id).toBe("no_params");
    // When no inputSchema, we use an empty z.object({}) to match AI SDK behavior
    expect(functionTool.parameters).toBeDefined();
    expect(functionTool.parameters?.def.type).toBe("object");
  });

  it("should invoke server.callTool with correct params", async () => {
    const server = createMockServer();
    server.callTool = vi
      .fn()
      .mockResolvedValue([{ type: "text", text: "result" }]);

    const mcpTool: MCPTool = {
      name: "test_tool",
      inputSchema: {
        type: "object",
        properties: {
          arg1: { type: "string" },
        },
      },
    };

    const functionTool = mcpToFunctionTool(server, mcpTool);
    const ctx = new Context("test-namespace", {});
    const input = { arg1: "value1" };

    await functionTool.invoke(ctx, JSON.stringify(input));

    expect(server.callTool).toHaveBeenCalledWith("test_tool", input);
    expect(server.callTool).toHaveBeenCalledTimes(1);
  });

  it("should return single content item correctly", async () => {
    const server = createMockServer();
    server.callTool = vi
      .fn()
      .mockResolvedValue([{ type: "text", text: "single result" }]);

    const mcpTool: MCPTool = {
      name: "test_tool",
      inputSchema: {
        type: "object",
        properties: {},
      },
    };

    const functionTool = mcpToFunctionTool(server, mcpTool);
    const ctx = new Context("test-namespace", {});
    const toolResult = await functionTool.invoke(ctx, JSON.stringify({}));

    expect(toolResult.state).toBe("completed");
    expect(toolResult.result).toEqual({ type: "text", text: "single result" });
  });

  it("should return multiple content items as array", async () => {
    const server = createMockServer();
    const multipleItems = [
      { type: "text", text: "result 1" },
      { type: "text", text: "result 2" },
      { type: "text", text: "result 3" },
    ];
    server.callTool = vi.fn().mockResolvedValue(multipleItems);

    const mcpTool: MCPTool = {
      name: "test_tool",
      inputSchema: {
        type: "object",
        properties: {},
      },
    };

    const functionTool = mcpToFunctionTool(server, mcpTool);
    const ctx = new Context("test-namespace", {});
    const toolResult = await functionTool.invoke(ctx, JSON.stringify({}));

    expect(toolResult.state).toBe("completed");
    expect(toolResult.result).toEqual(multipleItems);
    expect(Array.isArray(toolResult.result)).toBe(true);
    expect(toolResult.result).toHaveLength(3);
  });

  it("should preserve tool name in closure", async () => {
    const server = createMockServer();
    server.callTool = vi
      .fn()
      .mockResolvedValue([{ type: "text", text: "result" }]);

    const tool1: MCPTool = {
      name: "tool1",
      inputSchema: { type: "object", properties: {} },
    };
    const tool2: MCPTool = {
      name: "tool2",
      inputSchema: { type: "object", properties: {} },
    };

    const functionTool1 = mcpToFunctionTool(server, tool1);
    const functionTool2 = mcpToFunctionTool(server, tool2);

    const ctx = new Context("test-namespace", {});

    await functionTool1.invoke(ctx, JSON.stringify({}));
    expect(server.callTool).toHaveBeenCalledWith("tool1", {});

    await functionTool2.invoke(ctx, JSON.stringify({}));
    expect(server.callTool).toHaveBeenCalledWith("tool2", {});
  });

  it("should use correct parameter order (context, params)", async () => {
    const server = createMockServer();
    server.callTool = vi
      .fn()
      .mockResolvedValue([{ type: "text", text: "result" }]);

    const mcpTool: MCPTool = {
      name: "test_tool",
      inputSchema: {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      },
    };

    const functionTool = mcpToFunctionTool(server, mcpTool);

    // Invoke takes (context, params as JSON string) in that order
    const ctx = new Context("test-namespace", {});
    const params = { foo: "bar" };
    await functionTool.invoke(ctx, JSON.stringify(params));

    // Verify the tool was called with the params (not the context)
    expect(server.callTool).toHaveBeenCalledWith("test_tool", params);
  });
});

describe("createMCPToolStaticFilter", () => {
  // Helper to create mock filter context
  const createMockFilterContext = (): MCPToolFilterContext => ({
    context: new Context("test-namespace", {}),
    agent: {} as Agent,
    serverId: "test-server",
  });

  it("should return undefined when no options provided", () => {
    const filter = createMCPToolStaticFilter();
    expect(filter).toBeUndefined();
  });

  it("should return undefined when options is empty object", () => {
    const filter = createMCPToolStaticFilter({});
    expect(filter).toBeUndefined();
  });

  it("should create allowlist filter correctly", async () => {
    const filter = createMCPToolStaticFilter({
      allowed: ["tool1", "tool2"],
    });

    expect(filter).toBeDefined();

    const mockContext = createMockFilterContext();
    const tool1: MCPTool = {
      name: "tool1",
      inputSchema: { type: "object", properties: {} },
    };
    const tool2: MCPTool = {
      name: "tool2",
      inputSchema: { type: "object", properties: {} },
    };
    const tool3: MCPTool = {
      name: "tool3",
      inputSchema: { type: "object", properties: {} },
    };

    expect(await filter!(mockContext, tool1)).toBe(true);
    expect(await filter!(mockContext, tool2)).toBe(true);
    expect(await filter!(mockContext, tool3)).toBe(false);
  });

  it("should create blocklist filter correctly", async () => {
    const filter = createMCPToolStaticFilter({
      blocked: ["dangerous_tool", "risky_tool"],
    });

    expect(filter).toBeDefined();

    const mockContext = createMockFilterContext();
    const safeTool: MCPTool = {
      name: "safe_tool",
      inputSchema: { type: "object", properties: {} },
    };
    const dangerousTool: MCPTool = {
      name: "dangerous_tool",
      inputSchema: { type: "object", properties: {} },
    };
    const riskyTool: MCPTool = {
      name: "risky_tool",
      inputSchema: { type: "object", properties: {} },
    };

    expect(await filter!(mockContext, safeTool)).toBe(true);
    expect(await filter!(mockContext, dangerousTool)).toBe(false);
    expect(await filter!(mockContext, riskyTool)).toBe(false);
  });

  it("should combine allowlist and blocklist", async () => {
    const filter = createMCPToolStaticFilter({
      allowed: ["tool1", "tool2", "tool3"],
      blocked: ["tool2"],
    });

    expect(filter).toBeDefined();

    const mockContext = createMockFilterContext();
    const tool1: MCPTool = {
      name: "tool1",
      inputSchema: { type: "object", properties: {} },
    };
    const tool2: MCPTool = {
      name: "tool2",
      inputSchema: { type: "object", properties: {} },
    };
    const tool3: MCPTool = {
      name: "tool3",
      inputSchema: { type: "object", properties: {} },
    };
    const tool4: MCPTool = {
      name: "tool4",
      inputSchema: { type: "object", properties: {} },
    };

    expect(await filter!(mockContext, tool1)).toBe(true);
    expect(await filter!(mockContext, tool2)).toBe(false); // In allowed but blocked
    expect(await filter!(mockContext, tool3)).toBe(true);
    expect(await filter!(mockContext, tool4)).toBe(false); // Not in allowed list
  });

  it("should default to allow-all when lists empty", async () => {
    const filter = createMCPToolStaticFilter({
      allowed: [],
      blocked: [],
    });

    expect(filter).toBeDefined();

    const mockContext = createMockFilterContext();
    const tool1: MCPTool = {
      name: "tool1",
      inputSchema: { type: "object", properties: {} },
    };
    const tool2: MCPTool = {
      name: "tool2",
      inputSchema: { type: "object", properties: {} },
    };

    expect(await filter!(mockContext, tool1)).toBe(true);
    expect(await filter!(mockContext, tool2)).toBe(true);
  });

  it("should filter based on tool.name property", async () => {
    const filter = createMCPToolStaticFilter({
      allowed: ["exact_name"],
    });

    expect(filter).toBeDefined();

    const mockContext = createMockFilterContext();
    const exactMatch: MCPTool = {
      name: "exact_name",
      inputSchema: { type: "object", properties: {} },
    };
    const partialMatch: MCPTool = {
      name: "exact_name_with_suffix",
      inputSchema: { type: "object", properties: {} },
    };
    const noMatch: MCPTool = {
      name: "different_name",
      inputSchema: { type: "object", properties: {} },
    };

    expect(await filter!(mockContext, exactMatch)).toBe(true);
    expect(await filter!(mockContext, partialMatch)).toBe(false);
    expect(await filter!(mockContext, noMatch)).toBe(false);
  });
});
