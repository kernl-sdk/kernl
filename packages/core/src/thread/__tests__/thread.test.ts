import { describe, it, expect } from "vitest";
import { z } from "zod";

import { Thread } from "../thread";
import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { Context } from "@/context";
import { tool } from "@/tool/tool";
import { Usage } from "@/usage";

import type { LanguageModel, LanguageModelRequest } from "@/model";
import type { ThreadEvent } from "@/types/thread";

describe("Thread", () => {
  describe("Basic Execution", () => {
    it("should execute single turn and terminate with exact history", async () => {
      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Hello world" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "Hello world");

      const state = await thread.execute();

      // Access private history via type assertion for testing
      const history = (thread as any).history as ThreadEvent[];

      expect(history).toEqual([
        {
          kind: "message",
          id: expect.any(String),
          role: "user",
          content: [{ kind: "text", text: "Hello world" }],
        },
        {
          kind: "message",
          id: "msg_1",
          role: "assistant",
          content: [{ kind: "text", text: "Hello world" }],
        },
      ]);

      expect(state.tick).toBe(1);
      expect(state.modelResponses).toHaveLength(1);
    });

    it("should convert string input to UserMessage", async () => {
      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Response" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "Test input");

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];
      const firstMessage = history[0];

      expect(firstMessage).toEqual({
        kind: "message",
        id: expect.any(String),
        role: "user",
        content: [{ kind: "text", text: "Test input" }],
      });
    });

    it("should use array input as-is", async () => {
      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Response" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        version: "1.0",
      });

      const events: ThreadEvent[] = [
        {
          kind: "message",
          id: "custom_msg",
          role: "user",
          content: [{ kind: "text", text: "Custom message" }],
        },
      ];

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, events);

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];
      const firstMessage = history[0];

      expect(firstMessage).toEqual(events[0]);
    });
  });

  describe("Multi-Turn Execution", () => {
    it("should execute multi-turn with tool call and exact history", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          // First call: return tool call
          if (callCount === 1) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_1",
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "echo",
                  callId: "call_1",
                  name: "echo",
                  arguments: JSON.stringify({ text: "test" }),
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 2,
                outputTokens: 2,
                totalTokens: 4,
              }),
            };
          }

          // Second call: return final message
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_2",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Done!" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 4,
              outputTokens: 2,
              totalTokens: 6,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

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
        tools: [echoTool],
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "Use the echo tool");

      const state = await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      expect(history).toEqual([
        // Initial user message
        {
          kind: "message",
          id: expect.any(String),
          role: "user",
          content: [{ kind: "text", text: "Use the echo tool" }],
        },
        // Assistant message (tick 1)
        {
          kind: "message",
          id: "msg_1",
          role: "assistant",
          content: [],
        },
        // Tool call (tick 1)
        {
          kind: "tool-call",
          id: "echo",
          callId: "call_1",
          name: "echo",
          arguments: JSON.stringify({ text: "test" }),
        },
        // Tool result (executed after tick 1)
        {
          kind: "tool-result",
          callId: "call_1",
          name: "echo",
          status: "completed",
          result: "Echo: test",
          error: null,
        },
        // Final assistant message (tick 2)
        {
          kind: "message",
          id: "msg_2",
          role: "assistant",
          content: [{ kind: "text", text: "Done!" }],
        },
      ]);

      expect(state.tick).toBe(2);
      expect(state.modelResponses).toHaveLength(2);
    });

    it("should accumulate history across multiple turns", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          if (callCount === 1) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_1",
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "simple",
                  callId: "call_1",
                  arguments: "first",
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 2,
                outputTokens: 2,
                totalTokens: 4,
              }),
            };
          }

          if (callCount === 2) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_2",
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "simple",
                  callId: "call_2",
                  arguments: "second",
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 3,
                outputTokens: 2,
                totalTokens: 5,
              }),
            };
          }

          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_3",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "All done" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 4,
              outputTokens: 2,
              totalTokens: 6,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

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
        tools: [simpleTool],
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "Start");

      const state = await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      // Should have: 1 user msg + 3 assistant msgs + 2 tool calls + 2 tool results = 8 events
      expect(history).toHaveLength(8);
      expect(state.tick).toBe(3);
    });
  });

  describe("Tool Execution", () => {
    it("should handle tool not found with exact error in history", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          // First call: return tool call
          if (callCount === 1) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_1",
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "nonexistent",
                  callId: "call_1",
                  arguments: "{}",
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 2,
                outputTokens: 2,
                totalTokens: 4,
              }),
            };
          }

          // Second call: return terminal message
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_2",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Done" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        tools: [], // No tools available
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "test");

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      // Check that the tool result is an error
      const toolResult = history.find((e) => e.kind === "tool-result");
      expect(toolResult).toEqual({
        kind: "tool-result",
        callId: "call_1",
        name: "nonexistent",
        status: "error",
        result: undefined,
        error: "Tool nonexistent not found",
      });
    });

    it("should handle tool execution error", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          // First call: return tool call
          if (callCount === 1) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_1",
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "failing",
                  callId: "call_1",
                  arguments: "{}",
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 2,
                outputTokens: 2,
                totalTokens: 4,
              }),
            };
          }

          // Second call: return terminal message
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_2",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Done" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

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
        tools: [failingTool],
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "test");

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      const toolResult = history.find((e) => e.kind === "tool-result");
      expect(toolResult).toMatchObject({
        kind: "tool-result",
        callId: "call_1",
        name: "failing",
        status: "error",
        result: undefined,
      });
      expect((toolResult as any).error).toContain("Execution failed!");
    });

    it("should execute tool successfully with result in history", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          // First call: return tool call
          if (callCount === 1) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_1",
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "add",
                  callId: "call_1",
                  arguments: JSON.stringify({ a: 5, b: 3 }),
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 2,
                outputTokens: 2,
                totalTokens: 4,
              }),
            };
          }

          // Second call: return terminal message
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_2",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Done" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

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
        tools: [addTool],
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "Add 5 and 3");

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      const toolResult = history.find((e) => e.kind === "tool-result");
      expect(toolResult).toEqual({
        kind: "tool-result",
        callId: "call_1",
        name: "add",
        status: "completed",
        result: 8,
        error: null,
      });
    });
  });

  describe("Parallel Tool Execution", () => {
    it("should execute multiple tools in parallel with exact history", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          // First call: return multiple tool calls
          if (callCount === 1) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_1",
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "tool1",
                  callId: "call_1",
                  arguments: JSON.stringify({ value: "a" }),
                },
                {
                  kind: "tool-call" as const,
                  id: "tool2",
                  callId: "call_2",
                  arguments: JSON.stringify({ value: "b" }),
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 2,
                outputTokens: 2,
                totalTokens: 4,
              }),
            };
          }

          // Second call: return terminal message
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_2",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Done" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

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
        tools: [tool1, tool2],
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "test");

      await thread.execute();

      const history = (thread as any).history as ThreadEvent[];

      // Should have both tool results in history
      const toolResults = history.filter((e) => e.kind === "tool-result");
      expect(toolResults).toHaveLength(2);
      expect(toolResults).toEqual(
        expect.arrayContaining([
          {
            kind: "tool-result",
            callId: "call_1",
            name: "tool1",
            status: "completed",
            result: "Tool1: a",
            error: null,
          },
          {
            kind: "tool-result",
            callId: "call_2",
            name: "tool2",
            status: "completed",
            result: "Tool2: b",
            error: null,
          },
        ]),
      );
    });
  });

  describe("State Management", () => {
    it("should track tick counter correctly", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          if (callCount < 3) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: `msg_${callCount}`,
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "simple",
                  callId: `call_${callCount}`,
                  arguments: "{}",
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 2,
                outputTokens: 2,
                totalTokens: 4,
              }),
            };
          }

          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_final",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Done" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

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
        tools: [simpleTool],
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "test");

      const state = await thread.execute();

      expect(state.tick).toBe(3);
    });

    it("should accumulate model responses", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          if (callCount === 1) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_1",
                  role: "assistant" as const,
                  content: [],
                },
                {
                  kind: "tool-call" as const,
                  id: "simple",
                  callId: "call_1",
                  arguments: "{}",
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 10,
                outputTokens: 5,
                totalTokens: 15,
              }),
            };
          }

          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_2",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Done" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 20,
              outputTokens: 10,
              totalTokens: 30,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

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
        tools: [simpleTool],
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "test");

      const state = await thread.execute();

      expect(state.modelResponses).toHaveLength(2);
      expect(state.modelResponses[0].usage.inputTokens).toBe(10);
      expect(state.modelResponses[1].usage.inputTokens).toBe(20);
    });
  });

  describe("Terminal State Detection", () => {
    it("should terminate when assistant message has no tool calls", async () => {
      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_1",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Final response" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 2,
              outputTokens: 2,
              totalTokens: 4,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

      const agent = new Agent({
        id: "test",
        name: "Test",
        instructions: "Test agent",
        model,
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "test");

      const state = await thread.execute();

      expect(state.tick).toBe(1);
    });

    it("should continue when assistant message has tool calls", async () => {
      let callCount = 0;

      const model: LanguageModel = {
        async generate(req: LanguageModelRequest) {
          callCount++;

          if (callCount === 1) {
            return {
              events: [
                {
                  kind: "message" as const,
                  id: "msg_1",
                  role: "assistant" as const,
                  content: [
                    { kind: "text" as const, text: "Let me use a tool" },
                  ],
                },
                {
                  kind: "tool-call" as const,
                  id: "simple",
                  callId: "call_1",
                  arguments: "{}",
                },
              ],
              usage: new Usage({
                requests: 1,
                inputTokens: 2,
                outputTokens: 2,
                totalTokens: 4,
              }),
            };
          }

          return {
            events: [
              {
                kind: "message" as const,
                id: "msg_2",
                role: "assistant" as const,
                content: [{ kind: "text" as const, text: "Done now" }],
              },
            ],
            usage: new Usage({
              requests: 1,
              inputTokens: 3,
              outputTokens: 2,
              totalTokens: 5,
            }),
          };
        },
        stream: async function* () {
          throw new Error("Not implemented");
        },
      };

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
        tools: [simpleTool],
        version: "1.0",
      });

      const kernl = new Kernl();
      const thread = new Thread(kernl, agent, "test");

      const state = await thread.execute();

      // Should have made 2 calls - first with tool, second without
      expect(state.tick).toBe(2);
    });
  });
});
