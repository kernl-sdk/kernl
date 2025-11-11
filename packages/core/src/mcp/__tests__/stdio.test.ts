import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MCPServerStdio } from "../stdio";
import { withMCPServer, createMCPServer } from "./fixtures/utils";
import path from "path";

const TEST_SERVER = path.join(__dirname, "fixtures", "server.ts");

describe("MCPServerStdio", () => {
  describe("Connection Lifecycle", () => {
    it("should connect successfully to a server", async () => {
      await withMCPServer(TEST_SERVER, async (server) => {
        expect(server).toBeDefined();
        // If we get here, connection was successful
      });
    });

    it("should handle connection failure gracefully", async () => {
      const server = createMCPServer("/nonexistent/server.ts");

      await expect(server.connect()).rejects.toThrow();
    });

    it("should close connection cleanly", async () => {
      const server = createMCPServer(TEST_SERVER);
      await server.connect();
      await server.close();

      // Attempting to call a tool after close should fail
      await expect(server.callTool("add", { a: 1, b: 2 })).rejects.toThrow();
    });

    it("should allow reconnection after close", async () => {
      const server = createMCPServer(TEST_SERVER);

      await server.connect();
      await server.close();

      await server.connect();
      const tools = await server.listTools();
      expect(tools.length).toBeGreaterThan(0);

      await server.close();
    });
  });

  describe("Tool Discovery", () => {
    it("should list tools after connect", async () => {
      await withMCPServer(TEST_SERVER, async (server) => {
        const tools = await server.listTools();

        expect(tools).toHaveLength(6);
        expect(tools.map((t: any) => t.name)).toEqual(
          expect.arrayContaining([
            "add",
            "multiply",
            "divide",
            "echo",
            "uppercase",
            "reverse",
          ]),
        );
      });
    });

    it("should include tool metadata", async () => {
      await withMCPServer(TEST_SERVER, async (server) => {
        const tools = await server.listTools();
        const addTool = tools.find((t: any) => t.name === "add");

        expect(addTool).toBeDefined();
        expect(addTool!.description).toBe("Add two numbers");
        expect(addTool!.inputSchema).toBeDefined();
        expect(addTool!.inputSchema.properties).toHaveProperty("a");
        expect(addTool!.inputSchema.properties).toHaveProperty("b");
      });
    });

    it("should handle empty tool list", async () => {
      // We'd need a server with no tools for this, skip for now
      // or create a minimal-server fixture
    });
  });

  describe("Tool Execution", () => {
    it("should call tool with valid params", async () => {
      await withMCPServer(TEST_SERVER, async (server) => {
        const result = await server.callTool("add", { a: 5, b: 3 });

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("text");
        expect(result[0].text).toBe("8");
      });
    });

    it("should handle multiple different tool calls", async () => {
      await withMCPServer(TEST_SERVER, async (server) => {
        const add = await server.callTool("add", { a: 10, b: 20 });
        expect(add[0].text).toBe("30");

        const multiply = await server.callTool("multiply", { a: 4, b: 5 });
        expect(multiply[0].text).toBe("20");

        const divide = await server.callTool("divide", { a: 100, b: 4 });
        expect(divide[0].text).toBe("25");
      });
    });

    it("should handle tool execution error", async () => {
      await withMCPServer(TEST_SERVER, async (server) => {
        // Division by zero should throw
        await expect(
          server.callTool("divide", { a: 10, b: 0 }),
        ).rejects.toThrow("Division by zero");
      });
    });

    it("should handle tool not found", async () => {
      await withMCPServer(TEST_SERVER, async (server) => {
        await expect(
          server.callTool("nonexistent", { foo: "bar" }),
        ).rejects.toThrow();
      });
    });

    it("should work with string manipulation tools", async () => {
      await withMCPServer(TEST_SERVER, async (server) => {
        const echo = await server.callTool("echo", { text: "hello" });
        expect(echo[0].text).toBe("hello");

        const upper = await server.callTool("uppercase", { text: "hello" });
        expect(upper[0].text).toBe("HELLO");

        const reverse = await server.callTool("reverse", { text: "hello" });
        expect(reverse[0].text).toBe("olleh");
      });
    });
  });

  describe("Caching", () => {
    it("should not cache tools list by default", async () => {
      const server = createMCPServer(TEST_SERVER, {
        cacheToolsList: false,
      });

      await server.connect();

      const tools1 = await server.listTools();
      const tools2 = await server.listTools();

      // Both should succeed (no cache = fresh fetch each time)
      expect(tools1).toHaveLength(6);
      expect(tools2).toHaveLength(6);

      await server.close();
    });

    it("should cache tools list when enabled", async () => {
      const server = createMCPServer(TEST_SERVER, {
        cacheToolsList: true,
      });

      await server.connect();

      const tools1 = await server.listTools();
      const tools2 = await server.listTools();

      // Should get same results from cache
      expect(tools1).toHaveLength(6);
      expect(tools2).toHaveLength(6);
      expect(tools1).toEqual(tools2);

      await server.close();
    });

    it("should invalidate cache when requested", async () => {
      const server = createMCPServer(TEST_SERVER, {
        cacheToolsList: true,
      });

      await server.connect();

      const tools1 = await server.listTools();
      expect(tools1).toHaveLength(6);

      await server.invalidateCache();

      const tools2 = await server.listTools();
      expect(tools2).toHaveLength(6);

      await server.close();
    });
  });

  describe("Constructor options", () => {
    it("should accept command and args", async () => {
      const server = new MCPServerStdio({
        id: "test",
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      await server.connect();
      const tools = await server.listTools();
      expect(tools.length).toBeGreaterThan(0);
      await server.close();
    });

    it("should use custom id", async () => {
      const server = createMCPServer(TEST_SERVER, { id: "my-test-server" });
      expect(server.id).toBe("my-test-server");
    });

    it("should generate default id from command", async () => {
      const server = new MCPServerStdio({
        command: "npx",
        args: ["tsx", TEST_SERVER],
      });

      expect(server.id).toContain("npx");
    });
  });

  describe("Error handling", () => {
    it("should throw error when calling tool before connect", async () => {
      const server = createMCPServer(TEST_SERVER);

      await expect(server.callTool("add", { a: 1, b: 2 })).rejects.toThrow();
    });

    it("should throw error when listing tools before connect", async () => {
      const server = createMCPServer(TEST_SERVER);

      await expect(server.listTools()).rejects.toThrow();
    });
  });
});
