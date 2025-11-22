import { describe, it, expect } from "vitest";
import { IN_PROGRESS, COMPLETED, FAILED } from "@kernl-sdk/protocol";
import type { LanguageModelItem } from "@kernl-sdk/protocol";

import { UIMessageCodec, historyToUIMessages } from "../ui-message";

describe("UIMessageCodec", () => {
  // ----------------------------
  // Text parts
  // ----------------------------
  describe("decode - text parts", () => {
    it("should convert a user message with a text part", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Hello, world!" }],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "message",
        id: "1",
        role: "user",
        content: [
          {
            kind: "text",
            text: "Hello, world!",
          },
        ],
      });
    });

    it("should convert an assistant message with a text part", async () => {
      const result = await UIMessageCodec.decode({
        id: "2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi there!" }],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "message",
        id: "2",
        role: "assistant",
        content: [
          {
            kind: "text",
            text: "Hi there!",
          },
        ],
      });
    });

    it("should convert a system message with a text part", async () => {
      const result = await UIMessageCodec.decode({
        id: "3",
        role: "system",
        parts: [{ type: "text", text: "System prompt" }],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "message",
        id: "3",
        role: "system",
        content: [
          {
            kind: "text",
            text: "System prompt",
          },
        ],
      });
    });

    it("should preserve providerMetadata", async () => {
      const result = await UIMessageCodec.decode({
        id: "4",
        role: "user",
        parts: [
          {
            type: "text",
            text: "Test",
            providerMetadata: { anthropic: { custom: "data" } },
          },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content[0]).toMatchObject({
          kind: "text",
          text: "Test",
          providerMetadata: { anthropic: { custom: "data" } },
        });
      }
    });
  });

  // ----------------------------
  // File parts - Data URLs
  // ----------------------------

  describe("decode - file parts with Data URLs", () => {
    it("should convert a file part with base64 Data URL", async () => {
      const base64Data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const dataUrl = `data:image/png;base64,${base64Data}`;

      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "image/png",
            filename: "test.png",
            url: dataUrl,
          },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content[0]).toMatchObject({
          kind: "file",
          mimeType: "image/png",
          filename: "test.png",
          data: base64Data,
        });
        expect(message.content[0]).not.toHaveProperty("uri");
      }
    });

    it("should handle various image MIME types", async () => {
      const mimeTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      for (const mimeType of mimeTypes) {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "user",
          parts: [
            {
              type: "file",
              mediaType: mimeType,
              url: `data:${mimeType};base64,abc123`,
            },
          ],
        });

        expect(result).toHaveLength(1);
        const message = result[0];
        if (message.kind === "message") {
          expect(message.content[0]).toMatchObject({
            kind: "file",
            mimeType,
            data: "abc123",
          });
        }
      }
    });

    it("should handle PDF and document types", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "application/pdf",
            filename: "document.pdf",
            url: "data:application/pdf;base64,JVBERi0xLjQ=",
          },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content[0]).toMatchObject({
          kind: "file",
          mimeType: "application/pdf",
          filename: "document.pdf",
          data: "JVBERi0xLjQ=",
        });
      }
    });
  });

  // ----------------------------
  // File parts - Regular URLs
  // ----------------------------

  describe("decode - file parts with URLs", () => {
    it("should convert a file part with http URL to uri field", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "image/png",
            filename: "photo.png",
            url: "http://example.com/photo.png",
          },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content[0]).toMatchObject({
          kind: "file",
          mimeType: "image/png",
          filename: "photo.png",
          uri: "http://example.com/photo.png",
        });
        expect(message.content[0]).not.toHaveProperty("data");
      }
    });

    it("should convert a file part with https URL to uri field", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "application/pdf",
            url: "https://example.com/document.pdf",
          },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content[0]).toMatchObject({
          kind: "file",
          mimeType: "application/pdf",
          uri: "https://example.com/document.pdf",
        });
      }
    });

    it("should handle file URLs without filename", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "text/plain",
            url: "https://example.com/file",
          },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content[0]).toMatchObject({
          kind: "file",
          mimeType: "text/plain",
          uri: "https://example.com/file",
        });
        const filePart = message.content[0];
        if (filePart.kind === "file") {
          expect(filePart.filename).toBeUndefined();
        }
      }
    });

    it("should convert non-base64 Data URL to uri field", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "text/plain",
            url: "data:text/plain,Hello%20World",
          },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content[0]).toMatchObject({
          kind: "file",
          mimeType: "text/plain",
          uri: "data:text/plain,Hello%20World",
        });
      }
    });
  });

  // ----------------------------
  // Multiple parts
  // ----------------------------

  describe("decode - multiple parts", () => {
    it("should convert a message with multiple text parts", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "First part" },
          { type: "text", text: "Second part" },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content).toHaveLength(2);
        expect(message.content[0]).toMatchObject({
          kind: "text",
          text: "First part",
        });
        expect(message.content[1]).toMatchObject({
          kind: "text",
          text: "Second part",
        });
      }
    });

    it("should convert a message with mixed text and file parts", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "Check this image:" },
          {
            type: "file",
            mediaType: "image/png",
            url: "data:image/png;base64,abc123",
          },
          { type: "text", text: "What do you see?" },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content).toHaveLength(3);
        expect(message.content[0]).toMatchObject({
          kind: "text",
          text: "Check this image:",
        });
        expect(message.content[1]).toMatchObject({
          kind: "file",
          mimeType: "image/png",
          data: "abc123",
        });
        expect(message.content[2]).toMatchObject({
          kind: "text",
          text: "What do you see?",
        });
      }
    });

    it("should convert a message with multiple files", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "image/png",
            url: "data:image/png;base64,image1",
          },
          {
            type: "file",
            mediaType: "image/jpeg",
            url: "https://example.com/image2.jpg",
          },
        ],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.content).toHaveLength(2);
        expect(message.content[0]).toMatchObject({
          kind: "file",
          data: "image1",
        });
        expect(message.content[1]).toMatchObject({
          kind: "file",
          uri: "https://example.com/image2.jpg",
        });
      }
    });
  });

  // ----------------------------
  // Tool parts
  // ----------------------------

  describe("decode - tool parts", () => {
    describe("static tool invocations (tool-*)", () => {
      it("should convert input-available state to ToolCall with IN_PROGRESS", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-calculator",
              state: "input-available",
              toolCallId: "call-1",
              input: { operation: "add", numbers: [1, 2] },
            },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "tool-call",
          callId: "call-1",
          toolId: "calculator",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ operation: "add", numbers: [1, 2] }),
        });
      });

      it("should convert output-available state to ToolResult with COMPLETED", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-calculator",
              state: "output-available",
              toolCallId: "call-1",
              input: { operation: "add", numbers: [1, 2] },
              output: { result: 3 },
            },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "tool-result",
          callId: "call-1",
          toolId: "calculator",
          state: COMPLETED,
          result: { result: 3 },
          error: null,
        });
      });

      it("should convert output-error state to ToolResult with FAILED", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-calculator",
              state: "output-error",
              toolCallId: "call-1",
              input: { operation: "divide", numbers: [1, 0] },
              errorText: "Division by zero",
            },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "tool-result",
          callId: "call-1",
          toolId: "calculator",
          state: FAILED,
          result: null,
          error: "Division by zero",
        });
      });

      it("should skip input-streaming state", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-calculator",
              state: "input-streaming",
              toolCallId: "call-1",
              input: { operation: "add" },
            } as any,
            { type: "text", text: "After streaming" },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "message",
          content: [{ kind: "text", text: "After streaming" }],
        });
      });

      it("should preserve callProviderMetadata on tool calls", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-weather",
              state: "input-available",
              toolCallId: "call-1",
              input: { city: "Tokyo" },
              callProviderMetadata: {
                anthropic: { cacheControl: { type: "ephemeral" } },
              },
            },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "tool-call",
          callId: "call-1",
          toolId: "weather",
          providerMetadata: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        });
      });

      it("should preserve callProviderMetadata on tool results", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-weather",
              state: "output-available",
              toolCallId: "call-1",
              input: { city: "Tokyo" },
              output: { temperature: 20 },
              callProviderMetadata: {
                anthropic: { signature: "12345" },
              },
            },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "tool-result",
          callId: "call-1",
          toolId: "weather",
          providerMetadata: {
            anthropic: { signature: "12345" },
          },
        });
      });
    });

    describe("dynamic tool invocations", () => {
      it("should convert input-available state to ToolCall", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "dynamic-tool",
              toolName: "screenshot",
              state: "input-available",
              toolCallId: "call-1",
              input: { region: "full" },
            },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "tool-call",
          callId: "call-1",
          toolId: "screenshot",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ region: "full" }),
        });
      });

      it("should convert output-available state to ToolResult", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "dynamic-tool",
              toolName: "screenshot",
              state: "output-available",
              toolCallId: "call-1",
              input: { region: "full" },
              output: "base64imagedata",
            },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "tool-result",
          callId: "call-1",
          toolId: "screenshot",
          state: COMPLETED,
          result: "base64imagedata",
          error: null,
        });
      });

      it("should convert output-error state to ToolResult", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "dynamic-tool",
              toolName: "screenshot",
              state: "output-error",
              toolCallId: "call-1",
              input: { region: "full" },
              errorText: "Screen capture failed",
            },
          ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          kind: "tool-result",
          callId: "call-1",
          toolId: "screenshot",
          state: FAILED,
          result: null,
          error: "Screen capture failed",
        });
      });
    });

    describe("multiple tool invocations", () => {
      it("should handle message with multiple tool calls", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            { type: "text", text: "Let me help with that" },
            {
              type: "tool-calculator",
              state: "input-available",
              toolCallId: "call-1",
              input: { operation: "add", numbers: [1, 2] },
            },
            {
              type: "tool-weather",
              state: "input-available",
              toolCallId: "call-2",
              input: { city: "Tokyo" },
            },
          ],
        });

        expect(result).toHaveLength(3);
        expect(result[0]).toMatchObject({
          kind: "message",
          content: [{ kind: "text", text: "Let me help with that" }],
        });
        expect(result[1]).toMatchObject({
          kind: "tool-call",
          callId: "call-1",
          toolId: "calculator",
        });
        expect(result[2]).toMatchObject({
          kind: "tool-call",
          callId: "call-2",
          toolId: "weather",
        });
      });

      it("should handle message with mixed tool calls and results", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-calculator",
              state: "output-available",
              toolCallId: "call-1",
              input: { operation: "add", numbers: [1, 2] },
              output: { result: 3 },
            },
            { type: "text", text: "The result is 3" },
            {
              type: "tool-weather",
              state: "input-available",
              toolCallId: "call-2",
              input: { city: "Tokyo" },
            },
          ],
        });

        // Message with text parts comes first (via unshift), then tools in order
        expect(result).toHaveLength(3);
        expect(result[0]).toMatchObject({
          kind: "message",
          content: [{ kind: "text", text: "The result is 3" }],
        });
        expect(result[1]).toMatchObject({
          kind: "tool-result",
          callId: "call-1",
        });
        expect(result[2]).toMatchObject({
          kind: "tool-call",
          callId: "call-2",
        });
      });

      it("should handle message with both static and dynamic tools", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-calculator",
              state: "input-available",
              toolCallId: "call-1",
              input: { operation: "add", numbers: [1, 2] },
            },
            {
              type: "dynamic-tool",
              toolName: "screenshot",
              state: "input-available",
              toolCallId: "call-2",
              input: { region: "full" },
            },
          ],
        });

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          kind: "tool-call",
          toolId: "calculator",
        });
        expect(result[1]).toMatchObject({
          kind: "tool-call",
          toolId: "screenshot",
        });
      });
    });

    describe("tool output types", () => {
      it("should handle string output", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-calculator",
              state: "output-available",
              toolCallId: "call-1",
              input: {},
              output: "result string",
            },
          ],
        });

        expect(result[0]).toMatchObject({
          kind: "tool-result",
          result: "result string",
        });
      });

      it("should handle number output", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-calculator",
              state: "output-available",
              toolCallId: "call-1",
              input: {},
              output: 42,
            },
          ],
        });

        expect(result[0]).toMatchObject({
          kind: "tool-result",
          result: 42,
        });
      });

      it("should handle object output", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-weather",
              state: "output-available",
              toolCallId: "call-1",
              input: {},
              output: {
                temperature: 20,
                condition: "sunny",
                humidity: 60,
              },
            },
          ],
        });

        expect(result[0]).toMatchObject({
          kind: "tool-result",
          result: {
            temperature: 20,
            condition: "sunny",
            humidity: 60,
          },
        });
      });

      it("should handle array output", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-search",
              state: "output-available",
              toolCallId: "call-1",
              input: {},
              output: ["result1", "result2", "result3"],
            },
          ],
        });

        expect(result[0]).toMatchObject({
          kind: "tool-result",
          result: ["result1", "result2", "result3"],
        });
      });

      it("should handle null output", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-test",
              state: "output-available",
              toolCallId: "call-1",
              input: {},
              output: null,
            },
          ],
        });

        expect(result[0]).toMatchObject({
          kind: "tool-result",
          result: null,
        });
      });

      it("should handle undefined output as empty object", async () => {
        const result = await UIMessageCodec.decode({
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-test",
              state: "input-available",
              toolCallId: "call-1",
              input: undefined,
            } as any,
          ],
        });

        expect(result[0]).toMatchObject({
          kind: "tool-call",
          arguments: "{}",
        });
      });
    });
  });

  // ----------------------------
  // Reasoning parts
  // ----------------------------

  describe("decode - reasoning parts", () => {
    it("should convert reasoning parts to separate reasoning items", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Before reasoning" },
          { type: "reasoning", text: "Let me think..." },
          { type: "text", text: "After reasoning" },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        kind: "message",
        content: [
          { kind: "text", text: "Before reasoning" },
          { kind: "text", text: "After reasoning" },
        ],
      });
      expect(result[1]).toMatchObject({
        kind: "reasoning",
        text: "Let me think...",
      });
    });

    it("should preserve providerMetadata on reasoning parts", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "reasoning",
            text: "Thinking...",
            providerMetadata: {
              anthropic: { signature: "12345" },
            },
          },
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "reasoning",
        text: "Thinking...",
        providerMetadata: {
          anthropic: { signature: "12345" },
        },
      });
    });

    it("should handle multiple reasoning parts", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "First thought" },
          { type: "reasoning", text: "Second thought" },
          { type: "text", text: "Final answer" },
        ],
      });

      // Message comes first (via unshift), then reasoning parts in order
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        kind: "message",
        content: [{ kind: "text", text: "Final answer" }],
      });
      expect(result[1]).toMatchObject({
        kind: "reasoning",
        text: "First thought",
      });
      expect(result[2]).toMatchObject({
        kind: "reasoning",
        text: "Second thought",
      });
    });
  });

  // ----------------------------
  // Parts that should be skipped
  // ----------------------------

  describe("decode - parts to skip", () => {
    it("should skip step-start parts", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "assistant",
        parts: [{ type: "step-start" }, { type: "text", text: "Step content" }],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "message",
        content: [{ kind: "text", text: "Step content" }],
      });
    });

    it("should skip source-url parts", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "source-url",
            sourceId: "1",
            url: "https://example.com",
            title: "Example",
          },
          { type: "text", text: "Main content" },
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "message",
        content: [{ kind: "text", text: "Main content" }],
      });
    });

    it("should skip source-document parts", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "source-document",
            sourceId: "1",
            mediaType: "text/plain",
            title: "Doc",
            filename: "doc.txt",
          },
          { type: "text", text: "Main content" },
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "message",
        content: [{ kind: "text", text: "Main content" }],
      });
    });
  });

  // ----------------------------
  // Metadata handling
  // ----------------------------

  describe("decode - metadata", () => {
    it("should preserve message metadata", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        metadata: { userId: "123", timestamp: 1234567890 },
        parts: [{ type: "text", text: "Hello" }],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.metadata).toEqual({
          userId: "123",
          timestamp: 1234567890,
        });
      }
    });

    it("should handle messages without metadata", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
      });

      expect(result).toHaveLength(1);
      const message = result[0];
      if (message.kind === "message") {
        expect(message.metadata).toBeUndefined();
      }
    });
  });

  // ----------------------------
  // Edge cases
  // ----------------------------

  describe("decode - edge cases", () => {
    it("should reject empty parts array via AI SDK validation", async () => {
      await expect(
        UIMessageCodec.decode({
          id: "1",
          role: "user",
          parts: [],
        }),
      ).rejects.toThrow("Message must contain at least one part");
    });

    it("should handle parts that are all skipped", async () => {
      const result = await UIMessageCodec.decode({
        id: "1",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Thinking..." },
          { type: "step-start" },
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "reasoning",
        text: "Thinking...",
      });
    });

    it("should reject unknown part type via AI SDK validation", async () => {
      await expect(
        UIMessageCodec.decode({
          id: "1",
          role: "user",
          parts: [{ type: "unknown-type" as any }],
        }),
      ).rejects.toThrow("Type validation failed");
    });
  });

  // ----------------------------
  // Validation tests
  // ----------------------------

  describe("decode - validation via AI SDK", () => {
    it("should validate and reject invalid role", async () => {
      await expect(
        UIMessageCodec.decode({
          id: "1",
          role: "invalid" as any,
          parts: [{ type: "text", text: "Hello" }],
        }),
      ).rejects.toThrow();
    });

    it("should validate and accept all valid roles", async () => {
      const roles: Array<"system" | "user" | "assistant"> = [
        "system",
        "user",
        "assistant",
      ];

      for (const role of roles) {
        const result = await UIMessageCodec.decode({
          id: "1",
          role,
          parts: [{ type: "text", text: "Hello" }],
        });

        expect(result).toHaveLength(1);
        const message = result[0];
        if (message.kind === "message") {
          expect(message.role).toBe(role);
        }
      }
    });
  });
});

describe("historyToUIMessages", () => {
  describe("basic message conversion", () => {
    it("should convert a simple user message", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [{ kind: "text", text: "Hello, AI!" }],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "Hello, AI!" }],
        },
      ]);
    });

    it("should convert a simple assistant message", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-2",
          role: "assistant",
          content: [{ kind: "text", text: "Hello, human!" }],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-2",
          role: "assistant",
          parts: [{ type: "text", text: "Hello, human!" }],
        },
      ]);
    });

    it("should convert a system message", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-3",
          role: "system",
          content: [{ kind: "text", text: "System instructions" }],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-3",
          role: "system",
          parts: [{ type: "text", text: "System instructions" }],
        },
      ]);
    });

    it("should handle multiple messages", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [{ kind: "text", text: "What's the weather?" }],
        },
        {
          kind: "message",
          id: "msg-2",
          role: "assistant",
          content: [{ kind: "text", text: "I'll check that for you." }],
        },
        {
          kind: "message",
          id: "msg-3",
          role: "user",
          content: [{ kind: "text", text: "Thanks!" }],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "What's the weather?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          parts: [{ type: "text", text: "I'll check that for you." }],
        },
        {
          id: "msg-3",
          role: "user",
          parts: [{ type: "text", text: "Thanks!" }],
        },
      ]);
    });
  });

  describe("file parts", () => {
    it("should convert file with base64 data URL", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [
            {
              kind: "file",
              mimeType: "image/jpeg",
              filename: "test.jpg",
              data: "dGVzdA==",
            },
          ],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [
            {
              type: "file",
              url: "data:image/jpeg;base64,dGVzdA==",
              mediaType: "image/jpeg",
              filename: "test.jpg",
            },
          ],
        },
      ]);
    });

    it("should convert file with URI", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [
            {
              kind: "file",
              mimeType: "image/png",
              filename: "photo.png",
              uri: "https://example.com/photo.png",
            },
          ],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [
            {
              type: "file",
              url: "https://example.com/photo.png",
              mediaType: "image/png",
              filename: "photo.png",
            },
          ],
        },
      ]);
    });

    it("should handle mixed text and file content", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [
            {
              kind: "file",
              mimeType: "image/jpeg",
              filename: "image.jpg",
              uri: "https://example.com/image.jpg",
            },
            { kind: "text", text: "Check this image" },
          ],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [
            {
              type: "file",
              url: "https://example.com/image.jpg",
              mediaType: "image/jpeg",
              filename: "image.jpg",
            },
            { type: "text", text: "Check this image" },
          ],
        },
      ]);
    });
  });

  describe("data parts", () => {
    it("should convert data parts", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [
            {
              kind: "data",
              data: { temperature: 72, humidity: 60 },
            },
          ],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "data-temperature", data: 72 },
            { type: "data-humidity", data: 60 },
          ],
        },
      ]);
    });

    it("should handle mixed data and text parts", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [
            { kind: "text", text: "Here's the data:" },
            {
              kind: "data",
              data: { count: 5 },
            },
          ],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Here's the data:" },
            { type: "data-count", data: 5 },
          ],
        },
      ]);
    });
  });

  describe("tool calls and results", () => {
    it("should convert tool call with successful result", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [{ kind: "text", text: "Let me calculate that." }],
        },
        {
          kind: "tool-call",
          callId: "call-1",
          toolId: "calculator",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ operation: "add", numbers: [1, 2] }),
        },
        {
          kind: "tool-result",
          callId: "call-1",
          toolId: "calculator",
          state: COMPLETED,
          result: 3,
          error: null,
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Let me calculate that." },
            {
              type: "tool-calculator",
              toolCallId: "call-1",
              toolName: "calculator",
              input: { operation: "add", numbers: [1, 2] },
              state: "output-available",
              output: 3,
            },
          ],
        },
      ]);
    });

    it("should convert tool call with error result", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [{ kind: "text", text: "Let me try that." }],
        },
        {
          kind: "tool-call",
          callId: "call-1",
          toolId: "calculator",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ operation: "divide", numbers: [1, 0] }),
        },
        {
          kind: "tool-result",
          callId: "call-1",
          toolId: "calculator",
          state: FAILED,
          result: null,
          error: "Division by zero",
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Let me try that." },
            {
              type: "tool-calculator",
              toolCallId: "call-1",
              toolName: "calculator",
              input: { operation: "divide", numbers: [1, 0] },
              state: "output-error",
              errorText: "Division by zero",
            },
          ],
        },
      ]);
    });

    it("should convert tool call without result (pending)", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [{ kind: "text", text: "Processing..." }],
        },
        {
          kind: "tool-call",
          callId: "call-1",
          toolId: "search",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ query: "weather" }),
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Processing..." },
            {
              type: "tool-search",
              toolCallId: "call-1",
              toolName: "search",
              input: { query: "weather" },
              state: "input-available",
            },
          ],
        },
      ]);
    });

    it("should handle multiple tool calls with results", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [{ kind: "text", text: "I'll use multiple tools." }],
        },
        {
          kind: "tool-call",
          callId: "call-1",
          toolId: "tool1",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ value: "value-1" }),
        },
        {
          kind: "tool-result",
          callId: "call-1",
          toolId: "tool1",
          state: COMPLETED,
          result: "result-1",
          error: null,
        },
        {
          kind: "tool-call",
          callId: "call-2",
          toolId: "tool2",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ value: "value-2" }),
        },
        {
          kind: "tool-result",
          callId: "call-2",
          toolId: "tool2",
          state: COMPLETED,
          result: "result-2",
          error: null,
        },
        {
          kind: "tool-call",
          callId: "call-3",
          toolId: "tool3",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ value: "value-3" }),
        },
        {
          kind: "tool-result",
          callId: "call-3",
          toolId: "tool3",
          state: COMPLETED,
          result: "result-3",
          error: null,
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "text", text: "I'll use multiple tools." },
            {
              type: "tool-tool1",
              toolCallId: "call-1",
              toolName: "tool1",
              input: { value: "value-1" },
              state: "output-available",
              output: "result-1",
            },
            {
              type: "tool-tool2",
              toolCallId: "call-2",
              toolName: "tool2",
              input: { value: "value-2" },
              state: "output-available",
              output: "result-2",
            },
            {
              type: "tool-tool3",
              toolCallId: "call-3",
              toolName: "tool3",
              input: { value: "value-3" },
              state: "output-available",
              output: "result-3",
            },
          ],
        },
      ]);
    });

    it("should skip orphaned tool results (result without call)", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [{ kind: "text", text: "Response" }],
        },
        {
          kind: "tool-result",
          callId: "orphan-1",
          toolId: "calculator",
          state: COMPLETED,
          result: 42,
          error: null,
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [{ type: "text", text: "Response" }],
        },
      ]);
    });

    it("should handle tool calls followed by next message", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [{ kind: "text", text: "Using tool" }],
        },
        {
          kind: "tool-call",
          callId: "call-1",
          toolId: "search",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ query: "test" }),
        },
        {
          kind: "tool-result",
          callId: "call-1",
          toolId: "search",
          state: COMPLETED,
          result: "found it",
          error: null,
        },
        {
          kind: "message",
          id: "msg-2",
          role: "user",
          content: [{ kind: "text", text: "Thanks!" }],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Using tool" },
            {
              type: "tool-search",
              toolCallId: "call-1",
              toolName: "search",
              input: { query: "test" },
              state: "output-available",
              output: "found it",
            },
          ],
        },
        {
          id: "msg-2",
          role: "user",
          parts: [{ type: "text", text: "Thanks!" }],
        },
      ]);
    });
  });

  describe("reasoning parts", () => {
    it("should attach reasoning to last assistant message", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [{ kind: "text", text: "Let me think..." }],
        },
        {
          kind: "reasoning",
          text: "Analyzing the problem step by step",
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Let me think..." },
            {
              type: "reasoning",
              text: "Analyzing the problem step by step",
            },
          ],
        },
      ]);
    });

    it("should create new message for standalone reasoning", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [{ kind: "text", text: "Solve this problem" }],
        },
        {
          kind: "reasoning",
          id: "reasoning-1",
          text: "First, I need to understand the problem",
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "Solve this problem" }],
        },
        {
          id: "reasoning-1",
          role: "assistant",
          parts: [
            {
              type: "reasoning",
              text: "First, I need to understand the problem",
            },
          ],
        },
      ]);
    });

    it("should generate id for reasoning without id", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [{ kind: "text", text: "Question" }],
        },
        {
          kind: "reasoning",
          text: "Thinking...",
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "Question" }],
        },
        {
          id: "reasoning-1",
          role: "assistant",
          parts: [{ type: "reasoning", text: "Thinking..." }],
        },
      ]);
    });

    it("should attach multiple reasoning parts to assistant message", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "assistant",
          content: [{ kind: "text", text: "Response" }],
        },
        {
          kind: "reasoning",
          text: "Step 1: analyze",
        },
        {
          kind: "reasoning",
          text: "Step 2: synthesize",
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Response" },
            { type: "reasoning", text: "Step 1: analyze" },
            { type: "reasoning", text: "Step 2: synthesize" },
          ],
        },
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty history", () => {
      const items: LanguageModelItem[] = [];
      const result = historyToUIMessages(items);
      expect(result).toEqual([]);
    });

    it("should handle message with empty content", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [],
        },
      ]);
    });

    it("should handle complex conversation with mixed content", () => {
      const items: LanguageModelItem[] = [
        {
          kind: "message",
          id: "msg-1",
          role: "user",
          content: [
            { kind: "text", text: "Check this image and calculate" },
            {
              kind: "file",
              mimeType: "image/png",
              filename: "chart.png",
              uri: "https://example.com/chart.png",
            },
          ],
        },
        {
          kind: "message",
          id: "msg-2",
          role: "assistant",
          content: [{ kind: "text", text: "I'll analyze the image" }],
        },
        {
          kind: "reasoning",
          text: "The image shows numerical data",
        },
        {
          kind: "tool-call",
          callId: "call-1",
          toolId: "calculator",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ operation: "sum", values: [10, 20, 30] }),
        },
        {
          kind: "tool-result",
          callId: "call-1",
          toolId: "calculator",
          state: COMPLETED,
          result: 60,
          error: null,
        },
        {
          kind: "message",
          id: "msg-3",
          role: "assistant",
          content: [
            { kind: "text", text: "The sum is" },
            { kind: "data", data: { total: 60 } },
          ],
        },
      ];

      const result = historyToUIMessages(items);

      expect(result).toEqual([
        {
          id: "msg-1",
          role: "user",
          parts: [
            { type: "text", text: "Check this image and calculate" },
            {
              type: "file",
              url: "https://example.com/chart.png",
              mediaType: "image/png",
              filename: "chart.png",
            },
          ],
        },
        {
          id: "msg-2",
          role: "assistant",
          parts: [
            { type: "text", text: "I'll analyze the image" },
            {
              type: "reasoning",
              text: "The image shows numerical data",
            },
            {
              type: "tool-calculator",
              toolCallId: "call-1",
              toolName: "calculator",
              input: { operation: "sum", values: [10, 20, 30] },
              state: "output-available",
              output: 60,
            },
          ],
        },
        {
          id: "msg-3",
          role: "assistant",
          parts: [
            { type: "text", text: "The sum is" },
            { type: "data-total", data: 60 },
          ],
        },
      ]);
    });
  });
});
