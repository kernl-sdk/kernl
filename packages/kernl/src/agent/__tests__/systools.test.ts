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

      // memory + sleep toolkits
      expect(agent.systools.length).toBe(2);
      expect(agent.systools[0].id).toBe("sys.memory");
      expect(agent.systools[1].id).toBe("sys.sleep");
    });

    it("has only sleep toolkit when memory not configured", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      // sleep is always registered
      expect(agent.systools.length).toBe(1);
      expect(agent.systools[0].id).toBe("sys.sleep");
    });

    it("has only sleep toolkit when memory.enabled is false", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        memory: { enabled: false },
      });

      const kernl = new Kernl();
      kernl.register(agent);

      // sleep is always registered
      expect(agent.systools.length).toBe(1);
      expect(agent.systools[0].id).toBe("sys.sleep");
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

      // Memory tools should be first (from systools), then sleep tools
      // Order: memory tools (list, create, update, search), then sleep tools (wait_until)
      expect(tools[0].id).toBe("list_memories");
      expect(tools[1].id).toBe("create_memory");
      expect(tools[2].id).toBe("update_memory");
      expect(tools[3].id).toBe("search_memories");
      expect(tools[4].id).toBe("wait_until");
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

  describe("sleep toolkit", () => {
    it("sleep toolkit is always registered", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      const sleepToolkit = agent.systools.find((t) => t.id === "sys.sleep");
      expect(sleepToolkit).toBeDefined();
    });

    it("can retrieve wait_until tool via agent.tool()", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      expect(agent.tool("wait_until")).toBeDefined();
    });

    it("includes wait_until in agent.tools() output", async () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      const ctx = new Context("test");
      const tools = await agent.tools(ctx);
      const ids = tools.map((t) => t.id);

      expect(ids).toContain("wait_until");
    });

    it("wait_until tool has correct description", () => {
      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      const tool = agent.tool("wait_until");
      expect(tool).toBeDefined();
      expect(tool!.id).toBe("wait_until");
    });
  });
});
