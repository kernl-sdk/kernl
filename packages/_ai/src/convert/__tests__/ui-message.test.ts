import { describe, it, expect } from "vitest";
import { IN_PROGRESS, COMPLETED, FAILED } from "@kernl-sdk/protocol";

import { UIMessageCodec } from "../ui-message";

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

  // ----------------------------
  // Encode (not implemented)
  // ----------------------------
  describe("encode", () => {
    it("should throw not implemented error", () => {
      expect(() =>
        UIMessageCodec.encode({
          kind: "message",
          id: "1",
          role: "user",
          content: [{ kind: "text", text: "Hello" }],
        }),
      ).toThrow("Not yet implemented");
    });
  });
});
