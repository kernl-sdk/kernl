import { describe, it, expect } from "vitest";
import type { LanguageModelV3Message } from "@ai-sdk/provider";

import { MESSAGE } from "../message";

describe("MESSAGE codec", () => {
  describe("encode - system messages", () => {
    it("should encode system message with single text part", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "system",
        id: "msg-1",
        content: [{ kind: "text", text: "You are a helpful assistant." }],
      });

      expect(result).toEqual({
        role: "system",
        content: "You are a helpful assistant.",
        providerOptions: undefined,
      });
    });

    it("should encode system message with multiple text parts", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "system",
        id: "msg-1",
        content: [
          { kind: "text", text: "You are helpful." },
          { kind: "text", text: "You are concise." },
        ],
      });

      expect(result).toEqual({
        role: "system",
        content: "You are helpful.\nYou are concise.",
        providerOptions: undefined,
      });
    });

    it("should filter out non-text parts from system messages", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "system",
        id: "msg-1",
        content: [
          { kind: "text", text: "System prompt" },
          { kind: "file", data: "base64data", mimeType: "image/png" },
        ],
      });

      expect(result).toEqual({
        role: "system",
        content: "System prompt",
        providerOptions: undefined,
      });
    });

    it("should include providerMetadata when present", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "system",
        id: "msg-1",
        content: [{ kind: "text", text: "System" }],
        providerMetadata: { openai: { custom: "metadata" } },
      });

      expect(result).toEqual({
        role: "system",
        content: "System",
        providerOptions: { openai: { custom: "metadata" } },
      });
    });
  });

  describe("encode - user messages", () => {
    it("should encode user message with text part", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "user",
        id: "msg-1",
        content: [{ kind: "text", text: "Hello!" }],
      });

      expect(result).toEqual({
        role: "user",
        content: [
          {
            type: "text",
            text: "Hello!",
            providerOptions: undefined,
          },
        ],
        providerOptions: undefined,
      });
    });

    it("should encode user message with file part", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "user",
        id: "msg-1",
        content: [
          {
            kind: "file",
            data: "base64imagedata",
            mimeType: "image/png",
            filename: "screenshot.png",
          },
        ],
      });

      expect(result).toEqual({
        role: "user",
        content: [
          {
            type: "file",
            filename: "screenshot.png",
            data: "base64imagedata",
            mediaType: "image/png",
            providerOptions: undefined,
          },
        ],
        providerOptions: undefined,
      });
    });

    it("should encode user message with mixed text and file parts", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "user",
        id: "msg-1",
        content: [
          { kind: "text", text: "Look at this:" },
          {
            kind: "file",
            data: "base64data",
            mimeType: "image/jpeg" as const,
          },
        ],
      });

      expect(result.role).toBe("user");
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        type: "text",
        text: "Look at this:",
        providerOptions: undefined,
      });
      expect(result.content[1]).toEqual({
        type: "file",
        filename: undefined,
        data: "base64data",
        mediaType: "image/jpeg",
        providerOptions: undefined,
      });
    });
  });

  describe("encode - assistant messages", () => {
    it("should encode assistant message with text part", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "assistant",
        id: "msg-1",
        content: [{ kind: "text", text: "I can help with that." }],
      });

      expect(result).toEqual({
        role: "assistant",
        content: [
          {
            type: "text",
            text: "I can help with that.",
            providerOptions: undefined,
          },
        ],
        providerOptions: undefined,
      });
    });

    it("should encode assistant message with file part", () => {
      const result = MESSAGE.encode({
        kind: "message",
        role: "assistant",
        id: "msg-1",
        content: [
          {
            kind: "file",
            data: "chartdata",
            mimeType: "image/svg+xml" as const,
          },
        ],
      });

      expect(result).toEqual({
        role: "assistant",
        content: [
          {
            type: "file",
            filename: undefined,
            data: "chartdata",
            mediaType: "image/svg+xml",
            providerOptions: undefined,
          },
        ],
        providerOptions: undefined,
      });
    });
  });

  describe("encode - tool-call items", () => {
    it("should encode tool-call item", () => {
      const result = MESSAGE.encode({
        kind: "tool.call",
        callId: "call-123",
        toolId: "get_weather",
        state: "completed",
        arguments: JSON.stringify({ city: "SF" }),
      });

      expect(result).toEqual({
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: "call-123",
            toolId: "get_weather",
            input: { city: "SF" },
            providerOptions: undefined,
          },
        ],
      });
    });

    it("should include providerMetadata for tool-call", () => {
      const result = MESSAGE.encode({
        kind: "tool.call",
        callId: "call-123",
        toolId: "get_weather",
        state: "completed",
        arguments: JSON.stringify({ city: "SF" }),
        providerMetadata: { anthropic: { executionTime: 150 } },
      });

      expect(result.content[0]).toMatchObject({
        type: "tool-call",
        providerOptions: { anthropic: { executionTime: 150 } },
      });
    });
  });

  describe("encode - tool-result items", () => {
    it("should encode tool-result item", () => {
      const result = MESSAGE.encode({
        kind: "tool.result",
        callId: "call-123",
        toolId: "get_weather",
        state: "completed",
        result: { temp: 72, conditions: "sunny" },
        error: null,
      });

      expect(result).toEqual({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "call-123",
            toolId: "get_weather",
            output: {
              type: "json",
              value: { temp: 72, conditions: "sunny" },
            },
            providerOptions: undefined,
          },
        ],
      });
    });

    it("should encode tool-result item with error", () => {
      const result = MESSAGE.encode({
        kind: "tool.result",
        callId: "call-123",
        toolId: "get_weather",
        state: "failed",
        result: null,
        error: "Network timeout",
      });

      expect(result).toEqual({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "call-123",
            toolId: "get_weather",
            output: {
              type: "error-text",
              value: "Network timeout",
            },
            providerOptions: undefined,
          },
        ],
      });
    });
  });

  describe("encode - reasoning items", () => {
    it("should encode reasoning item with text", () => {
      const result = MESSAGE.encode({
        kind: "reasoning",
        text: "Let me think about this step by step...",
      });

      expect(result).toEqual({
        role: "assistant",
        content: [
          {
            type: "reasoning",
            text: "Let me think about this step by step...",
            providerOptions: undefined,
          },
        ],
      });
    });

    it("should encode reasoning item without text field", () => {
      const result = MESSAGE.encode({
        kind: "reasoning",
      } as any);

      expect(result).toEqual({
        role: "assistant",
        content: [
          {
            type: "reasoning",
            text: "",
            providerOptions: undefined,
          },
        ],
      });
    });
  });

  describe("encode - unsupported items", () => {
    it("should throw error for unsupported item kind", () => {
      expect(() =>
        MESSAGE.encode({
          kind: "unknown-kind",
        } as any),
      ).toThrow("Unsupported LanguageModelItem kind");
    });
  });

  describe("decode", () => {
    it("should throw unimplemented error", () => {
      expect(() => MESSAGE.decode({} as LanguageModelV3Message)).toThrow(
        "codec:unimplemented",
      );
    });
  });
});
