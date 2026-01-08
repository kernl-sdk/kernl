import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

import { IN_PROGRESS } from "@kernl-sdk/protocol";
import { message } from "@kernl-sdk/protocol";

import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { tool, FunctionToolkit } from "@/tool";
import { createMockModel } from "@/thread/__tests__/fixtures/mock-model";

import type {
  ThreadStartEvent,
  ThreadStopEvent,
  ModelCallStartEvent,
  ModelCallEndEvent,
  ToolCallStartEvent,
  ToolCallEndEvent,
} from "@/lifecycle";

describe("Lifecycle Hooks", () => {
  describe("Thread events", () => {
    it("emits thread.start on spawn()", async () => {
      const events: ThreadStartEvent[] = [];

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      }));

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      kernl.on("thread.start", (e) => events.push(e));

      await agent.run("Hello");

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "thread.start",
        agentId: "test-agent",
        namespace: "kernl",
      });
      expect(events[0].threadId).toBeDefined();
      expect(events[0].context).toBeDefined();
    });

    it("emits thread.stop with outcome=success on successful run", async () => {
      const events: ThreadStopEvent[] = [];

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      }));

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      kernl.on("thread.stop", (e) => events.push(e));

      await agent.run("Hello");

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "thread.stop",
        agentId: "test-agent",
        namespace: "kernl",
        outcome: "success",
        state: "stopped",
        result: "Done",
      });
    });

    it("emits thread.stop with outcome=error on failure", async () => {
      const events: ThreadStopEvent[] = [];

      const model = createMockModel(async () => {
        throw new Error("Model exploded");
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      kernl.on("thread.stop", (e) => events.push(e));

      await expect(agent.run("Hello")).rejects.toThrow("Model exploded");

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "thread.stop",
        agentId: "test-agent",
        outcome: "error",
        error: "Model exploded",
      });
    });

    it("propagates model events from agent to kernl", async () => {
      const agentEvents: ModelCallStartEvent[] = [];
      const kernlEvents: ModelCallStartEvent[] = [];

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      }));

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      // Model events are emitted by agent and bubble to kernl
      agent.on("model.call.start", (e) => agentEvents.push(e));
      kernl.on("model.call.start", (e) => kernlEvents.push(e));

      await agent.run("Hello");

      // Both should receive the event
      expect(agentEvents).toHaveLength(1);
      expect(kernlEvents).toHaveLength(1);
      expect(agentEvents[0].threadId).toBe(kernlEvents[0].threadId);
    });
  });

  describe("Model events", () => {
    it("emits model.call.start before generation", async () => {
      const events: ModelCallStartEvent[] = [];

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      }));

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      agent.on("model.call.start", (e) => events.push(e));

      await agent.run("Hello");

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "model.call.start",
        provider: "test",
        modelId: "test-model",
        agentId: "test-agent",
      });
      expect(events[0].threadId).toBeDefined();
      expect(events[0].context).toBeDefined();
      expect(events[0].settings).toBeDefined();
    });

    it("emits model.call.end with usage and finishReason after generation", async () => {
      const events: ModelCallEndEvent[] = [];

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        warnings: [],
      }));

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      agent.on("model.call.end", (e) => events.push(e));

      await agent.run("Hello");

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "model.call.end",
        provider: "test",
        modelId: "test-model",
        finishReason: "stop",
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        agentId: "test-agent",
      });
    });

    it("emits model.call.end with finishReason=error on model error", async () => {
      const events: ModelCallEndEvent[] = [];

      const model = createMockModel(async () => {
        throw new Error("Model failed");
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl = new Kernl();
      kernl.register(agent);

      agent.on("model.call.end", (e) => events.push(e));

      await expect(agent.run("Hello")).rejects.toThrow();

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "model.call.end",
        provider: "test",
        modelId: "test-model",
        finishReason: "error",
      });
    });

    it("emits events for each model call in multi-turn execution", async () => {
      const startEvents: ModelCallStartEvent[] = [];
      const endEvents: ModelCallEndEvent[] = [];
      let callCount = 0;

      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool-call" as const,
                toolId: "echo",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ text: "test" }),
              },
            ],
            finishReason: "stop",
            usage: { inputTokens: 5, outputTokens: 3, totalTokens: 8 },
            warnings: [],
          };
        }
        return {
          content: [message({ role: "assistant", text: "Done" })],
          finishReason: "stop",
          usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
          warnings: [],
        };
      });

      const echoTool = tool({
        id: "echo",
        description: "Echoes input",
        parameters: z.object({ text: z.string() }),
        execute: async (ctx, { text }) => `Echo: ${text}`,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "tools", tools: [echoTool] })],
      });

      const kernl = new Kernl();
      kernl.register(agent);

      agent.on("model.call.start", (e) => startEvents.push(e));
      agent.on("model.call.end", (e) => endEvents.push(e));

      await agent.run("Hello");

      // Should have 2 model calls (first returns tool call, second returns final response)
      expect(startEvents).toHaveLength(2);
      expect(endEvents).toHaveLength(2);

      // Verify usage from each call
      expect(endEvents[0].usage).toEqual({
        inputTokens: 5,
        outputTokens: 3,
        totalTokens: 8,
      });
      expect(endEvents[1].usage).toEqual({
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      });
    });
  });

  describe("Tool events", () => {
    it("emits tool.call.start with args before execution", async () => {
      const events: ToolCallStartEvent[] = [];
      let callCount = 0;

      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool-call" as const,
                toolId: "add",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ a: 5, b: 3 }),
              },
            ],
            finishReason: "stop",
            usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
            warnings: [],
          };
        }
        return {
          content: [message({ role: "assistant", text: "Done" })],
          finishReason: "stop",
          usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
          warnings: [],
        };
      });

      const addTool = tool({
        id: "add",
        description: "Adds numbers",
        parameters: z.object({ a: z.number(), b: z.number() }),
        execute: async (ctx, { a, b }) => a + b,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "tools", tools: [addTool] })],
      });

      const kernl = new Kernl();
      kernl.register(agent);

      agent.on("tool.call.start", (e) => events.push(e));

      await agent.run("Add 5 and 3");

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "tool.call.start",
        toolId: "add",
        callId: "call_1",
        agentId: "test-agent",
        args: { a: 5, b: 3 },
      });
      expect(events[0].threadId).toBeDefined();
      expect(events[0].context).toBeDefined();
    });

    it("emits tool.call.end with result on success", async () => {
      const events: ToolCallEndEvent[] = [];
      let callCount = 0;

      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool-call" as const,
                toolId: "add",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ a: 5, b: 3 }),
              },
            ],
            finishReason: "stop",
            usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
            warnings: [],
          };
        }
        return {
          content: [message({ role: "assistant", text: "Done" })],
          finishReason: "stop",
          usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
          warnings: [],
        };
      });

      const addTool = tool({
        id: "add",
        description: "Adds numbers",
        parameters: z.object({ a: z.number(), b: z.number() }),
        execute: async (ctx, { a, b }) => a + b,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "tools", tools: [addTool] })],
      });

      const kernl = new Kernl();
      kernl.register(agent);

      agent.on("tool.call.end", (e) => events.push(e));

      await agent.run("Add 5 and 3");

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "tool.call.end",
        toolId: "add",
        callId: "call_1",
        agentId: "test-agent",
        state: "completed",
        result: "8",
      });
    });

    it("emits tool.call.end with error on failure", async () => {
      const events: ToolCallEndEvent[] = [];
      let callCount = 0;

      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool-call" as const,
                toolId: "failing",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: "{}",
              },
            ],
            finishReason: "stop",
            usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
            warnings: [],
          };
        }
        return {
          content: [message({ role: "assistant", text: "Done" })],
          finishReason: "stop",
          usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
          warnings: [],
        };
      });

      const failingTool = tool({
        id: "failing",
        description: "Tool that throws",
        parameters: undefined,
        execute: async () => {
          throw new Error("Tool execution failed!");
        },
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "tools", tools: [failingTool] })],
      });

      const kernl = new Kernl();
      kernl.register(agent);

      agent.on("tool.call.end", (e) => events.push(e));

      await agent.run("Use failing tool");

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "tool.call.end",
        toolId: "failing",
        callId: "call_1",
        state: "failed",
      });
      expect(events[0].error).toContain("Tool execution failed!");
    });

    it("emits events for parallel tool calls", async () => {
      const startEvents: ToolCallStartEvent[] = [];
      const endEvents: ToolCallEndEvent[] = [];
      let callCount = 0;

      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool-call" as const,
                toolId: "tool1",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ value: "a" }),
              },
              {
                kind: "tool-call" as const,
                toolId: "tool2",
                state: IN_PROGRESS,
                callId: "call_2",
                arguments: JSON.stringify({ value: "b" }),
              },
            ],
            finishReason: "stop",
            usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
            warnings: [],
          };
        }
        return {
          content: [message({ role: "assistant", text: "Done" })],
          finishReason: "stop",
          usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
          warnings: [],
        };
      });

      const tool1 = tool({
        id: "tool1",
        description: "Tool 1",
        parameters: z.object({ value: z.string() }),
        execute: async (ctx, { value }) => `Tool1: ${value}`,
      });

      const tool2 = tool({
        id: "tool2",
        description: "Tool 2",
        parameters: z.object({ value: z.string() }),
        execute: async (ctx, { value }) => `Tool2: ${value}`,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "tools", tools: [tool1, tool2] })],
      });

      const kernl = new Kernl();
      kernl.register(agent);

      agent.on("tool.call.start", (e) => startEvents.push(e));
      agent.on("tool.call.end", (e) => endEvents.push(e));

      await agent.run("Use both tools");

      expect(startEvents).toHaveLength(2);
      expect(endEvents).toHaveLength(2);

      // Verify both tools were called
      const toolIds = startEvents.map((e) => e.toolId);
      expect(toolIds).toContain("tool1");
      expect(toolIds).toContain("tool2");

      // Verify both completed successfully
      expect(endEvents.every((e) => e.state === "completed")).toBe(true);
    });
  });

  describe("Streaming", () => {
    it("emits same events for stream() as run()", async () => {
      const runEvents: string[] = [];
      const streamEvents: string[] = [];

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      }));

      // Run agent
      const agent1 = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl1 = new Kernl();
      kernl1.register(agent1);

      kernl1.on("thread.start", () => runEvents.push("thread.start"));
      kernl1.on("thread.stop", () => runEvents.push("thread.stop"));
      agent1.on("model.call.start", () => runEvents.push("model.call.start"));
      agent1.on("model.call.end", () => runEvents.push("model.call.end"));

      await agent1.run("Hello");

      // Stream agent
      const agent2 = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const kernl2 = new Kernl();
      kernl2.register(agent2);

      kernl2.on("thread.start", () => streamEvents.push("thread.start"));
      kernl2.on("thread.stop", () => streamEvents.push("thread.stop"));
      agent2.on("model.call.start", () => streamEvents.push("model.call.start"));
      agent2.on("model.call.end", () => streamEvents.push("model.call.end"));

      for await (const _ of agent2.stream("Hello")) {
        // consume stream
      }

      // Both should emit the same lifecycle events in the same order
      expect(streamEvents).toEqual(runEvents);
      expect(runEvents).toEqual([
        "thread.start",
        "model.call.start",
        "model.call.end",
        "thread.stop",
      ]);
    });
  });
});
