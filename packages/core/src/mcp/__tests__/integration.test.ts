import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import { MCPServerStdio } from "../stdio";
import { MCPToolkit } from "@/tool/toolkit";
import { FunctionToolkit } from "@/tool/toolkit";
import { Agent } from "@/agent";
import { Context } from "@/context";
import { tool } from "@/tool";
import { z } from "zod";
import { Thread } from "@/thread";
import { createMCPToolStaticFilter } from "../utils";

const TEST_SERVER = path.join(__dirname, "fixtures", "server.ts");

describe("MCP Integration Tests", () => {
  describe("MCPToolkit Integration", () => {
    let server: MCPServerStdio;
    let toolkit: MCPToolkit;

    beforeEach(() => {
      server = new MCPServerStdio({
        id: "test-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });
      toolkit = new MCPToolkit({
        id: "test-toolkit",
        server,
      });
    });

    afterEach(async () => {
      await toolkit.destroy();
    });

    it("should wrap server correctly", () => {
      expect(toolkit.id).toBe("test-toolkit");
      expect(toolkit).toBeDefined();
    });

    it("should connect lazily on first list()", async () => {
      // Server should not be connected yet
      // (we can't directly test this without exposing internals)

      const tools = await toolkit.list();

      // Should have successfully fetched tools
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.length).toBe(6); // Our test server has 6 tools
    });

    it("should convert MCPTools to Tools", async () => {
      const tools = await toolkit.list();

      // Verify they are FunctionTools with proper structure
      for (const tool of tools) {
        expect(tool.id).toBeDefined();
        expect(tool.name).toBeDefined();
        expect(tool.type).toBe("function");

        // MCP tools are converted to FunctionTools
        if (tool.type === "function") {
          expect(tool.description).toBeDefined();
          expect(tool.invoke).toBeDefined();
        }
      }

      // Check specific tool
      const addTool = tools.find((t) => t.id === "add");
      expect(addTool).toBeDefined();
      if (addTool && addTool.type === "function") {
        expect(addTool.description).toBe("Add two numbers");
      }
    });

    it("should cache converted tools", async () => {
      const tools1 = await toolkit.list();
      const tools2 = await toolkit.list();

      // Should return the same tool objects (cached)
      expect(tools1).toEqual(tools2);
      expect(tools1[0]).toBe(tools2[0]); // Same reference
    });

    it("should return tools from cache via get()", async () => {
      // First, list to populate cache
      await toolkit.list();

      // Then get specific tool
      const addTool = toolkit.get("add");
      expect(addTool).toBeDefined();
      expect(addTool!.id).toBe("add");

      if (addTool && addTool.type === "function") {
        expect(addTool.description).toBe("Add two numbers");
      }
    });

    it("should close server connection on destroy()", async () => {
      // First connect
      await toolkit.list();

      // Destroy
      await toolkit.destroy();

      // Trying to list again should reconnect
      const tools = await toolkit.list();
      expect(tools.length).toBe(6);

      await toolkit.destroy();
    });
  });

  describe("Two-Layer Filtering", () => {
    it("should apply server-level filter to block tools", async () => {
      const server = new MCPServerStdio({
        id: "filtered-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
        toolFilter: createMCPToolStaticFilter({
          blocked: ["divide", "multiply"],
        }),
      });

      const toolkit = new MCPToolkit({
        id: "filtered-toolkit",
        server,
      });

      const tools = await toolkit.list();

      // Should have 4 tools (6 - 2 blocked)
      expect(tools.length).toBe(4);
      expect(tools.find((t) => t.id === "divide")).toBeUndefined();
      expect(tools.find((t) => t.id === "multiply")).toBeUndefined();
      expect(tools.find((t) => t.id === "add")).toBeDefined();

      await toolkit.destroy();
    });

    it("should apply toolkit-level filter to block tools", async () => {
      const server = new MCPServerStdio({
        id: "test-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      const toolkit = new MCPToolkit({
        id: "filtered-toolkit",
        server,
        filter: async (ctx, tool) => {
          // Block all string tools
          return !["echo", "uppercase", "reverse"].includes(tool.id);
        },
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "Test",
        toolkits: [toolkit],
      });

      const context = new Context({});
      const tools = await toolkit.list(context);

      // Should have 3 math tools only
      expect(tools.length).toBe(3);
      expect(tools.find((t) => t.id === "add")).toBeDefined();
      expect(tools.find((t) => t.id === "echo")).toBeUndefined();

      await toolkit.destroy();
    });

    it("should combine server and toolkit filters with AND logic", async () => {
      const server = new MCPServerStdio({
        id: "filtered-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
        toolFilter: createMCPToolStaticFilter({
          // Only allow math tools at server level
          allowed: ["add", "multiply", "divide"],
        }),
      });

      const toolkit = new MCPToolkit({
        id: "filtered-toolkit",
        server,
        // At toolkit level, block multiply
        filter: async (ctx, tool) => tool.id !== "multiply",
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "Test",
        toolkits: [toolkit],
      });

      const context = new Context({});
      const tools = await toolkit.list(context);

      // Should have only add and divide (multiply blocked by toolkit filter)
      expect(tools.length).toBe(2);
      expect(tools.find((t) => t.id === "add")).toBeDefined();
      expect(tools.find((t) => t.id === "divide")).toBeDefined();
      expect(tools.find((t) => t.id === "multiply")).toBeUndefined();
      expect(tools.find((t) => t.id === "echo")).toBeUndefined();

      await toolkit.destroy();
    });

    it("should receive correct context in toolkit filter", async () => {
      const server = new MCPServerStdio({
        id: "test-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      let receivedContext: any = null;

      const toolkit = new MCPToolkit({
        id: "test-toolkit",
        server,
        filter: async (ctx, tool) => {
          receivedContext = ctx;
          return true;
        },
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "Test",
        toolkits: [toolkit],
      });

      const context = new Context({ userId: "test-user" });
      await toolkit.list(context);

      // Verify context was passed correctly
      expect(receivedContext).toBeDefined();
      expect(receivedContext.context).toBe(context);
      expect(receivedContext.agent).toBe(agent);
      expect(receivedContext.toolkitId).toBe("test-toolkit");

      await toolkit.destroy();
    });
  });

  describe("Agent Integration", () => {
    it("should include MCP tools in agent.tools()", async () => {
      const server = new MCPServerStdio({
        id: "test-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      const mcpToolkit = new MCPToolkit({
        id: "mcp-toolkit",
        server,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "Test",
        toolkits: [mcpToolkit],
      });

      const context = new Context({});
      const tools = await agent.tools(context);

      expect(tools.length).toBe(6);
      expect(tools.find((t) => t.id === "add")).toBeDefined();
      expect(tools.find((t) => t.id === "echo")).toBeDefined();

      await mcpToolkit.destroy();
    });

    it("should find MCP tools via agent.tool()", async () => {
      const server = new MCPServerStdio({
        id: "test-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      const mcpToolkit = new MCPToolkit({
        id: "mcp-toolkit",
        server,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "Test",
        toolkits: [mcpToolkit],
      });

      // Populate toolkit cache
      const context = new Context({});
      await agent.tools(context);

      // Now get specific tool
      const addTool = agent.tool("add");
      expect(addTool).toBeDefined();
      expect(addTool!.id).toBe("add");

      await mcpToolkit.destroy();
    });

    it("should execute MCP tools through tool.invoke()", async () => {
      const server = new MCPServerStdio({
        id: "test-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      const mcpToolkit = new MCPToolkit({
        id: "mcp-toolkit",
        server,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "Test",
        toolkits: [mcpToolkit],
      });

      const context = new Context({});
      await agent.tools(context);

      const addTool = agent.tool("add");
      expect(addTool).toBeDefined();

      // Execute the tool
      if (addTool && addTool.type === "function") {
        const result = await addTool.invoke(
          context,
          JSON.stringify({ a: 5, b: 3 }),
        );

        expect(result.status).toBe("completed");
        expect(result.result).toEqual({ type: "text", text: "8" });
      }

      await mcpToolkit.destroy();
    });

    it("should work with multiple toolkits together", async () => {
      const server = new MCPServerStdio({
        id: "test-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      const mcpToolkit = new MCPToolkit({
        id: "mcp-toolkit",
        server,
      });

      // Create a function toolkit
      const localTool = tool({
        id: "local_tool",
        name: "local_tool",
        description: "A local tool",
        parameters: z.object({
          input: z.string(),
        }),
        execute: async (context, params) => {
          return `Local: ${params.input}`;
        },
      });

      const functionToolkit = new FunctionToolkit({
        id: "function-toolkit",
        tools: [localTool],
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "Test",
        toolkits: [mcpToolkit, functionToolkit],
      });

      const context = new Context({});
      const tools = await agent.tools(context);

      // Should have 7 tools (6 MCP + 1 local)
      expect(tools.length).toBe(7);
      expect(tools.find((t) => t.id === "add")).toBeDefined();
      expect(tools.find((t) => t.id === "local_tool")).toBeDefined();

      await mcpToolkit.destroy();
    });

    it("should detect duplicate tool IDs across toolkits", async () => {
      const server = new MCPServerStdio({
        id: "test-server",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      const mcpToolkit = new MCPToolkit({
        id: "mcp-toolkit",
        server,
      });

      // Create a function toolkit with a duplicate ID
      const duplicateTool = tool({
        id: "add", // Same as MCP tool
        name: "add",
        description: "Duplicate add tool",
        parameters: z.object({
          a: z.number(),
          b: z.number(),
        }),
        execute: async (context, params) => {
          return params.a + params.b;
        },
      });

      const functionToolkit = new FunctionToolkit({
        id: "function-toolkit",
        tools: [duplicateTool],
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "Test",
        toolkits: [mcpToolkit, functionToolkit],
      });

      const context = new Context({});

      // Should throw error about duplicate tool IDs
      await expect(agent.tools(context)).rejects.toThrow(
        /Duplicate tool IDs found/,
      );

      await mcpToolkit.destroy();
    });
  });
});
