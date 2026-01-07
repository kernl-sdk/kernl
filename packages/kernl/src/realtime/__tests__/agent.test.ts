import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";

import { RealtimeAgent } from "../agent";
import { Context } from "@/context";
import { FunctionToolkit, tool } from "@/tool";
import { MisconfiguredError } from "@/lib/error";
import { createMockRealtimeModel } from "./fixtures";

describe("RealtimeAgent", () => {
  describe("constructor", () => {
    it("should set kind to 'realtime'", () => {
      const model = createMockRealtimeModel();
      const agent = new RealtimeAgent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "You are a test agent.",
        model,
      });

      expect(agent.kind).toBe("realtime");
    });

    it("should store model from config", () => {
      const model = createMockRealtimeModel({
        provider: "openai",
        modelId: "gpt-4o-realtime",
      });
      const agent = new RealtimeAgent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "You are a test agent.",
        model,
      });

      expect(agent.model).toBe(model);
      expect(agent.model.provider).toBe("openai");
      expect(agent.model.modelId).toBe("gpt-4o-realtime");
    });

    it("should store voice config from config", () => {
      const model = createMockRealtimeModel();
      const agent = new RealtimeAgent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "You are a test agent.",
        model,
        voice: { voiceId: "alloy", speed: 1.2 },
      });

      expect(agent.voice).toEqual({ voiceId: "alloy", speed: 1.2 });
    });

    it("should allow undefined voice config", () => {
      const model = createMockRealtimeModel();
      const agent = new RealtimeAgent({
        id: "test-agent",
        name: "Test Agent",
        instructions: "You are a test agent.",
        model,
      });

      expect(agent.voice).toBeUndefined();
    });
  });

  describe("inherited from BaseAgent", () => {
    it("should set id, name, description", () => {
      const model = createMockRealtimeModel();
      const agent = new RealtimeAgent({
        id: "my-agent",
        name: "My Agent",
        description: "A test agent for testing",
        instructions: "You are helpful.",
        model,
      });

      expect(agent.id).toBe("my-agent");
      expect(agent.name).toBe("My Agent");
      expect(agent.description).toBe("A test agent for testing");
    });

    it("should throw MisconfiguredError for empty id", () => {
      const model = createMockRealtimeModel();

      expect(
        () =>
          new RealtimeAgent({
            id: "",
            name: "Test",
            instructions: "Test",
            model,
          }),
      ).toThrow(MisconfiguredError);

      expect(
        () =>
          new RealtimeAgent({
            id: "   ",
            name: "Test",
            instructions: "Test",
            model,
          }),
      ).toThrow(MisconfiguredError);
    });

    it("should normalize instructions to function", async () => {
      const model = createMockRealtimeModel();
      const ctx = new Context("test", {});

      // String instructions
      const agent1 = new RealtimeAgent({
        id: "test-1",
        name: "Test",
        instructions: "Static instructions",
        model,
      });
      expect(await agent1.instructions(ctx)).toBe("Static instructions");

      // Function instructions
      const agent2 = new RealtimeAgent({
        id: "test-2",
        name: "Test",
        instructions: (ctx) => `Dynamic for ${ctx.namespace}`,
        model,
      });
      expect(await agent2.instructions(ctx)).toBe("Dynamic for test");
    });

    it("should bind toolkits to agent", () => {
      const model = createMockRealtimeModel();
      const testTool = tool({
        id: "test-tool",
        description: "A test tool",
        parameters: z.object({ input: z.string() }),
        execute: async () => "result",
      });

      const toolkit = new FunctionToolkit({
        id: "test-toolkit",
        tools: [testTool],
      });

      const agent = new RealtimeAgent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [toolkit],
      });

      expect(agent.toolkits).toHaveLength(1);
      expect(agent.toolkits[0]).toBe(toolkit);
    });

    it("should initialize memory config", () => {
      const model = createMockRealtimeModel();

      // Default (disabled)
      const agent1 = new RealtimeAgent({
        id: "test-1",
        name: "Test",
        instructions: "Test",
        model,
      });
      expect(agent1.memory).toEqual({ enabled: false });

      // Enabled
      const agent2 = new RealtimeAgent({
        id: "test-2",
        name: "Test",
        instructions: "Test",
        model,
        memory: { enabled: true },
      });
      expect(agent2.memory).toEqual({ enabled: true });
    });
  });

  describe("tool access", () => {
    let agent: RealtimeAgent;
    let toolkit: FunctionToolkit;

    beforeEach(() => {
      const model = createMockRealtimeModel();
      const testTool1 = tool({
        id: "tool-1",
        description: "Tool 1",
        parameters: undefined,
        execute: async () => "result-1",
      });
      const testTool2 = tool({
        id: "tool-2",
        description: "Tool 2",
        parameters: z.object({ value: z.number() }),
        execute: async () => "result-2",
      });

      toolkit = new FunctionToolkit({
        id: "test-toolkit",
        tools: [testTool1, testTool2],
      });

      agent = new RealtimeAgent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [toolkit],
      });
    });

    it("should return tool by id via tool()", () => {
      const tool1 = agent.tool("tool-1");
      expect(tool1).toBeDefined();
      expect(tool1?.id).toBe("tool-1");

      const tool2 = agent.tool("tool-2");
      expect(tool2).toBeDefined();
      expect(tool2?.id).toBe("tool-2");
    });

    it("should return undefined for unknown tool", () => {
      const tool = agent.tool("unknown-tool");
      expect(tool).toBeUndefined();
    });

    it("should list all tools via tools()", async () => {
      const ctx = new Context("test", {});
      const tools = await agent.tools(ctx);

      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.id)).toContain("tool-1");
      expect(tools.map((t) => t.id)).toContain("tool-2");
    });

    it("should throw on duplicate tool ids", async () => {
      const model = createMockRealtimeModel();
      const duplicateTool = tool({
        id: "duplicate",
        description: "Duplicate",
        parameters: undefined,
        execute: async () => "result",
      });

      const toolkit1 = new FunctionToolkit({
        id: "toolkit-1",
        tools: [duplicateTool],
      });
      const toolkit2 = new FunctionToolkit({
        id: "toolkit-2",
        tools: [duplicateTool],
      });

      const agentWithDuplicates = new RealtimeAgent({
        id: "test",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [toolkit1, toolkit2],
      });

      const ctx = new Context("test", {});
      await expect(agentWithDuplicates.tools(ctx)).rejects.toThrow(
        MisconfiguredError,
      );
      await expect(agentWithDuplicates.tools(ctx)).rejects.toThrow(
        /Duplicate tool IDs/,
      );
    });
  });
});
