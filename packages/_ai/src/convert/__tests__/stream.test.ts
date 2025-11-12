import { describe, it, expect } from "vitest";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";

import { STREAM_PART, convertStream } from "../stream";

describe("STREAM_PART codec", () => {
  describe("decode - text events", () => {
    it("should decode text-start event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "text-start",
        id: "text-1",
        providerMetadata: { openai: { data: "value" } },
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "text-start",
        id: "text-1",
        providerMetadata: { openai: { data: "value" } },
      });
    });

    it("should decode text-delta event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "text-delta",
        id: "text-1",
        delta: "Hello",
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "text-delta",
        id: "text-1",
        text: "Hello",
        providerMetadata: undefined,
      });
    });

    it("should decode text-end event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "text-end",
        id: "text-1",
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "text-end",
        id: "text-1",
        providerMetadata: undefined,
      });
    });
  });

  describe("decode - reasoning events", () => {
    it("should decode reasoning-start event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "reasoning-start",
        id: "reason-1",
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "reasoning-start",
        id: "reason-1",
        providerMetadata: undefined,
      });
    });

    it("should decode reasoning-delta event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "reasoning-delta",
        id: "reason-1",
        delta: "thinking...",
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "reasoning-delta",
        id: "reason-1",
        text: "thinking...",
        providerMetadata: undefined,
      });
    });

    it("should decode reasoning-end event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "reasoning-end",
        id: "reason-1",
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "reasoning-end",
        id: "reason-1",
        providerMetadata: undefined,
      });
    });
  });

  describe("decode - tool events", () => {
    it("should decode tool-input-start event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "tool-input-start",
        id: "tool-1",
        toolName: "calculator",
        title: "Calculate",
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "tool-input-start",
        id: "tool-1",
        toolName: "calculator",
        title: "Calculate",
        providerMetadata: undefined,
      });
    });

    it("should decode tool-input-delta event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "tool-input-delta",
        id: "tool-1",
        delta: "partial input",
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "tool-input-delta",
        id: "tool-1",
        delta: "partial input",
        providerMetadata: undefined,
      });
    });

    it("should decode tool-input-end event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "tool-input-end",
        id: "tool-1",
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "tool-input-end",
        id: "tool-1",
        providerMetadata: undefined,
      });
    });

    it("should decode tool-call event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "tool-call",
        toolCallId: "call-123",
        toolName: "get_weather",
        input: '{"city":"SF"}',
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "tool-call",
        id: "call-123",
        toolName: "get_weather",
        arguments: '{"city":"SF"}',
        providerMetadata: undefined,
      });
    });

    it("should decode tool-result event (success)", () => {
      const part: LanguageModelV3StreamPart = {
        type: "tool-result",
        toolCallId: "call-123",
        toolName: "get_weather",
        result: { temperature: 72 },
        isError: false,
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "tool-result",
        callId: "call-123",
        toolId: "get_weather",
        state: "completed",
        result: { temperature: 72 },
        error: null,
        providerMetadata: undefined,
      });
    });

    it("should decode tool-result event (error)", () => {
      const part: LanguageModelV3StreamPart = {
        type: "tool-result",
        toolCallId: "call-123",
        toolName: "get_weather",
        result: "Network error",
        isError: true,
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "tool-result",
        callId: "call-123",
        toolId: "get_weather",
        state: "failed",
        result: "Network error",
        error: "Network error",
        providerMetadata: undefined,
      });
    });
  });

  describe("decode - stream control events", () => {
    it("should decode stream-start event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "stream-start",
        warnings: [
          {
            type: "unsupported-setting",
            setting: "topK",
          },
        ],
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "stream-start",
        warnings: [
          {
            type: "unsupported-setting",
            setting: "topK",
            details: undefined,
          },
        ],
      });
    });

    it("should decode finish event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "finish",
        finishReason: "stop",
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        },
        providerMetadata: undefined,
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "finish",
        finishReason: "stop",
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
          reasoningTokens: undefined,
          cachedInputTokens: undefined,
        },
        providerMetadata: undefined,
      });
    });

    it("should decode error event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "error",
        error: "Connection failed",
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "error",
        error: "Connection failed",
      });
    });

    it("should decode raw event", () => {
      const part: LanguageModelV3StreamPart = {
        type: "raw",
        rawValue: { custom: "data" },
      };

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "raw",
        rawValue: { custom: "data" },
      });
    });

    it("should return null for response-metadata", () => {
      const part = {
        type: "response-metadata",
      } as LanguageModelV3StreamPart;

      const result = STREAM_PART.decode(part);

      expect(result).toBeNull();
    });
  });

  describe("decode - file and source events", () => {
    it("should decode file event as raw", () => {
      const part = {
        type: "file",
        id: "file-1",
        filename: "test.txt",
        mediaType: "text/plain" as const,
        data: "base64data",
      } as LanguageModelV3StreamPart;

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "raw",
        rawValue: part,
      });
    });

    it("should decode source event as raw", () => {
      const part = {
        type: "source",
        sourceType: "url",
        id: "source-1",
        url: "https://example.com",
      } as LanguageModelV3StreamPart;

      const result = STREAM_PART.decode(part);

      expect(result).toEqual({
        kind: "raw",
        rawValue: part,
      });
    });
  });

  describe("encode", () => {
    it("should throw unimplemented error", () => {
      expect(() => STREAM_PART.encode(null)).toThrow("codec:unimplemented");
    });
  });
});

describe("convertStream", () => {
  it("should convert stream to async iterable", async () => {
    const parts: LanguageModelV3StreamPart[] = [
      { type: "text-start", id: "text-1", providerMetadata: undefined },
      {
        type: "text-delta",
        id: "text-1",
        delta: "Hello",
        providerMetadata: undefined,
      },
      { type: "text-end", id: "text-1", providerMetadata: undefined },
      {
        type: "finish",
        finishReason: "stop",
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
        providerMetadata: undefined,
      },
    ];

    const stream = new ReadableStream({
      start(controller) {
        for (const part of parts) {
          controller.enqueue(part);
        }
        controller.close();
      },
    });

    const events = [];
    for await (const event of convertStream(stream)) {
      events.push(event);
    }

    expect(events).toHaveLength(4);
    expect(events[0]).toMatchObject({ kind: "text-start" });
    expect(events[1]).toMatchObject({ kind: "text-delta", text: "Hello" });
    expect(events[2]).toMatchObject({ kind: "text-end" });
    expect(events[3]).toMatchObject({ kind: "finish", finishReason: "stop" });
  });

  it("should filter out null events", async () => {
    const parts: LanguageModelV3StreamPart[] = [
      {
        type: "text-delta",
        id: "text-1",
        delta: "Hello",
        providerMetadata: undefined,
      },
      {
        type: "response-metadata",
      }, // This should be filtered out
      {
        type: "finish",
        finishReason: "stop",
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
        providerMetadata: undefined,
      },
    ];

    const stream = new ReadableStream({
      start(controller) {
        for (const part of parts) {
          controller.enqueue(part);
        }
        controller.close();
      },
    });

    const events = [];
    for await (const event of convertStream(stream)) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ kind: "text-delta" });
    expect(events[1]).toMatchObject({ kind: "finish" });
  });

  it("should handle empty stream", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const events = [];
    for await (const event of convertStream(stream)) {
      events.push(event);
    }

    expect(events).toHaveLength(0);
  });
});
