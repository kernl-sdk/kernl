import { describe, it, expect, beforeAll } from "vitest";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { IN_PROGRESS } from "@kernl-sdk/protocol";

import { AISDKLanguageModel } from "../language-model";

/**
 * Integration tests for AISDKLanguageModel with real AI SDK providers.
 *
 * These tests require API keys to be set:
 * - OPENAI_API_KEY for OpenAI tests
 * - ANTHROPIC_API_KEY for Anthropic tests
 * - GOOGLE_GENERATIVE_AI_API_KEY for Google tests
 *
 * Run with: OPENAI_API_KEY=your-key ANTHROPIC_API_KEY=your-key GOOGLE_GENERATIVE_AI_API_KEY=your-key pnpm test:run
 */

const SKIP_OPENAI_TESTS = !process.env.OPENAI_API_KEY;
const SKIP_ANTHROPIC_TESTS = !process.env.ANTHROPIC_API_KEY;
const SKIP_GOOGLE_TESTS = !process.env.GOOGLE_GENERATIVE_AI_API_KEY;

/**
 * Shared JSON schema for structured output tests.
 * Extracts a person's name and age from text.
 */
const PERSON_SCHEMA = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const, description: "The person's name" },
    age: { type: "number" as const, description: "The person's age in years" },
  },
  required: ["name", "age"],
  additionalProperties: false,
};

describe.skipIf(SKIP_OPENAI_TESTS)("AISDKLanguageModel - OpenAI", () => {
  let gpt41: AISDKLanguageModel;

  beforeAll(() => {
    gpt41 = new AISDKLanguageModel(openai("gpt-4.1"));
  });

  describe("generate", () => {
    it("should generate a simple text response", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              { kind: "text", text: "Say 'Hello, World!' and nothing else." },
            ],
          },
        ],
        settings: {
          maxTokens: 50,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.usage).toBeDefined();
      expect(response.usage.inputTokens.total).toBeGreaterThan(0);
      expect(response.usage.outputTokens.total).toBeGreaterThan(0);

      // Should have at least one message
      const messages = response.content.filter(
        (item) => item.kind === "message",
      );
      expect(messages.length).toBeGreaterThan(0);
    });

    it("should handle system messages", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "system",
            id: "msg-sys",
            content: [
              {
                kind: "text",
                text: "You are a helpful assistant that always responds with 'Acknowledged.'",
              },
            ],
          },
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Hello" }],
          },
        ],
        settings: {
          maxTokens: 50,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.usage.inputTokens.total).toBeGreaterThan(0);
    });

    it("should handle multi-turn conversations", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "My name is Alice." }],
          },
          {
            kind: "message",
            role: "assistant",
            id: "msg-2",
            content: [{ kind: "text", text: "Nice to meet you, Alice!" }],
          },
          {
            kind: "message",
            role: "user",
            id: "msg-3",
            content: [{ kind: "text", text: "What is my name?" }],
          },
        ],
        settings: {
          maxTokens: 50,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.usage.inputTokens.total).toBeGreaterThan(0);

      // Check that it remembers the name (should mention Alice)
      const assistantMessages = response.content.filter(
        (item) => item.kind === "message" && item.role === "assistant",
      );
      expect(assistantMessages.length).toBeGreaterThan(0);
    });

    it("should respect temperature setting", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Say hello" }],
          },
        ],
        settings: {
          maxTokens: 20,
          temperature: 0, // Deterministic
        },
      });

      expect(response.content).toBeDefined();
      expect(response.usage.inputTokens.total).toBeGreaterThan(0);
    });

    it("should respect maxTokens setting", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Count from 1 to 100" }],
          },
        ],
        settings: {
          maxTokens: 20, // Minimum is 16 for OpenAI
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.usage.outputTokens.total).toBeDefined();
      expect(response.usage.outputTokens.total).toBeLessThanOrEqual(20);
    });
  });

  describe("stream", () => {
    it("should stream text responses", async () => {
      const events = [];

      for await (const event of gpt41.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Count to 5" }],
          },
        ],
        settings: {
          maxTokens: 50,
          temperature: 0,
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have at least one finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);

      // Should have usage information
      const finishEvent = finishEvents[0] as any;
      expect(finishEvent.usage).toBeDefined();
      expect(finishEvent.usage.inputTokens.total).toBeGreaterThan(0);
    });

    it("should stream text deltas", async () => {
      const events = [];

      for await (const event of gpt41.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Say 'Hello World'" }],
          },
        ],
        settings: {
          maxTokens: 20,
          temperature: 0,
        },
      })) {
        events.push(event);
      }

      // Should have text-delta events
      const textDeltas = events.filter((e) => e.kind === "text.delta");
      expect(textDeltas.length).toBeGreaterThan(0);

      // Each text-delta should have text
      for (const delta of textDeltas) {
        expect(delta.text).toBeDefined();
        expect(typeof delta.text).toBe("string");
      }
    });

    it("should handle limited token streams", async () => {
      const events = [];

      for await (const event of gpt41.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Hi" }],
          },
        ],
        settings: {
          maxTokens: 16, // Minimum for OpenAI
          temperature: 0,
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should still have a finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);
    });

    it("should yield both delta events and complete Message items", async () => {
      const events = [];

      for await (const event of gpt41.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              { kind: "text", text: "Say 'Hello World' and nothing else." },
            ],
          },
        ],
        settings: {
          maxTokens: 50,
          temperature: 0,
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have text-delta events (for streaming UX)
      const textDeltas = events.filter((e) => e.kind === "text.delta");
      expect(textDeltas.length).toBeGreaterThan(0);

      // Should have text-start event
      const textStarts = events.filter((e) => e.kind === "text.start");
      expect(textStarts.length).toBeGreaterThan(0);

      // Should have text-end event
      const textEnds = events.filter((e) => e.kind === "text.end");
      expect(textEnds.length).toBeGreaterThan(0);

      // Should have complete Message item (for history)
      const messages = events.filter((e) => e.kind === "message");
      expect(messages.length).toBeGreaterThan(0);

      const assistantMessage = messages[0] as any;
      expect(assistantMessage.role).toBe("assistant");
      expect(assistantMessage.content).toBeDefined();
      expect(assistantMessage.content.length).toBeGreaterThan(0);

      // Message should have accumulated text from all deltas
      const textContent = assistantMessage.content.find(
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
    });

    it("should handle streaming tools with no required parameters (empty arguments)", async () => {
      // Verify the empty arguments fix works in streaming mode as well
      const events = [];

      for await (const event of gpt41.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Use the list_all_items tool",
              },
            ],
          },
        ],
        tools: [
          {
            kind: "function",
            name: "list_all_items",
            description: "List all items",
            parameters: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Optional category filter",
                },
              },
              // No required parameters
            },
          },
        ],
        settings: {
          maxTokens: 200,
          temperature: 0,
          toolChoice: { kind: "required" }, // Force tool use
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have a tool-call event
      const toolCalls = events.filter((e) => e.kind === "tool.call");
      expect(toolCalls.length).toBeGreaterThan(0);

      const toolCall = toolCalls[0] as any;
      expect(toolCall.callId).toBeDefined();
      expect(toolCall.toolId).toBe("list_all_items");
      expect(toolCall.state).toBe(IN_PROGRESS);

      // Critical assertion: arguments should be valid JSON even if empty
      expect(toolCall.arguments).toBeDefined();
      expect(() => JSON.parse(toolCall.arguments)).not.toThrow();

      const args = JSON.parse(toolCall.arguments);
      expect(typeof args).toBe("object");

      // Should have finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);
    });
  });

  describe("tools", () => {
    it("should call tools when requested", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "What is 25 + 17?" }],
          },
        ],
        tools: [
          {
            kind: "function",
            name: "calculate",
            description: "Perform a mathematical calculation",
            parameters: {
              type: "object",
              properties: {
                expression: {
                  type: "string",
                  description: "The mathematical expression to evaluate",
                },
              },
              required: ["expression"],
            },
          },
        ],
        settings: {
          maxTokens: 200,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();

      // Should have a tool call
      const toolCalls = response.content.filter(
        (item) => item.kind === "tool.call",
      );
      expect(toolCalls.length).toBeGreaterThan(0);

      // Tool call should have proper structure
      const toolCall = toolCalls[0] as any;
      expect(toolCall.callId).toBeDefined();
      expect(toolCall.toolId).toBe("calculate");
      expect(toolCall.arguments).toBeDefined();
    });

    it("should handle tool choice setting", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Use the get_weather tool for San Francisco",
              },
            ],
          },
        ],
        tools: [
          {
            kind: "function",
            name: "get_weather",
            description: "Get weather for a city",
            parameters: {
              type: "object",
              properties: {
                city: {
                  type: "string",
                  description: "The city name",
                },
              },
              required: ["city"],
            },
          },
        ],
        settings: {
          maxTokens: 200,
          temperature: 0,
          toolChoice: { kind: "required" }, // Force tool use
        },
      });

      expect(response.content).toBeDefined();

      // Should have a tool call since it's required
      const toolCalls = response.content.filter(
        (item) => item.kind === "tool.call",
      );
      expect(toolCalls.length).toBeGreaterThan(0);
    });

    it("should handle multiple tool calls", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Get the weather for both San Francisco and New York",
              },
            ],
          },
        ],
        tools: [
          {
            kind: "function",
            name: "get_weather",
            description: "Get weather for a city",
            parameters: {
              type: "object",
              properties: {
                city: {
                  type: "string",
                  description: "The city name",
                },
              },
              required: ["city"],
            },
          },
        ],
        settings: {
          maxTokens: 300,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();

      // Should potentially have multiple tool calls
      const toolCalls = response.content.filter(
        (item) => item.kind === "tool.call",
      );
      expect(toolCalls.length).toBeGreaterThan(0);
    });

    it("should handle multi-turn conversation with tool results", async () => {
      // First turn: get tool calls from the model
      const firstResponse = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "What is 25 + 17?" }],
          },
        ],
        tools: [
          {
            kind: "function",
            name: "calculate",
            description: "Perform a mathematical calculation",
            parameters: {
              type: "object",
              properties: {
                expression: {
                  type: "string",
                  description: "The mathematical expression to evaluate",
                },
              },
              required: ["expression"],
            },
          },
        ],
        settings: {
          maxTokens: 200,
          temperature: 0,
        },
      });

      expect(firstResponse.content).toBeDefined();

      // Extract tool calls
      const toolCalls = firstResponse.content.filter(
        (item) => item.kind === "tool.call",
      );
      expect(toolCalls.length).toBeGreaterThan(0);

      const toolCall = toolCalls[0] as any;
      expect(toolCall.callId).toBeDefined();
      expect(toolCall.toolId).toBe("calculate");

      // Second turn: send tool results back to the model
      const secondResponse = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "What is 25 + 17?" }],
          },
          ...firstResponse.content,
          {
            kind: "tool.result",
            callId: toolCall.callId,
            toolId: toolCall.toolId,
            state: "completed",
            result: { answer: 42 },
            error: null,
          },
        ],
        tools: [
          {
            kind: "function",
            name: "calculate",
            description: "Perform a mathematical calculation",
            parameters: {
              type: "object",
              properties: {
                expression: {
                  type: "string",
                  description: "The mathematical expression to evaluate",
                },
              },
              required: ["expression"],
            },
          },
        ],
        settings: {
          maxTokens: 200,
          temperature: 0,
        },
      });

      expect(secondResponse.content).toBeDefined();

      // Should have an assistant message with the final answer
      const messages = secondResponse.content.filter(
        (item) => item.kind === "message" && item.role === "assistant",
      );
      expect(messages.length).toBeGreaterThan(0);
    });

    it("should handle tools with no required parameters (empty arguments)", async () => {
      // This test verifies the fix for empty string arguments
      // When a tool has no required parameters and is called with no args,
      // AI SDK sends input: "", which should be converted to "{}" for valid JSON
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Use the list_issues tool to get all issues",
              },
            ],
          },
        ],
        tools: [
          {
            kind: "function",
            name: "list_issues",
            description: "List all issues in the system",
            parameters: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  description: "Optional status filter",
                  enum: ["open", "closed", "all"],
                },
                limit: {
                  type: "number",
                  description: "Optional limit on number of results",
                },
              },
              // No required parameters - all are optional
            },
          },
        ],
        settings: {
          maxTokens: 200,
          temperature: 0,
          toolChoice: { kind: "required" }, // Force tool use
        },
      });

      expect(response.content).toBeDefined();

      // Should have a tool call
      const toolCalls = response.content.filter(
        (item) => item.kind === "tool.call",
      );
      expect(toolCalls.length).toBeGreaterThan(0);

      const toolCall = toolCalls[0] as any;
      expect(toolCall.callId).toBeDefined();
      expect(toolCall.toolId).toBe("list_issues");
      expect(toolCall.state).toBe(IN_PROGRESS);

      // The critical assertion: arguments should be valid JSON
      // Even if the tool was called with no args, it should be "{}" not ""
      expect(toolCall.arguments).toBeDefined();
      expect(() => JSON.parse(toolCall.arguments)).not.toThrow();

      // Parse should succeed and yield an object (possibly empty)
      const args = JSON.parse(toolCall.arguments);
      expect(typeof args).toBe("object");
    });
  });

  describe("validation", () => {
    it("should throw error for invalid maxTokens", async () => {
      // AI SDK properly validates and throws errors for invalid values
      await expect(
        gpt41.generate({
          input: [
            {
              kind: "message",
              role: "user",
              id: "msg-1",
              content: [{ kind: "text", text: "Hello" }],
            },
          ],
          settings: {
            maxTokens: -1, // Invalid
          },
        }),
      ).rejects.toThrow(/max_output_tokens/);
    });

    it("should throw error for below minimum maxTokens", async () => {
      // OpenAI requires minimum 16 tokens
      await expect(
        gpt41.generate({
          input: [
            {
              kind: "message",
              role: "user",
              id: "msg-1",
              content: [{ kind: "text", text: "Hello" }],
            },
          ],
          settings: {
            maxTokens: 10, // Below minimum
          },
        }),
      ).rejects.toThrow(/max_output_tokens/);
    });
  });

  describe("structured output", () => {
    it("should generate structured JSON output with responseType", async () => {
      const response = await gpt41.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Extract the person info: John Smith is 42 years old.",
              },
            ],
          },
        ],
        responseType: {
          kind: "json",
          schema: PERSON_SCHEMA,
          name: "person",
          description: "A person with name and age",
        },
        settings: {
          maxTokens: 100,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);

      // Find the assistant message with JSON output
      const messages = response.content.filter(
        (item) => item.kind === "message" && item.role === "assistant",
      );
      expect(messages.length).toBeGreaterThan(0);

      const msg = messages[0] as any;
      const textContent = msg.content.find((c: any) => c.kind === "text");
      expect(textContent).toBeDefined();

      // Parse and validate the JSON output
      const parsed = JSON.parse(textContent.text);
      expect(parsed.name).toBe("John Smith");
      expect(parsed.age).toBe(42);
    });

    it("should stream structured JSON output with responseType", async () => {
      const events = [];

      for await (const event of gpt41.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Extract the person info: Alice Wong is 28 years old.",
              },
            ],
          },
        ],
        responseType: {
          kind: "json",
          schema: PERSON_SCHEMA,
          name: "person",
          description: "A person with name and age",
        },
        settings: {
          maxTokens: 100,
          temperature: 0,
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have text-delta events for streaming JSON
      const textDeltas = events.filter((e) => e.kind === "text.delta");
      expect(textDeltas.length).toBeGreaterThan(0);

      // Should have a complete message with the JSON
      const messages = events.filter((e) => e.kind === "message");
      expect(messages.length).toBeGreaterThan(0);

      const msg = messages[0] as any;
      const textContent = msg.content.find((c: any) => c.kind === "text");
      expect(textContent).toBeDefined();

      // Parse and validate the JSON output
      const parsed = JSON.parse(textContent.text);
      expect(parsed.name).toBe("Alice Wong");
      expect(parsed.age).toBe(28);

      // Should have finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);
    });
  });
});

describe.skipIf(SKIP_ANTHROPIC_TESTS)("AISDKLanguageModel - Anthropic", () => {
  let claude: AISDKLanguageModel;

  beforeAll(() => {
    claude = new AISDKLanguageModel(anthropic("claude-sonnet-4-5"));
  });

  describe("tools", () => {
    it("should handle tools with no required parameters (Anthropic-specific)", async () => {
      // This test specifically verifies Anthropic's behavior with empty arguments
      // Anthropic was the provider that sent input: "" for tools with no required params
      const response = await claude.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Use the list_issues tool",
              },
            ],
          },
        ],
        tools: [
          {
            kind: "function",
            name: "list_issues",
            description: "List all issues in the system",
            parameters: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  description: "Optional status filter",
                  enum: ["open", "closed", "all"],
                },
                assignee: {
                  type: "string",
                  description: "Optional assignee filter",
                },
              },
              // No required parameters - all are optional
            },
          },
        ],
        settings: {
          maxTokens: 200,
          temperature: 0,
          toolChoice: { kind: "required" }, // Force tool use
        },
      });

      expect(response.content).toBeDefined();

      // Should have a tool call
      const toolCalls = response.content.filter(
        (item) => item.kind === "tool.call",
      );
      expect(toolCalls.length).toBeGreaterThan(0);

      const toolCall = toolCalls[0] as any;
      expect(toolCall.callId).toBeDefined();
      expect(toolCall.toolId).toBe("list_issues");
      expect(toolCall.state).toBe(IN_PROGRESS);

      // Critical: Anthropic sends input: "" for tools with no required params
      // Our adapter must convert this to "{}" for valid JSON
      expect(toolCall.arguments).toBeDefined();
      expect(() => JSON.parse(toolCall.arguments)).not.toThrow();

      const args = JSON.parse(toolCall.arguments);
      expect(typeof args).toBe("object");
    });

    it("should handle streaming tools with no required parameters (Anthropic-specific)", async () => {
      // Verify the fix works in streaming mode with Anthropic
      const events = [];

      for await (const event of claude.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Use the get_all_data tool",
              },
            ],
          },
        ],
        tools: [
          {
            kind: "function",
            name: "get_all_data",
            description: "Get all data from the system",
            parameters: {
              type: "object",
              properties: {
                format: {
                  type: "string",
                  description: "Optional output format",
                  enum: ["json", "csv", "xml"],
                },
              },
              // No required parameters
            },
          },
        ],
        settings: {
          maxTokens: 200,
          temperature: 0,
          toolChoice: { kind: "required" }, // Force tool use
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have a tool-call event
      const toolCalls = events.filter((e) => e.kind === "tool.call");
      expect(toolCalls.length).toBeGreaterThan(0);

      const toolCall = toolCalls[0] as any;
      expect(toolCall.callId).toBeDefined();
      expect(toolCall.toolId).toBe("get_all_data");
      expect(toolCall.state).toBe(IN_PROGRESS);

      // Critical: arguments should be valid JSON even if Anthropic sent ""
      expect(toolCall.arguments).toBeDefined();
      expect(() => JSON.parse(toolCall.arguments)).not.toThrow();

      const args = JSON.parse(toolCall.arguments);
      expect(typeof args).toBe("object");

      // Should have finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);
    });
  });

  describe("structured output", () => {
    it("should generate structured JSON output with responseType", async () => {
      const response = await claude.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Extract the person info: Maria Garcia is 35 years old.",
              },
            ],
          },
        ],
        responseType: {
          kind: "json",
          schema: PERSON_SCHEMA,
          name: "person",
          description: "A person with name and age",
        },
        settings: {
          maxTokens: 100,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);

      // Find the assistant message with JSON output
      const messages = response.content.filter(
        (item) => item.kind === "message" && item.role === "assistant",
      );
      expect(messages.length).toBeGreaterThan(0);

      const msg = messages[0] as any;
      const textContent = msg.content.find((c: any) => c.kind === "text");
      expect(textContent).toBeDefined();

      // Parse and validate the JSON output
      const parsed = JSON.parse(textContent.text);
      expect(parsed.name).toBe("Maria Garcia");
      expect(parsed.age).toBe(35);
    });

    it("should stream structured JSON output with responseType", async () => {
      const events = [];

      for await (const event of claude.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Extract the person info: David Chen is 55 years old.",
              },
            ],
          },
        ],
        responseType: {
          kind: "json",
          schema: PERSON_SCHEMA,
          name: "person",
          description: "A person with name and age",
        },
        settings: {
          maxTokens: 100,
          temperature: 0,
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have text-delta events for streaming JSON
      const textDeltas = events.filter((e) => e.kind === "text.delta");
      expect(textDeltas.length).toBeGreaterThan(0);

      // Should have a complete message with the JSON
      const messages = events.filter((e) => e.kind === "message");
      expect(messages.length).toBeGreaterThan(0);

      const msg = messages[0] as any;
      const textContent = msg.content.find((c: any) => c.kind === "text");
      expect(textContent).toBeDefined();

      // Parse and validate the JSON output
      const parsed = JSON.parse(textContent.text);
      expect(parsed.name).toBe("David Chen");
      expect(parsed.age).toBe(55);

      // Should have finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);
    });
  });
});

describe.skipIf(SKIP_GOOGLE_TESTS)("AISDKLanguageModel - Google", () => {
  let gemini: AISDKLanguageModel;

  beforeAll(() => {
    gemini = new AISDKLanguageModel(google("gemini-2.5-flash-lite"));
  });

  describe("generate", () => {
    it("should generate a simple text response", async () => {
      const response = await gemini.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              { kind: "text", text: "Say 'Hello, World!' and nothing else." },
            ],
          },
        ],
        settings: {
          maxTokens: 50,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.usage).toBeDefined();
      expect(response.usage.inputTokens.total).toBeGreaterThan(0);

      const messages = response.content.filter(
        (item) => item.kind === "message",
      );
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe("stream", () => {
    it("should stream text responses", async () => {
      const events = [];

      for await (const event of gemini.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [{ kind: "text", text: "Count to 5" }],
          },
        ],
        settings: {
          maxTokens: 50,
          temperature: 0,
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have at least one finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);

      // Should have usage information
      const finishEvent = finishEvents[0] as any;
      expect(finishEvent.usage).toBeDefined();
      expect(finishEvent.usage.inputTokens.total).toBeGreaterThan(0);
    });
  });

  describe("structured output", () => {
    it("should generate structured JSON output with responseType", async () => {
      const response = await gemini.generate({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Extract the person info: Kenji Tanaka is 29 years old.",
              },
            ],
          },
        ],
        responseType: {
          kind: "json",
          schema: PERSON_SCHEMA,
          name: "person",
          description: "A person with name and age",
        },
        settings: {
          maxTokens: 100,
          temperature: 0,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);

      // Find the assistant message with JSON output
      const messages = response.content.filter(
        (item) => item.kind === "message" && item.role === "assistant",
      );
      expect(messages.length).toBeGreaterThan(0);

      const msg = messages[0] as any;
      const textContent = msg.content.find((c: any) => c.kind === "text");
      expect(textContent).toBeDefined();

      // Parse and validate the JSON output
      const parsed = JSON.parse(textContent.text);
      expect(parsed.name).toBe("Kenji Tanaka");
      expect(parsed.age).toBe(29);
    });

    it("should stream structured JSON output with responseType", async () => {
      const events = [];

      for await (const event of gemini.stream({
        input: [
          {
            kind: "message",
            role: "user",
            id: "msg-1",
            content: [
              {
                kind: "text",
                text: "Extract the person info: Sarah Johnson is 41 years old.",
              },
            ],
          },
        ],
        responseType: {
          kind: "json",
          schema: PERSON_SCHEMA,
          name: "person",
          description: "A person with name and age",
        },
        settings: {
          maxTokens: 100,
          temperature: 0,
        },
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      // Should have text-delta events for streaming JSON
      const textDeltas = events.filter((e) => e.kind === "text.delta");
      expect(textDeltas.length).toBeGreaterThan(0);

      // Should have a complete message with the JSON
      const messages = events.filter((e) => e.kind === "message");
      expect(messages.length).toBeGreaterThan(0);

      const msg = messages[0] as any;
      const textContent = msg.content.find((c: any) => c.kind === "text");
      expect(textContent).toBeDefined();

      // Parse and validate the JSON output
      const parsed = JSON.parse(textContent.text);
      expect(parsed.name).toBe("Sarah Johnson");
      expect(parsed.age).toBe(41);

      // Should have finish event
      const finishEvents = events.filter((e) => e.kind === "finish");
      expect(finishEvents.length).toBe(1);
    });
  });
});
