import { describe, it, expect } from "vitest";
import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { Context } from "@/context";
import { createMockModel } from "@/thread/__tests__/fixtures/mock-model";
import { message } from "@kernl-sdk/protocol";

describe("Agent systools", () => {
  const model = createMockModel(async () => ({
    content: [message({ role: "assistant", text: "Done" })],
    finishReason: "stop",
    usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
    warnings: [],
  }));

  describe("memory toolkit", () => {
    it("adds memory toolkit when memory.enabled is true", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        memory: { enabled: true },
      });

      const kernl = new Kernl();
      kernl.register(agent);

      expect(agent.systools.length).toBe(1);
      expect(agent.systools[0].id).toBe("sys.memory");
    });

    it("has no systools when memory not configured", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      expect(agent.systools.length).toBe(0);
    });

    it("has no systools when memory.enabled is false", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        memory: { enabled: false },
      });

      const kernl = new Kernl();
      kernl.register(agent);

      expect(agent.systools.length).toBe(0);
    });

    it("can retrieve memory tools via agent.tool()", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        memory: { enabled: true },
      });

      const kernl = new Kernl();
      kernl.register(agent);

      expect(agent.tool("search_memories")).toBeDefined();
      expect(agent.tool("create_memory")).toBeDefined();
      expect(agent.tool("update_memory")).toBeDefined();
      expect(agent.tool("list_memories")).toBeDefined();
    });

    it("includes memory tools in agent.tools() output", async () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        memory: { enabled: true },
      });

      const kernl = new Kernl();
      kernl.register(agent);

      const ctx = new Context("test");
      const tools = await agent.tools(ctx);
      const ids = tools.map((t) => t.id);

      expect(ids).toContain("search_memories");
      expect(ids).toContain("create_memory");
      expect(ids).toContain("update_memory");
      expect(ids).toContain("list_memories");
    });

    it("systools appear before user toolkits in tools() output", async () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        memory: { enabled: true },
      });

      const kernl = new Kernl();
      kernl.register(agent);

      const ctx = new Context("test");
      const tools = await agent.tools(ctx);

      // Memory tools should be first (from systools)
      // Order: list, create, update, search
      expect(tools[0].id).toBe("list_memories");
      expect(tools[1].id).toBe("create_memory");
      expect(tools[2].id).toBe("update_memory");
      expect(tools[3].id).toBe("search_memories");
    });
  });

  describe("memory config defaults", () => {
    it("defaults memory to { enabled: false }", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      expect(agent.memory).toEqual({ enabled: false });
    });

    it("preserves memory config when provided", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        memory: { enabled: true },
      });

      expect(agent.memory).toEqual({ enabled: true });
    });
  });
});
