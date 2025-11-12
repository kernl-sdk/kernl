import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseMCPServer } from "../base";
import type { MCPTool, CallToolResultContent } from "../types";
import { logger } from "@/lib/logger";

// Create a minimal concrete implementation for testing
class TestMCPServer extends BaseMCPServer {
  readonly id: string;
  private mockTools: MCPTool[] = [];
  private isConnected = false;

  constructor(
    id: string,
    options?: {
      cacheToolsList?: boolean;
      toolFilter?: any;
    },
  ) {
    super({
      cacheToolsList: options?.cacheToolsList,
      toolFilter: options?.toolFilter,
      logger: logger,
    });
    this.id = id;
  }

  // Method to set mock tools for testing
  setMockTools(tools: MCPTool[]): void {
    this.mockTools = tools;
  }

  async connect(): Promise<void> {
    this.isConnected = true;
  }

  async close(): Promise<void> {
    this.isConnected = false;
  }

  protected async _listTools(): Promise<MCPTool[]> {
    if (!this.isConnected) {
      throw new Error("Not connected");
    }
    return this.mockTools;
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown> | null,
  ): Promise<CallToolResultContent> {
    if (!this.isConnected) {
      throw new Error("Not connected");
    }
    return [{ type: "text", text: `Called ${toolName}` }];
  }
}

describe("BaseMCPServer", () => {
  describe("Caching mechanisms", () => {
    it("should have cache disabled by default", () => {
      const server = new TestMCPServer("test-server");
      expect(server.cacheToolsList).toBe(false);
    });

    it("should store tools correctly when cache enabled", async () => {
      const server = new TestMCPServer("test-server", {
        cacheToolsList: true,
      });

      const mockTools: MCPTool[] = [
        {
          name: "tool1",
          description: "First tool",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "tool2",
          description: "Second tool",
          inputSchema: { type: "object", properties: {} },
        },
      ];

      server.setMockTools(mockTools);
      await server.connect();

      const tools = await server.listTools();
      expect(tools).toEqual(mockTools);
      expect(tools).toHaveLength(2);
    });

    it("should return same reference on subsequent calls when cached", async () => {
      const server = new TestMCPServer("test-server", {
        cacheToolsList: true,
      });

      const mockTools: MCPTool[] = [
        {
          name: "tool1",
          inputSchema: { type: "object", properties: {} },
        },
      ];

      server.setMockTools(mockTools);
      await server.connect();

      const tools1 = await server.listTools();
      const tools2 = await server.listTools();

      // Should return the exact same cached reference
      expect(tools1).toBe(tools2);
    });

    it("should fetch fresh tools when cache disabled", async () => {
      const server = new TestMCPServer("test-server", {
        cacheToolsList: false,
      });

      const mockTools: MCPTool[] = [
        {
          name: "tool1",
          inputSchema: { type: "object", properties: {} },
        },
      ];

      server.setMockTools(mockTools);
      await server.connect();

      const tools1 = await server.listTools();
      const tools2 = await server.listTools();

      // Both should succeed and have correct data
      expect(tools1).toEqual(mockTools);
      expect(tools2).toEqual(mockTools);
    });

    it("should have cache isolated per server instance", async () => {
      const server1 = new TestMCPServer("server1", {
        cacheToolsList: true,
      });
      const server2 = new TestMCPServer("server2", {
        cacheToolsList: true,
      });

      const tools1: MCPTool[] = [
        {
          name: "tool1",
          inputSchema: { type: "object", properties: {} },
        },
      ];
      const tools2: MCPTool[] = [
        {
          name: "tool2",
          inputSchema: { type: "object", properties: {} },
        },
      ];

      server1.setMockTools(tools1);
      server2.setMockTools(tools2);

      await server1.connect();
      await server2.connect();

      const result1 = await server1.listTools();
      const result2 = await server2.listTools();

      expect(result1).toEqual(tools1);
      expect(result2).toEqual(tools2);
      expect(result1).not.toEqual(result2);
    });

    it("should clear cache when invalidateCache() called", async () => {
      const server = new TestMCPServer("test-server", {
        cacheToolsList: true,
      });

      const initialTools: MCPTool[] = [
        {
          name: "tool1",
          inputSchema: { type: "object", properties: {} },
        },
      ];

      server.setMockTools(initialTools);
      await server.connect();

      // First fetch - populates cache
      await server.listTools();

      // Invalidate cache
      await server.invalidateCache();

      // Update mock tools
      const newTools: MCPTool[] = [
        {
          name: "tool2",
          inputSchema: { type: "object", properties: {} },
        },
      ];
      server.setMockTools(newTools);

      // Next fetch should get new tools, not cached ones
      const result = await server.listTools();
      expect(result).toEqual(newTools);
    });

    it("should set _cacheDirty flag when invalidateCache() called", async () => {
      const server = new TestMCPServer("test-server", {
        cacheToolsList: true,
      });

      await server.connect();
      server.setMockTools([
        { name: "tool1", inputSchema: { type: "object", properties: {} } },
      ]);

      // Populate cache
      await server.listTools();

      // Invalidate
      await server.invalidateCache();

      // The next listTools() call should fetch fresh data
      // We can verify this by changing the mock tools and seeing the change
      server.setMockTools([
        { name: "tool2", inputSchema: { type: "object", properties: {} } },
      ]);

      const tools = await server.listTools();
      expect(tools[0].name).toBe("tool2");
    });

    it("should skip cache when _cacheDirty is true", async () => {
      const server = new TestMCPServer("test-server", {
        cacheToolsList: true,
      });

      await server.connect();

      // First call
      server.setMockTools([
        { name: "tool1", inputSchema: { type: "object", properties: {} } },
      ]);
      await server.listTools();

      // Invalidate cache (sets _cacheDirty = true)
      await server.invalidateCache();

      // Change mock tools
      server.setMockTools([
        { name: "tool2", inputSchema: { type: "object", properties: {} } },
      ]);

      // Should fetch fresh tools, not use cache
      const tools = await server.listTools();
      expect(tools[0].name).toBe("tool2");
    });
  });

  describe("Abstract class contracts", () => {
    it("should allow subclass to implement connect()", async () => {
      const server = new TestMCPServer("test-server");

      await expect(server.connect()).resolves.not.toThrow();
    });

    it("should allow subclass to implement close()", async () => {
      const server = new TestMCPServer("test-server");

      await server.connect();
      await expect(server.close()).resolves.not.toThrow();
    });

    it("should allow subclass to implement _listTools()", async () => {
      const server = new TestMCPServer("test-server");

      server.setMockTools([
        { name: "tool1", inputSchema: { type: "object", properties: {} } },
      ]);
      await server.connect();

      const tools = await server.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("tool1");
    });

    it("should allow subclass to implement callTool()", async () => {
      const server = new TestMCPServer("test-server");

      await server.connect();
      const result = await server.callTool("test_tool", { arg: "value" });

      expect(result).toHaveLength(1);
      expect(result[0].text).toContain("test_tool");
    });
  });

  describe("toolFilter integration", () => {
    it("should default to allow-all filter", async () => {
      const server = new TestMCPServer("test-server");

      // The default filter should allow all tools
      expect(server.toolFilter).toBeDefined();

      // Test that it returns true for any tool
      const mockContext: any = {
        context: {},
        agent: {},
        serverId: "test",
      };
      const mockTool: MCPTool = {
        name: "any_tool",
        inputSchema: { type: "object", properties: {} },
      };

      const result = await server.toolFilter(mockContext, mockTool);
      expect(result).toBe(true);
    });

    it("should store custom filter correctly in constructor", async () => {
      const customFilter = vi.fn().mockResolvedValue(false);

      const server = new TestMCPServer("test-server", {
        toolFilter: customFilter,
      });

      expect(server.toolFilter).toBe(customFilter);

      // Verify the filter is actually used
      const mockContext: any = {
        context: {},
        agent: {},
        serverId: "test",
      };
      const mockTool: MCPTool = {
        name: "tool1",
        inputSchema: { type: "object", properties: {} },
      };

      const result = await server.toolFilter(mockContext, mockTool);
      expect(result).toBe(false);
      expect(customFilter).toHaveBeenCalledWith(mockContext, mockTool);
    });
  });
});
