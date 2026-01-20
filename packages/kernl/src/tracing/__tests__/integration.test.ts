import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";

import { IN_PROGRESS, message } from "@kernl-sdk/protocol";

import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { Thread } from "@/thread";
import { tool, FunctionToolkit } from "@/tool";
import { createMockModel } from "@/thread/__tests__/fixtures/mock-model";
import { setSubscriber, clearSubscriber } from "../dispatch";
import { TestSubscriber } from "./helpers";

describe("Tracing Integration", () => {
  let subscriber: TestSubscriber;

  beforeEach(() => {
    subscriber = new TestSubscriber();
  });

  afterEach(() => {
    clearSubscriber();
  });

  describe("Thread spans", () => {
    it("should create thread span on execution", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      await thread.execute();

      const threadSpans = subscriber.spansOfKind("thread");
      expect(threadSpans).toHaveLength(1);
      expect(threadSpans[0].data).toMatchObject({
        kind: "thread",
        threadId: thread.tid,
        agentId: "test-agent",
        namespace: "kernl",
      });
      expect(threadSpans[0].parent).toBeNull(); // root span
    });

    it("should complete thread span lifecycle", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      await thread.execute();

      const threadSpans = subscriber.spansOfKind("thread");
      const spanId = threadSpans[0].id;

      expect(subscriber.entered.has(spanId)).toBe(true);
      expect(subscriber.closed.has(spanId)).toBe(true);
    });

    it("should record result on successful execution", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Success!" })],
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      await thread.execute();

      const threadSpans = subscriber.spansOfKind("thread");
      const spanId = threadSpans[0].id;
      const recorded = subscriber.getRecorded(spanId);

      expect(recorded.length).toBeGreaterThan(0);
      expect(recorded.some((r) => (r as any).state === "stopped")).toBe(true);
      expect(recorded.some((r) => (r as any).result === "Success!")).toBe(true);
    });

    it("should record error and emit event on failure", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => {
        throw new Error("Model failed");
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      await expect(thread.execute()).rejects.toThrow("Model failed");

      // Check thread span recorded error
      const threadSpans = subscriber.spansOfKind("thread");
      const spanId = threadSpans[0].id;
      const errors = subscriber.errors.get(spanId);
      expect(errors).toHaveLength(1);
      expect(errors![0].message).toBe("Model failed");

      // Check thread.error event was emitted
      const errorEvents = subscriber.eventsOfKind("thread.error");
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].data.message).toBe("Model failed");
      expect(errorEvents[0].parent).toBeNull(); // parent context not set for events in generators
    });

    it("should include context in thread span", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      }));

      const agent = new Agent<{ userId: string }>({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
      });

      // Import Context and pass it properly
      const { Context } = await import("@/context");
      const ctx = new Context<{ userId: string }>("kernl", { userId: "user_123" });

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
        context: ctx,
      });

      await thread.execute();

      const threadSpans = subscriber.spansOfKind("thread");
      // Context is passed from thread.context.context
      expect(threadSpans[0].data.context).toEqual({ userId: "user_123" });
    });
  });

  describe("Model call spans", () => {
    it("should create model.call span nested under thread span", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      await thread.execute();

      const threadSpans = subscriber.spansOfKind("thread");
      const modelSpans = subscriber.spansOfKind("model.call");

      expect(modelSpans).toHaveLength(1);
      expect(modelSpans[0].parent).toBe(threadSpans[0].id);
    });

    it("should include provider and modelId", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      await thread.execute();

      const modelSpans = subscriber.spansOfKind("model.call");
      expect(modelSpans[0].data).toMatchObject({
        kind: "model.call",
        provider: "test",
        modelId: "test-model",
      });
    });

    it("should include request in span data", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      }));

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test instructions",
        model,
      });

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      await thread.execute();

      const modelSpans = subscriber.spansOfKind("model.call");
      expect(modelSpans[0].data.request).toBeDefined();
      expect(modelSpans[0].data.request?.input).toBeDefined();
    });

    it("should record response with usage and finishReason", async () => {
      setSubscriber(subscriber);

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      await thread.execute();

      const modelSpans = subscriber.spansOfKind("model.call");
      const spanId = modelSpans[0].id;
      const recorded = subscriber.getRecorded(spanId);

      expect(recorded.length).toBeGreaterThan(0);
      const responseRecord = recorded.find((r) => (r as any).response);
      expect(responseRecord).toBeDefined();
      expect((responseRecord as any).response.usage).toEqual({
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      });
    });

    it("should create multiple model.call spans for multi-turn execution", async () => {
      setSubscriber(subscriber);

      let callCount = 0;
      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool.call" as const,
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Use echo" })],
      });

      await thread.execute();

      const threadSpans = subscriber.spansOfKind("thread");
      const modelSpans = subscriber.spansOfKind("model.call");

      expect(modelSpans).toHaveLength(2);
      // Both should be children of the thread span
      expect(modelSpans[0].parent).toBe(threadSpans[0].id);
      expect(modelSpans[1].parent).toBe(threadSpans[0].id);
    });
  });

  describe("Tool call spans", () => {
    it("should create tool.call span nested under thread span", async () => {
      setSubscriber(subscriber);

      let callCount = 0;
      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool.call" as const,
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Add" })],
      });

      await thread.execute();

      const threadSpans = subscriber.spansOfKind("thread");
      const toolSpans = subscriber.spansOfKind("tool.call");

      expect(toolSpans).toHaveLength(1);
      expect(toolSpans[0].parent).toBe(threadSpans[0].id);
    });

    it("should include toolId, callId, and args", async () => {
      setSubscriber(subscriber);

      let callCount = 0;
      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool.call" as const,
                toolId: "greet",
                state: IN_PROGRESS,
                callId: "call_xyz",
                arguments: JSON.stringify({ name: "Alice" }),
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

      const greetTool = tool({
        id: "greet",
        description: "Greets someone",
        parameters: z.object({ name: z.string() }),
        execute: async (ctx, { name }) => `Hello, ${name}!`,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "tools", tools: [greetTool] })],
      });

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Greet" })],
      });

      await thread.execute();

      const toolSpans = subscriber.spansOfKind("tool.call");
      expect(toolSpans[0].data).toMatchObject({
        kind: "tool.call",
        toolId: "greet",
        callId: "call_xyz",
        args: { name: "Alice" },
      });
    });

    it("should record result and state on success", async () => {
      setSubscriber(subscriber);

      let callCount = 0;
      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool.call" as const,
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Add" })],
      });

      await thread.execute();

      const toolSpans = subscriber.spansOfKind("tool.call");
      const spanId = toolSpans[0].id;
      const recorded = subscriber.getRecorded(spanId);

      expect(recorded.length).toBeGreaterThan(0);
      expect(recorded.some((r) => (r as any).state === "completed")).toBe(true);
      // Tool returns a number (8), which is then stringified by tool result serialization
      expect(recorded.some((r) => (r as any).result === "8" || (r as any).result === 8)).toBe(true);
    });

    it("should record error on tool failure", async () => {
      setSubscriber(subscriber);

      let callCount = 0;
      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool.call" as const,
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
          throw new Error("Tool exploded!");
        },
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "tools", tools: [failingTool] })],
      });

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Fail" })],
      });

      await thread.execute();

      const toolSpans = subscriber.spansOfKind("tool.call");
      const spanId = toolSpans[0].id;

      // Note: tool.invoke() catches execution errors internally and returns a FAILED result,
      // so span.error() is NOT called. The error is recorded via span.record() instead.
      const recorded = subscriber.getRecorded(spanId);
      expect(recorded.some((r) => (r as any).state === "failed")).toBe(true);
      // Error message is wrapped by default error handler, so check for substring
      expect(
        recorded.some((r) => (r as any).error?.includes("Tool exploded!")),
      ).toBe(true);
    });

    it("should create multiple tool.call spans for parallel tool calls", async () => {
      setSubscriber(subscriber);

      let callCount = 0;
      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool.call" as const,
                toolId: "tool1",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ value: "a" }),
              },
              {
                kind: "tool.call" as const,
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
        execute: async (ctx, { value }) => `T1: ${value}`,
      });

      const tool2 = tool({
        id: "tool2",
        description: "Tool 2",
        parameters: z.object({ value: z.string() }),
        execute: async (ctx, { value }) => `T2: ${value}`,
      });

      const agent = new Agent({
        id: "test-agent",
        name: "Test",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "tools", tools: [tool1, tool2] })],
      });

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Use tools" })],
      });

      await thread.execute();

      const threadSpans = subscriber.spansOfKind("thread");
      const toolSpans = subscriber.spansOfKind("tool.call");

      expect(toolSpans).toHaveLength(2);
      // Both should be children of the thread span
      expect(toolSpans[0].parent).toBe(threadSpans[0].id);
      expect(toolSpans[1].parent).toBe(threadSpans[0].id);

      // Verify both tool IDs are present
      const toolIds = toolSpans.map((s) => s.data.toolId);
      expect(toolIds).toContain("tool1");
      expect(toolIds).toContain("tool2");
    });
  });

  describe("No subscriber configured", () => {
    it("should execute without errors when no subscriber is set", async () => {
      // Don't set subscriber
      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
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

      const thread = new Thread({
        agent,
        input: [message({ role: "user", text: "Hi" })],
      });

      // Should not throw
      const result = await thread.execute();
      expect(result.response).toBe("Hello");
    });
  });

  describe("Kernl-level tracer config", () => {
    it("should use tracer from Kernl options", async () => {
      const kernl = new Kernl({ tracer: subscriber });

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
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

      kernl.register(agent);

      await agent.run("Hi");

      const threadSpans = subscriber.spansOfKind("thread");
      expect(threadSpans).toHaveLength(1);

      // Clean up
      await kernl.shutdown();
    });

    it("should flush and shutdown subscriber on kernl.shutdown", async () => {
      const kernl = new Kernl({ tracer: subscriber });

      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello" })],
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

      kernl.register(agent);
      await agent.run("Hi");

      await kernl.shutdown();

      expect(subscriber.calls.some((c) => c.method === "flush")).toBe(true);
      expect(subscriber.calls.some((c) => c.method === "shutdown")).toBe(true);
    });
  });
});
