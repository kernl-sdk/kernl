import { describe, it, expect } from "vitest";
import type { UIMessageChunk } from "ai";
import type { LanguageModelStreamEvent } from "@kernl-sdk/protocol";
import { COMPLETED, FAILED, IN_PROGRESS } from "@kernl-sdk/protocol";

import { STREAM_UI_PART, toUIMessageStream } from "../ui-stream";

describe("STREAM_UI_PART codec", () => {
  describe("encode - text events", () => {
    it("should encode text-start event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "text-start",
        id: "text-1",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "text-start",
        id: "text-1",
      });
    });

    it("should encode text-delta event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "text-delta",
        id: "text-1",
        text: "Hello world",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "text-delta",
        id: "text-1",
        delta: "Hello world",
      });
    });

    it("should encode text-end event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "text-end",
        id: "text-1",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "text-end",
        id: "text-1",
      });
    });
  });

  describe("encode - reasoning events", () => {
    it("should encode reasoning-start event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "reasoning-start",
        id: "reason-1",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "reasoning-start",
        id: "reason-1",
      });
    });

    it("should encode reasoning-delta event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "reasoning-delta",
        id: "reason-1",
        text: "thinking step by step",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "reasoning-delta",
        id: "reason-1",
        delta: "thinking step by step",
      });
    });

    it("should encode reasoning-end event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "reasoning-end",
        id: "reason-1",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "reasoning-end",
        id: "reason-1",
      });
    });
  });

  describe("encode - tool input events", () => {
    it("should encode tool-input-start event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-input-start",
        id: "tool-1",
        toolName: "calculator",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-input-start",
        toolCallId: "tool-1",
        toolName: "calculator",
      });
    });

    it("should encode tool-input-start event with title", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-input-start",
        id: "tool-1",
        toolName: "calculator",
        title: "Calculate sum",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-input-start",
        toolCallId: "tool-1",
        toolName: "calculator",
        title: "Calculate sum",
      });
    });

    it("should encode tool-input-delta event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-input-delta",
        id: "tool-1",
        delta: '{"a": 1',
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-input-delta",
        toolCallId: "tool-1",
        inputTextDelta: '{"a": 1',
      });
    });

    it("should return null for tool-input-end event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-input-end",
        id: "tool-1",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toBeNull();
    });
  });

  describe("encode - tool call and result events", () => {
    it("should encode tool-call as tool-input-available", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-call",
        callId: "call-123",
        toolId: "calculator",
        state: COMPLETED,
        arguments: '{"a": 5, "b": 3}',
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-input-available",
        toolCallId: "call-123",
        toolName: "calculator",
        input: { a: 5, b: 3 },
      });
    });

    it("should handle tool-call with empty arguments string", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-call",
        callId: "call-empty",
        toolId: "list_issues",
        state: IN_PROGRESS,
        arguments: "{}",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-input-available",
        toolCallId: "call-empty",
        toolName: "list_issues",
        input: {},
      });
    });

    it("should encode successful tool-result as tool-output-available", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-result",
        callId: "call-123",
        toolId: "calculator",
        state: COMPLETED,
        result: { sum: 8 },
        error: null,
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-output-available",
        toolCallId: "call-123",
        output: { sum: 8 },
      });
    });

    it("should encode failed tool-result as tool-output-error", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-result",
        callId: "call-123",
        toolId: "calculator",
        state: FAILED,
        result: null,
        error: "Division by zero",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-output-error",
        toolCallId: "call-123",
        errorText: "Division by zero",
      });
    });

    it("should handle failed tool-result with null error", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-result",
        callId: "call-123",
        toolId: "calculator",
        state: FAILED,
        result: null,
        error: null,
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-output-error",
        toolCallId: "call-123",
        errorText: "Unknown error",
      });
    });
  });

  describe("encode - stream control events", () => {
    it("should encode stream-start as start", () => {
      const event: LanguageModelStreamEvent = {
        kind: "stream-start",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "start",
      });
    });

    it("should encode finish event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "finish",
        finishReason: "stop",
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        },
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "finish",
      });
    });

    it("should encode error event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "error",
        error: new Error("Something went wrong"),
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "error",
        errorText: "Error: Something went wrong",
      });
    });

    it("should encode abort event", () => {
      const event: LanguageModelStreamEvent = {
        kind: "abort",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "abort",
      });
    });
  });

  describe("encode - events that return null", () => {
    it("should return null for message items", () => {
      const event: LanguageModelStreamEvent = {
        kind: "message",
        role: "assistant",
        id: "msg-1",
        content: [{ kind: "text", text: "Hello" }],
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toBeNull();
    });

    it("should return null for reasoning items", () => {
      const event: LanguageModelStreamEvent = {
        kind: "reasoning",
        text: "I think...",
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toBeNull();
    });

    it("should return null for raw events", () => {
      const event: LanguageModelStreamEvent = {
        kind: "raw",
        rawValue: { custom: "data" },
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toBeNull();
    });
  });

  describe("encode - providerMetadata omission", () => {
    it("should omit providerMetadata from text events", () => {
      const event: LanguageModelStreamEvent = {
        kind: "text-delta",
        id: "text-1",
        text: "Hello",
        providerMetadata: {
          anthropic: { some: "data" },
        },
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "text-delta",
        id: "text-1",
        delta: "Hello",
      });
      expect(result).not.toHaveProperty("providerMetadata");
    });

    it("should omit providerMetadata from tool calls", () => {
      const event: LanguageModelStreamEvent = {
        kind: "tool-call",
        callId: "call-123",
        toolId: "calculator",
        state: COMPLETED,
        arguments: '{"x": 1}',
        providerMetadata: {
          openai: { some: "data" },
        },
      };

      const result = STREAM_UI_PART.encode(event);

      expect(result).toEqual({
        type: "tool-input-available",
        toolCallId: "call-123",
        toolName: "calculator",
        input: { x: 1 },
      });
      expect(result).not.toHaveProperty("providerMetadata");
    });
  });

  describe("decode", () => {
    it("should throw not implemented error", () => {
      const chunk: UIMessageChunk = {
        type: "text-delta",
        id: "text-1",
        delta: "Hello",
      };

      expect(() => STREAM_UI_PART.decode(chunk)).toThrow(
        "STREAM_UI_PART.decode: Not yet implemented",
      );
    });
  });
});

describe("toUIMessageStream", () => {
  it("should convert async iterable to readable stream", async () => {
    const events: LanguageModelStreamEvent[] = [
      { kind: "stream-start" },
      { kind: "text-start", id: "text-1" },
      { kind: "text-delta", id: "text-1", text: "Hello" },
      { kind: "text-delta", id: "text-1", text: " world" },
      { kind: "text-end", id: "text-1" },
      { kind: "finish", finishReason: "stop", usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 } },
    ];

    async function* generateEvents() {
      for (const event of events) {
        yield event;
      }
    }

    const stream = toUIMessageStream(generateEvents());
    const reader = stream.getReader();

    const chunks: UIMessageChunk[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // The AI SDK adds messageId automatically to start events
    expect(chunks).toHaveLength(6);
    expect(chunks[0]).toMatchObject({ type: "start" });
    expect(chunks[0]).toHaveProperty("messageId");
    expect(chunks[1]).toEqual({ type: "text-start", id: "text-1" });
    expect(chunks[2]).toEqual({ type: "text-delta", id: "text-1", delta: "Hello" });
    expect(chunks[3]).toEqual({ type: "text-delta", id: "text-1", delta: " world" });
    expect(chunks[4]).toEqual({ type: "text-end", id: "text-1" });
    expect(chunks[5]).toEqual({ type: "finish" });
  });

  it("should filter out null events", async () => {
    const events: LanguageModelStreamEvent[] = [
      { kind: "text-start", id: "text-1" },
      { kind: "text-delta", id: "text-1", text: "Hello" },
      { kind: "tool-input-end", id: "tool-1" }, // Should be filtered (returns null)
      { kind: "raw", rawValue: {} }, // Should be filtered (returns null)
      { kind: "text-end", id: "text-1" },
    ];

    async function* generateEvents() {
      for (const event of events) {
        yield event;
      }
    }

    const stream = toUIMessageStream(generateEvents());
    const reader = stream.getReader();

    const chunks: UIMessageChunk[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    expect(chunks).toEqual([
      { type: "text-start", id: "text-1" },
      { type: "text-delta", id: "text-1", delta: "Hello" },
      { type: "text-end", id: "text-1" },
    ]);
  });

  it("should handle tool calls and results", async () => {
    const events: LanguageModelStreamEvent[] = [
      { kind: "tool-input-start", id: "tool-1", toolName: "calculator" },
      { kind: "tool-input-delta", id: "tool-1", delta: '{"x":' },
      { kind: "tool-input-delta", id: "tool-1", delta: '5}' },
      { kind: "tool-call", callId: "tool-1", toolId: "calculator", state: COMPLETED, arguments: '{"x":5}' },
      { kind: "tool-result", callId: "tool-1", toolId: "calculator", state: COMPLETED, result: 25, error: null },
    ];

    async function* generateEvents() {
      for (const event of events) {
        yield event;
      }
    }

    const stream = toUIMessageStream(generateEvents());
    const reader = stream.getReader();

    const chunks: UIMessageChunk[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    expect(chunks).toEqual([
      { type: "tool-input-start", toolCallId: "tool-1", toolName: "calculator" },
      { type: "tool-input-delta", toolCallId: "tool-1", inputTextDelta: '{"x":' },
      { type: "tool-input-delta", toolCallId: "tool-1", inputTextDelta: '5}' },
      { type: "tool-input-available", toolCallId: "tool-1", toolName: "calculator", input: { x: 5 } },
      { type: "tool-output-available", toolCallId: "tool-1", output: 25 },
    ]);
  });

  it("should handle errors in stream", async () => {
    const events: LanguageModelStreamEvent[] = [
      { kind: "text-start", id: "text-1" },
      { kind: "error", error: new Error("Network timeout") },
    ];

    async function* generateEvents() {
      for (const event of events) {
        yield event;
      }
    }

    const stream = toUIMessageStream(generateEvents());
    const reader = stream.getReader();

    const chunks: UIMessageChunk[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    expect(chunks).toEqual([
      { type: "text-start", id: "text-1" },
      { type: "error", errorText: "Network timeout" },
    ]);
  });
});
