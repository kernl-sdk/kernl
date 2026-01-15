import { describe, it, expect, vi } from "vitest";
import type {
  LanguageModelV3,
  LanguageModelV3StreamPart,
} from "@ai-sdk/provider";
import { IN_PROGRESS } from "@kernl-sdk/protocol";

import { AISDKLanguageModel } from "../language-model";

/**
 * Unit tests for AISDKLanguageModel stream accumulation behavior
 */
describe("AISDKLanguageModel", () => {
  describe("stream - delta accumulation", () => {
    it("should yield delta events and complete Message on text-end", async () => {
      // Mock the underlying AI SDK model
      const mockModel: LanguageModelV3 = {
        provider: "test",
        modelId: "test-model",
        doStream: vi.fn().mockResolvedValue({
          stream: new ReadableStream({
            start(controller) {
              const parts: LanguageModelV3StreamPart[] = [
                {
                  type: "text-start",
                  id: "text-1",
                  providerMetadata: undefined,
                },
                {
                  type: "text-delta",
                  id: "text-1",
                  delta: "Hello",
                  providerMetadata: undefined,
                },
                {
                  type: "text-delta",
                  id: "text-1",
                  delta: " ",
                  providerMetadata: undefined,
                },
                {
                  type: "text-delta",
                  id: "text-1",
                  delta: "World",
                  providerMetadata: undefined,
                },
                {
                  type: "text-end",
                  id: "text-1",
                  providerMetadata: { test: { foo: "bar" } },
                },
                {
                  type: "finish",
                  finishReason: { unified: "stop", raw: "stop" },
                  usage: {
                    inputTokens: { total: 5, noCache: 5, cacheRead: undefined, cacheWrite: undefined },
                    outputTokens: { total: 10, text: 10, reasoning: undefined },
                  },
                  providerMetadata: undefined,
                },
              ];

              for (const part of parts) {
                controller.enqueue(part);
              }
              controller.close();
            },
          }),
        }),
      } as any;

      const model = new AISDKLanguageModel(mockModel);

      const events = [];
      for await (const event of model.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Hi" }],
          },
        ],
        settings: {},
      })) {
        events.push(event);
      }

      // Should have: start, 3 deltas, end, complete Message, finish
      expect(events).toHaveLength(7);

      // Check delta events
      expect(events[0]).toMatchObject({ kind: "text.start", id: "text-1" });
      expect(events[1]).toMatchObject({
        kind: "text.delta",
        id: "text-1",
        text: "Hello",
      });
      expect(events[2]).toMatchObject({
        kind: "text.delta",
        id: "text-1",
        text: " ",
      });
      expect(events[3]).toMatchObject({
        kind: "text.delta",
        id: "text-1",
        text: "World",
      });

      // Check complete Message item (yielded before end event)
      const messageEvent = events[4];
      expect(messageEvent.kind).toBe("message");
      expect(messageEvent).toMatchObject({
        kind: "message",
        role: "assistant",
        content: [
          {
            kind: "text",
            text: "Hello World", // Accumulated text
          },
        ],
        providerMetadata: { test: { foo: "bar" } }, // From end event
      });
      expect(messageEvent.id).toBeDefined();

      // Check end event (yielded after Message)
      expect(events[5]).toMatchObject({ kind: "text.end", id: "text-1" });

      // Check finish event
      expect(events[6]).toMatchObject({ kind: "finish" });
    });

    it("should yield delta events and complete Reasoning on reasoning-end", async () => {
      const mockModel: LanguageModelV3 = {
        provider: "test",
        modelId: "test-model",
        doStream: vi.fn().mockResolvedValue({
          stream: new ReadableStream({
            start(controller) {
              const parts: LanguageModelV3StreamPart[] = [
                {
                  type: "reasoning-start",
                  id: "reason-1",
                  providerMetadata: undefined,
                },
                {
                  type: "reasoning-delta",
                  id: "reason-1",
                  delta: "Let me think",
                  providerMetadata: undefined,
                },
                {
                  type: "reasoning-delta",
                  id: "reason-1",
                  delta: " about this",
                  providerMetadata: undefined,
                },
                {
                  type: "reasoning-end",
                  id: "reason-1",
                  providerMetadata: { test: { reasoning: true } },
                },
                {
                  type: "finish",
                  finishReason: { unified: "stop", raw: "stop" },
                  usage: {
                    inputTokens: { total: 5, noCache: 5, cacheRead: undefined, cacheWrite: undefined },
                    outputTokens: { total: 20, text: 20, reasoning: undefined },
                  },
                  providerMetadata: undefined,
                },
              ];

              for (const part of parts) {
                controller.enqueue(part);
              }
              controller.close();
            },
          }),
        }),
      } as any;

      const model = new AISDKLanguageModel(mockModel);

      const events = [];
      for await (const event of model.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Think about this" }],
          },
        ],
        settings: {},
      })) {
        events.push(event);
      }

      // Should have: start, 2 deltas, end, complete Reasoning, finish
      expect(events).toHaveLength(6);

      // Check delta events
      expect(events[0]).toMatchObject({
        kind: "reasoning.start",
        id: "reason-1",
      });
      expect(events[1]).toMatchObject({
        kind: "reasoning.delta",
        id: "reason-1",
        text: "Let me think",
      });
      expect(events[2]).toMatchObject({
        kind: "reasoning.delta",
        id: "reason-1",
        text: " about this",
      });

      // Check complete Reasoning item (yielded before end event)
      const reasoningEvent = events[3];
      expect(reasoningEvent.kind).toBe("reasoning");
      expect(reasoningEvent).toMatchObject({
        kind: "reasoning",
        text: "Let me think about this", // Accumulated text
        providerMetadata: { test: { reasoning: true } }, // From end event
      });
      expect(reasoningEvent.id).toBeDefined();

      // Check end event (yielded after Reasoning)
      expect(events[4]).toMatchObject({
        kind: "reasoning.end",
        id: "reason-1",
      });

      // Check finish event
      expect(events[5]).toMatchObject({ kind: "finish" });
    });

    it("should handle multiple text blocks with different IDs", async () => {
      const mockModel: LanguageModelV3 = {
        provider: "test",
        modelId: "test-model",
        doStream: vi.fn().mockResolvedValue({
          stream: new ReadableStream({
            start(controller) {
              const parts: LanguageModelV3StreamPart[] = [
                { type: "text-start", id: "text-1", providerMetadata: undefined },
                {
                  type: "text-delta",
                  id: "text-1",
                  delta: "First",
                  providerMetadata: undefined,
                },
                {
                  type: "text-end",
                  id: "text-1",
                  providerMetadata: { test: { order: 1 } },
                },
                { type: "text-start", id: "text-2", providerMetadata: undefined },
                {
                  type: "text-delta",
                  id: "text-2",
                  delta: "Second",
                  providerMetadata: undefined,
                },
                {
                  type: "text-end",
                  id: "text-2",
                  providerMetadata: { test: { order: 2 } },
                },
                {
                  type: "finish",
                  finishReason: { unified: "stop", raw: "stop" },
                  usage: {
                    inputTokens: { total: 5, noCache: 5, cacheRead: undefined, cacheWrite: undefined },
                    outputTokens: { total: 10, text: 10, reasoning: undefined },
                  },
                  providerMetadata: undefined,
                },
              ];

              for (const part of parts) {
                controller.enqueue(part);
              }
              controller.close();
            },
          }),
        }),
      } as any;

      const model = new AISDKLanguageModel(mockModel);

      const events = [];
      for await (const event of model.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Hi" }],
          },
        ],
        settings: {},
      })) {
        events.push(event);
      }

      // Check we got two separate Message items
      const messageEvents = events.filter((e) => e.kind === "message");
      expect(messageEvents).toHaveLength(2);

      expect(messageEvents[0]).toMatchObject({
        kind: "message",
        role: "assistant",
        content: [{ kind: "text", text: "First" }],
        providerMetadata: { test: { order: 1 } },
      });

      expect(messageEvents[1]).toMatchObject({
        kind: "message",
        role: "assistant",
        content: [{ kind: "text", text: "Second" }],
        providerMetadata: { test: { order: 2 } },
      });
    });

    it("should use metadata from end event (last-wins)", async () => {
      const mockModel: LanguageModelV3 = {
        provider: "test",
        modelId: "test-model",
        doStream: vi.fn().mockResolvedValue({
          stream: new ReadableStream({
            start(controller) {
              const parts: LanguageModelV3StreamPart[] = [
                {
                  type: "text-start",
                  id: "text-1",
                  providerMetadata: { test: { version: "start" } },
                },
                {
                  type: "text-delta",
                  id: "text-1",
                  delta: "Test",
                  providerMetadata: { test: { version: "delta" } },
                },
                {
                  type: "text-end",
                  id: "text-1",
                  providerMetadata: { test: { version: "end" } },
                },
                {
                  type: "finish",
                  finishReason: { unified: "stop", raw: "stop" },
                  usage: {
                    inputTokens: { total: 5, noCache: 5, cacheRead: undefined, cacheWrite: undefined },
                    outputTokens: { total: 10, text: 10, reasoning: undefined },
                  },
                  providerMetadata: undefined,
                },
              ];

              for (const part of parts) {
                controller.enqueue(part);
              }
              controller.close();
            },
          }),
        }),
      } as any;

      const model = new AISDKLanguageModel(mockModel);

      const events = [];
      for await (const event of model.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Hi" }],
          },
        ],
        settings: {},
      })) {
        events.push(event);
      }

      // Check complete Message has metadata from end event
      const messageEvent = events.find((e) => e.kind === "message");
      expect(messageEvent).toMatchObject({
        providerMetadata: { test: { version: "end" } }, // From end event, not start/delta
      });
    });

    it("should pass through tool-call events unchanged", async () => {
      const mockModel: LanguageModelV3 = {
        provider: "test",
        modelId: "test-model",
        doStream: vi.fn().mockResolvedValue({
          stream: new ReadableStream({
            start(controller) {
              const parts: LanguageModelV3StreamPart[] = [
                {
                  type: "tool-call",
                  toolCallId: "call-123",
                  toolName: "calculator",
                  input: '{"expression":"2+2"}',
                  providerMetadata: undefined,
                },
                {
                  type: "finish",
                  finishReason: { unified: "tool-calls", raw: "tool_calls" },
                  usage: {
                    inputTokens: { total: 5, noCache: 5, cacheRead: undefined, cacheWrite: undefined },
                    outputTokens: { total: 10, text: 10, reasoning: undefined },
                  },
                  providerMetadata: undefined,
                },
              ];

              for (const part of parts) {
                controller.enqueue(part);
              }
              controller.close();
            },
          }),
        }),
      } as any;

      const model = new AISDKLanguageModel(mockModel);

      const events = [];
      for await (const event of model.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Calculate 2+2" }],
          },
        ],
        settings: {},
      })) {
        events.push(event);
      }

      // Should have tool-call and finish
      expect(events).toHaveLength(2);

      expect(events[0]).toMatchObject({
        kind: "tool.call",
        callId: "call-123",
        toolId: "calculator",
        state: IN_PROGRESS,
        arguments: '{"expression":"2+2"}',
      });

      expect(events[1]).toMatchObject({ kind: "finish" });
    });
  });
});
