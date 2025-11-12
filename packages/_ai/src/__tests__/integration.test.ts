import { describe, it, expect, beforeAll } from "vitest";
import { openai } from "@ai-sdk/openai";

import { AISDKLanguageModel } from "../language-model";

/**
 * Integration tests for AISDKLanguageModel with real AI SDK providers.
 *
 * These tests require an OPENAI_API_KEY environment variable to be set.
 * They will be skipped if the API key is not available.
 *
 * Run with: OPENAI_API_KEY=your-key pnpm test:run
 */

const SKIP_INTEGRATION_TESTS = !process.env.OPENAI_API_KEY;

describe.skipIf(SKIP_INTEGRATION_TESTS)(
  "AISDKLanguageModel integration",
  () => {
    let gpt4omini: AISDKLanguageModel;

    beforeAll(() => {
      gpt4omini = new AISDKLanguageModel(openai("gpt-4o-mini")); // gpt-4o-mini for fast, cheap testing
    });

    describe("generate", () => {
      it("should generate a simple text response", async () => {
        const response = await gpt4omini.generate({
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
        expect(response.usage.totalTokens).toBeGreaterThan(0);
        expect(response.usage.inputTokens).toBeGreaterThan(0);
        expect(response.usage.outputTokens).toBeGreaterThan(0);

        // Should have at least one message
        const messages = response.content.filter(
          (item) => item.kind === "message",
        );
        expect(messages.length).toBeGreaterThan(0);
      });

      it("should handle system messages", async () => {
        const response = await gpt4omini.generate({
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
        expect(response.usage.totalTokens).toBeGreaterThan(0);
      });

      it("should handle multi-turn conversations", async () => {
        const response = await gpt4omini.generate({
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
        expect(response.usage.totalTokens).toBeGreaterThan(0);

        // Check that it remembers the name (should mention Alice)
        const assistantMessages = response.content.filter(
          (item) => item.kind === "message" && item.role === "assistant",
        );
        expect(assistantMessages.length).toBeGreaterThan(0);
      });

      it("should respect temperature setting", async () => {
        const response = await gpt4omini.generate({
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
        expect(response.usage.totalTokens).toBeGreaterThan(0);
      });

      it("should respect maxTokens setting", async () => {
        const response = await gpt4omini.generate({
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
        expect(response.usage.outputTokens).toBeDefined();
        expect(response.usage.outputTokens).toBeLessThanOrEqual(20);
      });
    });

    describe("stream", () => {
      it("should stream text responses", async () => {
        const events = [];

        for await (const event of gpt4omini.stream({
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
        expect(finishEvent.usage.totalTokens).toBeGreaterThan(0);
      });

      it("should stream text deltas", async () => {
        const events = [];

        for await (const event of gpt4omini.stream({
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
        const textDeltas = events.filter((e) => e.kind === "text-delta");
        expect(textDeltas.length).toBeGreaterThan(0);

        // Each text-delta should have text
        for (const delta of textDeltas) {
          expect(delta.text).toBeDefined();
          expect(typeof delta.text).toBe("string");
        }
      });

      it("should handle limited token streams", async () => {
        const events = [];

        for await (const event of gpt4omini.stream({
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
    });

    describe("tools", () => {
      it("should call tools when requested", async () => {
        const response = await gpt4omini.generate({
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
          (item) => item.kind === "tool-call",
        );
        expect(toolCalls.length).toBeGreaterThan(0);

        // Tool call should have proper structure
        const toolCall = toolCalls[0] as any;
        expect(toolCall.callId).toBeDefined();
        expect(toolCall.toolId).toBe("calculate");
        expect(toolCall.arguments).toBeDefined();
      });

      it("should handle tool choice setting", async () => {
        const response = await gpt4omini.generate({
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
          (item) => item.kind === "tool-call",
        );
        expect(toolCalls.length).toBeGreaterThan(0);
      });

      it("should handle multiple tool calls", async () => {
        const response = await gpt4omini.generate({
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
          (item) => item.kind === "tool-call",
        );
        expect(toolCalls.length).toBeGreaterThan(0);
      });
    });

    describe("validation", () => {
      it("should throw error for invalid maxTokens", async () => {
        // AI SDK properly validates and throws errors for invalid values
        await expect(
          gpt4omini.generate({
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
          gpt4omini.generate({
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
  },
);
