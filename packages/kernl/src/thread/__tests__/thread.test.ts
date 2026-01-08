import { describe, it, expect } from "vitest";
import { z } from "zod";

import type { LanguageModelRequest, LanguageModelItem } from "@kernl-sdk/protocol";
import { IN_PROGRESS, COMPLETED, FAILED } from "@kernl-sdk/protocol";

import { Thread } from "../thread";
import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { Context } from "@/context";
import { tool, FunctionToolkit } from "@/tool";
import { ModelBehaviorError } from "@/lib/error";

import type { ThreadEvent } from "@/thread/types";
import { createMockModel } from "./fixtures/mock-model";

// Helper to create user message input
function userMessage(text: string): LanguageModelItem[] {
  return [
    {
      kind: "message" as const,
      id: "msg-test",
      role: "user" as const,
      content: [{ kind: "text" as const, text }],
    },
  ];
}

describe("Thread", () => {
  describe("Basic Execution", () => {
    it("should execute single turn and terminate with exact history", async () => {
      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Hello world" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("Hello world") });

      const result = await thread.execute();

      // Access private history via type assertion for testing
      const history = (thread as any).history as ThreadEvent[];

      expect(history).toEqual([
        expect.objectContaining({
          kind: "message",
          role: "user",
          content: [{ kind: "text", text: "Hello world" }],
        }),
        expect.objectContaining({
          kind: "message",
          role: "assistant",
          content: [{ kind: "text", text: "Hello world" }],
        }),
      ]);

      expect(thread._tick).toBe(1);
    });

    it("should convert string input to UserMessage", async () => {
      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Response" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("Test input") });

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];
      const firstMessage = history[0];

      expect(firstMessage).toEqual(expect.objectContaining({
        kind: "message",
        role: "user",
        content: [{ kind: "text", text: "Test input" }],
      }));
    });

    it("should use array input as-is", async () => {
      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Response" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
      });

      const events: LanguageModelItem[] = [
        {
          kind: "message",
          id: "custom_msg",
          role: "user",
          content: [{ kind: "text", text: "Custom message" }],
        },
      ];

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: events });

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];
      const firstMessage = history[0];

      expect(firstMessage).toEqual(expect.objectContaining({
        kind: events[0].kind,
        role: (events[0] as any).role,
        content: (events[0] as any).content,
      }));
    });
  });

  describe("Multi-Turn Execution", () => {
    it("should execute multi-turn with tool call and exact history", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        // First call: return tool call
        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "echo",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ text: "test" }),
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        // Second call: return final message
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_2",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Done!" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 4,
            outputTokens: 2,
            totalTokens: 6,
          },
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
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [
          new FunctionToolkit({ id: "test-tools", tools: [echoTool] }),
        ],
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("Use the echo tool") });

      const result = await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      expect(history).toEqual([
        // Initial user message
        expect.objectContaining({
          kind: "message",
          role: "user",
          content: [{ kind: "text", text: "Use the echo tool" }],
        }),
        // Assistant message (tick 1)
        expect.objectContaining({
          kind: "message",
          role: "assistant",
          content: [],
        }),
        // Tool call (tick 1)
        expect.objectContaining({
          kind: "tool-call",
          toolId: "echo",
          callId: "call_1",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ text: "test" }),
        }),
        // Tool result (executed after tick 1)
        expect.objectContaining({
          kind: "tool-result",
          callId: "call_1",
          toolId: "echo",
          state: COMPLETED,
          result: "Echo: test",
          error: null,
        }),
        // Final assistant message (tick 2)
        expect.objectContaining({
          kind: "message",
          role: "assistant",
          content: [{ kind: "text", text: "Done!" }],
        }),
      ]);

      expect(thread._tick).toBe(2);
    });

    it("should accumulate history across multiple turns", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "simple",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ value: "first" }),
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        if (callCount === 2) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_2",
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "simple",
                state: IN_PROGRESS,
                callId: "call_2",
                arguments: JSON.stringify({ value: "second" }),
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 3,
              outputTokens: 2,
              totalTokens: 5,
            },
            warnings: [],
          };
        }

        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_3",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "All done" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 4,
            outputTokens: 2,
            totalTokens: 6,
          },
          warnings: [],
        };
      });

      const simpleTool = tool({
        id: "simple",
        description: "Simple tool",
        parameters: undefined,
        execute: async (ctx, input: string) => `Result: ${input}`,
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [
          new FunctionToolkit({ id: "test-tools", tools: [simpleTool] }),
        ],
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("Start") });

      const result = await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      // Should have: 1 user msg + 3 assistant msgs + 2 tool calls + 2 tool results = 8 events
      expect(history).toHaveLength(8);
      expect(thread._tick).toBe(3);
    });
  });

  describe("Tool Execution", () => {
    it("should handle tool not found with exact error in history", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        // First call: return tool call
        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "nonexistent",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: "{}",
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        // Second call: return terminal message
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_2",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Done" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [], // No tools available
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      // Check that the tool result is an error
      const toolResult = history.find((e) => e.kind === "tool-result");
      expect(toolResult).toEqual(expect.objectContaining({
        kind: "tool-result",
        callId: "call_1",
        toolId: "nonexistent",
        state: FAILED,
        result: undefined,
        error: "Tool nonexistent not found",
      }));
    });

    it("should handle tool execution error", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        // First call: return tool call
        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "failing",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: "{}",
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        // Second call: return terminal message
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_2",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Done" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const failingTool = tool({
        id: "failing",
        description: "Tool that throws",
        parameters: undefined,
        execute: async () => {
          throw new Error("Execution failed!");
        },
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [
          new FunctionToolkit({ id: "test-tools", tools: [failingTool] }),
        ],
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      const toolResult = history.find((e) => e.kind === "tool-result");
      expect(toolResult).toMatchObject({
        kind: "tool-result",
        callId: "call_1",
        toolId: "failing",
        state: FAILED,
        result: undefined,
      });
      expect((toolResult as any).error).toContain("Execution failed!");
    });

    it("should execute tool successfully with result in history", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        // First call: return tool call
        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "add",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ a: 5, b: 3 }),
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        // Second call: return terminal message
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_2",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Done" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const addTool = tool({
        id: "add",
        description: "Adds two numbers",
        parameters: z.object({ a: z.number(), b: z.number() }),
        execute: async (ctx, { a, b }) => a + b,
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [new FunctionToolkit({ id: "test-tools", tools: [addTool] })],
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("Add 5 and 3") });

      await thread.execute();

      // @ts-expect-error
      const history = thread.history as ThreadEvent[];

      const toolResult = history.find((e) => e.kind === "tool-result");
      expect(toolResult).toEqual(expect.objectContaining({
        kind: "tool-result",
        callId: "call_1",
        toolId: "add",
        state: COMPLETED,
        result: 8,
        error: null,
      }));
    });
  });

  describe("Parallel Tool Execution", () => {
    it("should execute multiple tools in parallel with exact history", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        // First call: return multiple tool calls
        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "tool1",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: JSON.stringify({ value: "a" }),
              },
              {
                kind: "tool-call" as const,
                toolId: "tool2",
                state: IN_PROGRESS,
                callId: "call_2",
                arguments: JSON.stringify({ value: "b" }),
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        // Second call: return terminal message
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_2",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Done" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const tool1 = tool({
        id: "tool1",
        description: "Tool 1",
        parameters: z.object({ value: z.string() }),
        execute: async (ctx, { value }) => `Tool1: ${value}`,
      });

      const tool2 = tool({
        id: "tool2",
        description: "Tool 2",
        parameters: z.object({ value: z.string() }),
        execute: async (ctx, { value }) => `Tool2: ${value}`,
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [
          new FunctionToolkit({ id: "test-tools", tools: [tool1, tool2] }),
        ],
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      // Should have both tool results in history
      const toolResults = history.filter((e) => e.kind === "tool-result");
      expect(toolResults).toHaveLength(2);
      expect(toolResults).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "tool-result",
            callId: "call_1",
            toolId: "tool1",
            state: COMPLETED,
            result: "Tool1: a",
            error: null,
          }),
          expect.objectContaining({
            kind: "tool-result",
            callId: "call_2",
            toolId: "tool2",
            state: COMPLETED,
            result: "Tool2: b",
            error: null,
          }),
        ]),
      );
    });
  });

  describe("State Management", () => {
    it("should track tick counter correctly", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        if (callCount < 3) {
          return {
            content: [
              {
                kind: "message" as const,
                id: `msg_${callCount}`,
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "simple",
                state: IN_PROGRESS,
                callId: `call_${callCount}`,
                arguments: "{}",
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_final",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Done" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const simpleTool = tool({
        id: "simple",
        description: "Simple tool",
        parameters: undefined,
        execute: async () => "result",
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [
          new FunctionToolkit({ id: "test-tools", tools: [simpleTool] }),
        ],
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      const result = await thread.execute();

      expect(thread._tick).toBe(3);
    });

    it("should accumulate model responses", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [],
              },
              {
                kind: "tool-call" as const,
                toolId: "simple",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: "{}",
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 10,
              outputTokens: 5,
              totalTokens: 15,
            },
            warnings: [],
          };
        }

        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_2",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Done" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 20,
            outputTokens: 10,
            totalTokens: 30,
          },
          warnings: [],
        };
      });

      const simpleTool = tool({
        id: "simple",
        description: "Simple tool",
        parameters: undefined,
        execute: async () => "result",
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [
          new FunctionToolkit({ id: "test-tools", tools: [simpleTool] }),
        ],
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      const result = await thread.execute();

      // Verify the thread executed both turns
      expect(thread._tick).toBe(2);
      expect(result.response).toBe("Done");
    });
  });

  describe("Terminal State Detection", () => {
    it("should terminate when assistant message has no tool calls", async () => {
      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Final response" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      const result = await thread.execute();

      expect(thread._tick).toBe(1);
    });

    it("should continue when assistant message has tool calls", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Let me use a tool" }],
              },
              {
                kind: "tool-call" as const,
                toolId: "simple",
                state: IN_PROGRESS,
                callId: "call_1",
                arguments: "{}",
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_2",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Done now" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 3,
            outputTokens: 2,
            totalTokens: 5,
          },
          warnings: [],
        };
      });

      const simpleTool = tool({
        id: "simple",
        description: "Simple tool",
        parameters: undefined,
        execute: async () => "result",
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        toolkits: [
          new FunctionToolkit({ id: "test-tools", tools: [simpleTool] }),
        ],
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      const result = await thread.execute();

      // Should have made 2 calls - first with tool, second without
      expect(thread._tick).toBe(2);
    });
  });

  describe("Final Output Parsing", () => {
    it("should return text output when output is 'text'", async () => {
      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Hello, world!" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        output: "text",
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      const result = await thread.execute();

      expect(result.response).toBe("Hello, world!");
      expect(thread._tick).toBe(1);
    });

    it("should parse and validate structured output with valid JSON", async () => {
      const responseSchema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });

      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [
                {
                  kind: "text" as const,
                  text: '{"name": "Alice", "age": 30, "email": "alice@example.com"}',
                },
              ],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        output: responseSchema,
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      const result = await thread.execute();

      expect(result.response).toEqual({
        name: "Alice",
        age: 30,
        email: "alice@example.com",
      });
    });

    it("should throw ModelBehaviorError for invalid JSON syntax", async () => {
      const responseSchema = z.object({
        name: z.string(),
      });

      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [
                {
                  kind: "text" as const,
                  text: '{"name": "Alice"', // Invalid JSON - missing closing brace
                },
              ],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        output: responseSchema,
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      await expect(thread.execute()).rejects.toThrow(ModelBehaviorError);
    });

    it("should throw ModelBehaviorError when JSON doesn't match schema", async () => {
      const responseSchema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [
                {
                  kind: "text" as const,
                  text: '{"name": "Alice", "age": "thirty"}', // age is string instead of number
                },
              ],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        output: responseSchema,
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      await expect(thread.execute()).rejects.toThrow(ModelBehaviorError);
    });

    it("should throw ModelBehaviorError when required fields are missing", async () => {
      const responseSchema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string(),
      });

      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [
                {
                  kind: "text" as const,
                  text: '{"name": "Alice", "age": 30}', // missing email
                },
              ],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        output: responseSchema,
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      await expect(thread.execute()).rejects.toThrow(ModelBehaviorError);
    });

    it("should handle nested structured output", async () => {
      const responseSchema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            bio: z.string(),
            age: z.number(),
          }),
        }),
        metadata: z.object({
          timestamp: z.string(),
        }),
      });

      const model = createMockModel(async (req: LanguageModelRequest) => {
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_1",
              role: "assistant" as const,
              content: [
                {
                  kind: "text" as const,
                  text: JSON.stringify({
                    user: {
                      name: "Bob",
                      profile: { bio: "Engineer", age: 25 },
                    },
                    metadata: { timestamp: "2024-01-01" },
                  }),
                },
              ],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        output: responseSchema,
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      const result = await thread.execute();

      expect(result.response).toEqual({
        user: {
          name: "Bob",
          profile: { bio: "Engineer", age: 25 },
        },
        metadata: { timestamp: "2024-01-01" },
      });
    });

    it("should continue loop when no text in assistant message", async () => {
      let callCount = 0;

      const model = createMockModel(async (req: LanguageModelRequest) => {
        callCount++;

        // First call: return empty message (no text)
        if (callCount === 1) {
          return {
            content: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [], // No content
              },
            ],
            finishReason: "stop",
            usage: {
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            },
            warnings: [],
          };
        }

        // Second call: return message with text
        return {
          content: [
            {
              kind: "message" as const,
              id: "msg_2",
              role: "assistant" as const,
              content: [{ kind: "text" as const, text: "Now I have text" }],
            },
          ],
          finishReason: "stop",
          usage: {
            inputTokens: 2,
            outputTokens: 2,
            totalTokens: 4,
          },
          warnings: [],
        };
      });

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        output: "text",
      });

      const kernl = new Kernl();
      const thread = new Thread({ agent, input: userMessage("test") });

      const result = await thread.execute();

      // Should have made 2 calls
      expect(callCount).toBe(2);
      expect(result.response).toBe("Now I have text");
      expect(thread._tick).toBe(2);
    });
  });
});
