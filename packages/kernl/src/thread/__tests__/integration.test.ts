import { describe, it, expect, beforeAll } from "vitest";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { AISDKLanguageModel } from "@kernl-sdk/ai";

import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { tool, Toolkit } from "@/tool";

import { Thread } from "../thread";

import type { ThreadEvent } from "@/types/thread";

/**
 * Integration tests for Thread streaming with real AI SDK providers.
 *
 * These tests require an OPENAI_API_KEY environment variable to be set.
 * They will be skipped if the API key is not available.
 *
 * Run with: OPENAI_API_KEY=your-key pnpm test:run
 */

const SKIP_INTEGRATION_TESTS = !process.env.OPENAI_API_KEY;

describe.skipIf(SKIP_INTEGRATION_TESTS)(
  "Thread streaming integration",
  () => {
    let kernl: Kernl;
    let model: AISDKLanguageModel;

    beforeAll(() => {
      kernl = new Kernl();
      model = new AISDKLanguageModel(openai("gpt-4o"));
    });

    describe("stream()", () => {
      it(
        "should yield both delta events and complete items",
        async () => {
      const agent = new Agent({
        id: "test-stream",
        name: "Test Stream Agent",
        instructions: "You are a helpful assistant.",
        model,
      });

      const input: ThreadEvent[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [
            { kind: "text", text: "Say 'Hello World' and nothing else." },
          ],
        },
      ];

      const thread = new Thread(kernl, agent, input);
      const events = [];

      for await (const event of thread.stream()) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have text-delta events (for streaming UX)
      const textDeltas = events.filter((e) => e.kind === "text-delta");
      expect(textDeltas.length).toBeGreaterThan(0);

      // Should have text-start event
      const textStarts = events.filter((e) => e.kind === "text-start");
      expect(textStarts.length).toBeGreaterThan(0);

      // Should have text-end event
      const textEnds = events.filter((e) => e.kind === "text-end");
      expect(textEnds.length).toBeGreaterThan(0);

      // Should have complete Message item (for history)
      const messages = events.filter((e) => e.kind === "message");
      expect(messages.length).toBeGreaterThan(0);

      const assistantMessage = messages.find(
        (m: any) => m.role === "assistant",
      );
      expect(assistantMessage).toBeDefined();
      expect((assistantMessage as any).content).toBeDefined();
      expect((assistantMessage as any).content.length).toBeGreaterThan(0);

      // Message should have accumulated text from all deltas
      const textContent = (assistantMessage as any).content.find(
        (c: any) => c.kind === "text",
      );
      expect(textContent).toBeDefined();
      expect(textContent.text).toBeDefined();
      expect(textContent.text.length).toBeGreaterThan(0);

      // Verify accumulated text matches concatenated deltas
      const accumulatedFromDeltas = textDeltas.map((d: any) => d.text).join("");
      expect(textContent.text).toBe(accumulatedFromDeltas);

      // Should have finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);
        },
        30000,
      );

      it(
        "should filter deltas from history but include complete items",
        async () => {
      const agent = new Agent({
        id: "test-history",
        name: "Test History Agent",
        instructions: "You are a helpful assistant.",
        model,
      });

      const input: ThreadEvent[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [{ kind: "text", text: "Count to 3" }],
        },
      ];

      const thread = new Thread(kernl, agent, input);
      const streamEvents = [];

      for await (const event of thread.stream()) {
        streamEvents.push(event);
      }

      // Access private history via type assertion for testing
      const history = (thread as any).history as ThreadEvent[];

      // History should only contain complete items (message, reasoning, tool-call, tool-result)
      // TypeScript already enforces this via ThreadEvent type, but let's verify at runtime
      for (const event of history) {
        expect(["message", "reasoning", "tool-call", "tool-result"]).toContain(
          event.kind,
        );
      }

      // Stream events should include deltas (but history should not)
      const streamDeltas = streamEvents.filter(
        (e: any) =>
          e.kind === "text-delta" ||
          e.kind === "text-start" ||
          e.kind === "text-end",
      );
      expect(streamDeltas.length).toBeGreaterThan(0);

      // History should contain the input message
      expect(history[0]).toEqual(input[0]);

      // History should contain complete Message items
      const historyMessages = history.filter((e) => e.kind === "message");
      expect(historyMessages.length).toBeGreaterThan(1); // input + assistant response

      // Verify assistant message has complete text (not deltas)
      const assistantMessage = historyMessages.find(
        (m: any) => m.role === "assistant",
      );
      expect(assistantMessage).toBeDefined();
      const textContent = (assistantMessage as any).content.find(
        (c: any) => c.kind === "text",
      );
      expect(textContent.text).toBeTruthy();
      expect(textContent.text.length).toBeGreaterThan(0);
        },
        30000,
      );

      it("should work with tool calls", async () => {
      const addTool = tool({
        id: "add",
        name: "add",
        description: "Add two numbers together",
        parameters: z.object({
          a: z.number().describe("The first number"),
          b: z.number().describe("The second number"),
        }),
        execute: async (ctx, { a, b }) => {
          return a + b;
        },
      });

      const toolkit = new Toolkit({
        id: "math",
        tools: [addTool],
      });

      const agent = new Agent({
        id: "test-tools",
        name: "Test Tools Agent",
        instructions: "You are a helpful assistant that can do math.",
        model,
        toolkits: [toolkit],
      });

      const input: ThreadEvent[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [{ kind: "text", text: "What is 25 + 17?" }],
        },
      ];

      const thread = new Thread(kernl, agent, input);
      const events = [];

      for await (const event of thread.stream()) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have tool calls
      const toolCalls = events.filter((e) => e.kind === "tool-call");
      expect(toolCalls.length).toBeGreaterThan(0);

      // Should have tool results
      const toolResults = events.filter((e) => e.kind === "tool-result");
      expect(toolResults.length).toBeGreaterThan(0);

      // History should contain tool calls and results
      const history = (thread as any).history as ThreadEvent[];
      const historyToolCalls = history.filter((e) => e.kind === "tool-call");
      const historyToolResults = history.filter(
        (e) => e.kind === "tool-result",
      );

      expect(historyToolCalls.length).toBe(toolCalls.length);
      expect(historyToolResults.length).toBe(toolResults.length);
        },
        30000,
      );
    });

    describe("execute()", () => {
      it(
        "should consume stream and return final response",
        async () => {
      const agent = new Agent({
        id: "test-blocking",
        name: "Test Blocking Agent",
        instructions: "You are a helpful assistant.",
        model,
      });

      const input: ThreadEvent[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [{ kind: "text", text: "Say 'Testing' and nothing else." }],
        },
      ];

      const thread = new Thread(kernl, agent, input);
      const result = await thread.execute();

      // Should have a response
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe("string");
      expect(result.response.length).toBeGreaterThan(0);

      // Should have final state
      expect(result.state).toBe("stopped");
        },
        30000,
      );

      it(
        "should validate structured output in blocking mode",
        async () => {
      const responseSchema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const agent = new Agent({
        id: "test-structured",
        name: "Test Structured Agent",
        instructions:
          "You are a helpful assistant. Return JSON with name and age fields.",
        model,
        responseType: responseSchema,
      });

      const input: ThreadEvent[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [
            {
              kind: "text",
              text: 'Return a JSON object with name "Alice" and age 30',
            },
          ],
        },
      ];

      const thread = new Thread(kernl, agent, input);
      const result = await thread.execute();

      // Response should be validated and parsed
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe("object");
      expect((result.response as any).name).toBeTruthy();
      expect(typeof (result.response as any).age).toBe("number");
        },
        30000,
      );
    });
  },
);
