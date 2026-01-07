// packages/kernl/src/handoff/__tests__/integration.test.ts
import { describe, it, expect, vi } from "vitest";
import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { createMockModel } from "@/thread/__tests__/fixtures/mock-model";
import { MaxHandoffsExceededError } from "../errors";
import { message, type ToolCall } from "@kernl-sdk/protocol";
import { IN_PROGRESS } from "@kernl-sdk/protocol";

describe("Handoff Integration", () => {
  // Helper to create mock model that triggers handoff then completes
  function createHandoffModel(handoffTo: string, handoffMessage: string) {
    let hasCalledTool = false;
    return createMockModel(async (req: any) => {
      // Check if there's a tool-result in the input (means we already called the tool)
      const hasToolResult = req.input?.some((i: any) => i.kind === "tool-result");

      if (hasToolResult || hasCalledTool) {
        // After tool execution: return a final response
        return {
          content: [message({ role: "assistant", text: "Handoff complete" })],
          finishReason: "stop",
          usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
          warnings: [],
        };
      }

      // First call: trigger the handoff tool
      const handoffTool = req.tools?.find((t: any) => t.name === "handoff");
      if (handoffTool) {
        hasCalledTool = true;
        const toolCallItem: ToolCall = {
          kind: "tool-call",
          callId: "call-1",
          toolId: "handoff",
          state: IN_PROGRESS,
          arguments: JSON.stringify({ to: handoffTo, message: handoffMessage }),
        };
        return {
          content: [toolCallItem],
          finishReason: "tool-calls",
          usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
          warnings: [],
        };
      }

      // No handoff tool - just return text
      return {
        content: [message({ role: "assistant", text: "No handoff tool available" })],
        finishReason: "stop",
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        warnings: [],
      };
    });
  }

  // Helper to create mock model that returns final response
  function createFinalModel(response: string) {
    return createMockModel(async () => ({
      content: [message({ role: "assistant", text: response })],
      finishReason: "stop",
      usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
      warnings: [],
    }));
  }

  it("should execute single agent without handoff", async () => {
    const model = createFinalModel("Hello from solo agent");
    const agent = new Agent({
      id: "solo",
      name: "Solo",
      model,
      instructions: "You work alone",
    });

    const kernl = new Kernl();
    kernl.register(agent);

    const result = await kernl.run("solo", "Do something");

    expect(result.output).toBe("Hello from solo agent");
    expect(result.finalAgent).toBe("solo");
    expect(result.handoffChain).toHaveLength(0);
  });

  it("should handle two-agent handoff", async () => {
    const researcherModel = createHandoffModel("writer", "Research findings...");
    const writerModel = createFinalModel("Final article based on research");

    const researcher = new Agent({
      id: "researcher",
      name: "Researcher",
      model: researcherModel,
      instructions: "Research and hand off to writer",
    });

    const writer = new Agent({
      id: "writer",
      name: "Writer",
      model: writerModel,
      instructions: "Write based on research",
    });

    const kernl = new Kernl();
    kernl.register(researcher, writer);

    const result = await kernl.run("researcher", "Write about AI");

    expect(result.output).toBe("Final article based on research");
    expect(result.finalAgent).toBe("writer");
    expect(result.handoffChain).toHaveLength(1);
    expect(result.handoffChain[0].from).toBe("researcher");
    expect(result.handoffChain[0].to).toBe("writer");
  });

  it("should emit agent_handoff hook", async () => {
    const researcherModel = createHandoffModel("writer", "Findings");
    const writerModel = createFinalModel("Done");

    const researcher = new Agent({
      id: "researcher",
      name: "Researcher",
      model: researcherModel,
      instructions: "Research",
    });

    const writer = new Agent({
      id: "writer",
      name: "Writer",
      model: writerModel,
      instructions: "Write",
    });

    const kernl = new Kernl();
    kernl.register(researcher, writer);

    const handoffListener = vi.fn();
    kernl.on("agent_handoff", handoffListener);

    await kernl.run("researcher", "Test");

    expect(handoffListener).toHaveBeenCalledTimes(1);
    expect(handoffListener).toHaveBeenCalledWith(
      expect.anything(), // context
      researcher,
      expect.objectContaining({ to: "writer", from: "researcher" })
    );
  });

  it("should enforce maxHandoffs limit", async () => {
    // Create a model that ALWAYS triggers handoff (never completes normally)
    // The only way to stop is the maxHandoffs limit
    function createPingPongModel(handoffTo: string, handoffMessage: string) {
      return createMockModel(async (req: any) => {
        // Check if there's a tool-result in the input (means we're in the second tick)
        const hasToolResult = req.input?.some((i: any) => i.kind === "tool-result");

        if (hasToolResult) {
          // After tool execution, return response that looks like completion
          // but actually just allows the handoff to be processed
          return {
            content: [message({ role: "assistant", text: "Handing off..." })],
            finishReason: "stop",
            usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
            warnings: [],
          };
        }

        // Always trigger handoff on first tick
        const handoffTool = req.tools?.find((t: any) => t.name === "handoff");
        if (handoffTool) {
          const toolCallItem: ToolCall = {
            kind: "tool-call",
            callId: `call-${Date.now()}-${Math.random()}`,
            toolId: "handoff",
            state: IN_PROGRESS,
            arguments: JSON.stringify({ to: handoffTo, message: handoffMessage }),
          };
          return {
            content: [toolCallItem],
            finishReason: "tool-calls",
            usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
            warnings: [],
          };
        }

        return {
          content: [message({ role: "assistant", text: "No handoff tool" })],
          finishReason: "stop",
          usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
          warnings: [],
        };
      });
    }

    // Create agents that ping-pong forever
    const agentA = new Agent({
      id: "agent-a",
      name: "Agent A",
      model: createPingPongModel("agent-b", "Passing to B"),
      instructions: "Pass to B",
    });

    const agentB = new Agent({
      id: "agent-b",
      name: "Agent B",
      model: createPingPongModel("agent-a", "Passing to A"),
      instructions: "Pass to A",
    });

    const kernl = new Kernl();
    kernl.register(agentA, agentB);

    await expect(
      kernl.run("agent-a", "Start", { maxHandoffs: 3 })
    ).rejects.toThrow(MaxHandoffsExceededError);
  });
});
