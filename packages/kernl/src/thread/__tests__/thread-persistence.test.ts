import { describe, it, expect } from "vitest";
import { z } from "zod";

import { Agent } from "@/agent";
import { Thread } from "@/thread";
import { tool, FunctionToolkit } from "@/tool";
import { createMockModel } from "./fixtures/mock-model";
import { message, RUNNING, STOPPED, IN_PROGRESS, COMPLETED } from "@kernl-sdk/protocol";
import { InMemoryStorage } from "@/storage/in-memory";

describe("Thread Persistence", () => {
  describe("Per-tick persistence (no tools)", () => {
    it.skip("should persist on first tick: insert thread + append events + update state", async () => {
      // TODO: Enable once InMemoryStorage is implemented
      // const storage = new InMemoryStorage();
      // const model = createMockModel(async () => ({
      //   content: [message({ role: "assistant", text: "Response" })],
      //   finishReason: "stop",
      //   usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //   warnings: [],
      // }));
      //
      // const agent = new Agent({
      //   id: "test-agent",
      //   name: "Test",
      //   instructions: "Test",
      //   model,
      // });
      //
      // const thread = new Thread({
      //   agent,
      //   input: [message({ role: "user", text: "Hello" })],
      //   storage: storage.threads,
      // });
      //
      // await thread.execute();
      //
      // // Verify insert called once (thread record created)
      // expect(storage.calls.insert).toHaveLength(1);
      // expect(storage.calls.insert[0].id).toBe(thread.tid);
      // expect(storage.calls.insert[0].agentId).toBe("test-agent");
      //
      // // Verify state updates (RUNNING → STOPPED)
      // expect(storage.calls.update.length).toBeGreaterThanOrEqual(2);
      // const runningUpdate = storage.calls.update[0];
      // expect(runningUpdate.patch.state).toBe(RUNNING);
      //
      // const stoppedUpdate = storage.calls.update[storage.calls.update.length - 1];
      // expect(stoppedUpdate.patch.state).toBe(STOPPED);
      //
      // // Verify append called with events from tick
      // expect(storage.calls.append.length).toBeGreaterThan(0);
      // const allAppendedEvents = storage.calls.append.flat();
      //
      // // Should have user message + assistant message
      // expect(allAppendedEvents.length).toBeGreaterThanOrEqual(2);
      // expect(allAppendedEvents).toEqual(
      //   expect.arrayContaining([
      //     expect.objectContaining({ kind: "message", role: "user" }),
      //     expect.objectContaining({ kind: "message", role: "assistant" }),
      //   ])
      // );
      //
      // // Verify tick and seq are correct
      // expect(thread._tick).toBe(1);
      // expect(thread._seq).toBeGreaterThanOrEqual(1);
    });

    it.skip("should persist events with monotonically increasing seq", async () => {
      // TODO: Enable once InMemoryStorage is implemented
      // const storage = new InMemoryStorage();
      // let callCount = 0;
      //
      // const model = createMockModel(async () => {
      //   callCount++;
      //   if (callCount === 1) {
      //     return {
      //       content: [
      //         message({ role: "assistant", text: "" }),
      //         { kind: "tool.call", toolId: "test", callId: "call_1", state: IN_PROGRESS, arguments: "{}" },
      //       ],
      //       finishReason: "stop",
      //       usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //       warnings: [],
      //     };
      //   }
      //   return {
      //     content: [message({ role: "assistant", text: "Done" })],
      //     finishReason: "stop",
      //     usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //     warnings: [],
      //   };
      // });
      //
      // const testTool = tool({
      //   id: "test",
      //   description: "Test",
      //   parameters: undefined,
      //   execute: async () => "result",
      // });
      //
      // const agent = new Agent({
      //   id: "test-agent",
      //   name: "Test",
      //   instructions: "Test",
      //   model,
      //   toolkits: [new FunctionToolkit({ id: "tools", tools: [testTool] })],
      // });
      //
      // const thread = new Thread({
      //   agent,
      //   input: [message({ role: "user", text: "Test" })],
      //   storage: storage.threads,
      // });
      //
      // await thread.execute();
      //
      // // Verify all events have monotonically increasing seq
      // const allEvents = storage.calls.append.flat();
      // const seqNumbers = allEvents.map(e => e.seq);
      //
      // expect(seqNumbers).toEqual([...seqNumbers].sort((a, b) => a - b));
      // expect(new Set(seqNumbers).size).toBe(seqNumbers.length); // No duplicates
      // expect(seqNumbers[0]).toBe(0); // Starts at 0
      // expect(seqNumbers[seqNumbers.length - 1]).toBe(seqNumbers.length - 1); // No gaps
    });
  });

  describe("Per-tick persistence (with tools)", () => {
    it.skip("should persist model events and tool results together in same append", async () => {
      // TODO: Enable once InMemoryStorage is implemented
      // const storage = new InMemoryStorage();
      // let callCount = 0;
      //
      // const model = createMockModel(async () => {
      //   callCount++;
      //   if (callCount === 1) {
      //     return {
      //       content: [
      //         message({ role: "assistant", text: "" }),
      //         { kind: "tool.call", toolId: "echo", callId: "call_1", state: IN_PROGRESS, arguments: '{"text":"test"}' },
      //       ],
      //       finishReason: "stop",
      //       usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //       warnings: [],
      //     };
      //   }
      //   return {
      //     content: [message({ role: "assistant", text: "Done" })],
      //     finishReason: "stop",
      //     usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //     warnings: [],
      //   };
      // });
      //
      // const echoTool = tool({
      //   id: "echo",
      //   description: "Echo",
      //   parameters: z.object({ text: z.string() }),
      //   execute: async (ctx, { text }) => `Echo: ${text}`,
      // });
      //
      // const agent = new Agent({
      //   id: "test-agent",
      //   name: "Test",
      //   instructions: "Test",
      //   model,
      //   toolkits: [new FunctionToolkit({ id: "tools", tools: [echoTool] })],
      // });
      //
      // const thread = new Thread({
      //   agent,
      //   input: [message({ role: "user", text: "Test" })],
      //   storage: storage.threads,
      // });
      //
      // await thread.execute();
      //
      // // Find the append call for tick 1 (should include model message, tool-call, and tool-result)
      // const tick1Events = storage.calls.append.find(batch =>
      //   batch.some(e => e.kind === "tool.result")
      // );
      //
      // expect(tick1Events).toBeDefined();
      // expect(tick1Events!.length).toBeGreaterThanOrEqual(3);
      //
      // // Verify tick 1 has: assistant message, tool-call, tool-result
      // expect(tick1Events).toEqual(
      //   expect.arrayContaining([
      //     expect.objectContaining({ kind: "message", role: "assistant" }),
      //     expect.objectContaining({ kind: "tool.call", toolId: "echo" }),
      //     expect.objectContaining({ kind: "tool.result", toolId: "echo", result: "Echo: test" }),
      //   ])
      // );
    });
  });

  describe("Run lifecycle state transitions", () => {
    it.skip("should persist RUNNING state at start, STOPPED at finish", async () => {
      // TODO: Enable once InMemoryStorage is implemented
      // const storage = new InMemoryStorage();
      // const model = createMockModel(async () => ({
      //   content: [message({ role: "assistant", text: "Done" })],
      //   finishReason: "stop",
      //   usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //   warnings: [],
      // }));
      //
      // const agent = new Agent({
      //   id: "test-agent",
      //   name: "Test",
      //   instructions: "Test",
      //   model,
      // });
      //
      // const thread = new Thread({
      //   agent,
      //   input: [message({ role: "user", text: "Test" })],
      //   storage: storage.threads,
      // });
      //
      // const events = [];
      // for await (const event of thread.stream()) {
      //   events.push(event);
      // }
      //
      // // First state update should be RUNNING
      // expect(storage.calls.update[0].patch.state).toBe(RUNNING);
      //
      // // Last state update should be STOPPED
      // const lastUpdate = storage.calls.update[storage.calls.update.length - 1];
      // expect(lastUpdate.patch.state).toBe(STOPPED);
      //
      // // Verify stream-start event
      // expect(events[0]).toEqual({ kind: "stream.start" });
    });

    it.skip("should persist STOPPED state even on model error", async () => {
      // TODO: Enable once InMemoryStorage is implemented
      // const storage = new InMemoryStorage();
      // const model = createMockModel(async () => {
      //   throw new Error("Model error");
      // });
      //
      // const agent = new Agent({
      //   id: "test-agent",
      //   name: "Test",
      //   instructions: "Test",
      //   model,
      // });
      //
      // const thread = new Thread({
      //   agent,
      //   input: [message({ role: "user", text: "Test" })],
      //   storage: storage.threads,
      // });
      //
      // // Execute should complete without throwing (error becomes event)
      // const events = [];
      // for await (const event of thread.stream()) {
      //   events.push(event);
      // }
      //
      // // Should have error event
      // expect(events.some(e => e.kind === "error")).toBe(true);
      //
      // // Should still transition to STOPPED
      // const lastUpdate = storage.calls.update[storage.calls.update.length - 1];
      // expect(lastUpdate.patch.state).toBe(STOPPED);
    });
  });

  describe("Storage failure propagation", () => {
    it.skip("should throw and halt execution when insert fails", async () => {
      // TODO: Enable once InMemoryStorage is implemented
      // const storage = new InMemoryStorage();
      // storage.shouldFailOnPersist = true;
      //
      // const model = createMockModel(async () => ({
      //   content: [message({ role: "assistant", text: "Done" })],
      //   finishReason: "stop",
      //   usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //   warnings: [],
      // }));
      //
      // const agent = new Agent({
      //   id: "test-agent",
      //   name: "Test",
      //   instructions: "Test",
      //   model,
      // });
      //
      // const thread = new Thread({
      //   agent,
      //   input: [message({ role: "user", text: "Test" })],
      //   storage: storage.threads,
      // });
      //
      // // Should reject with storage error
      // await expect(thread.execute()).rejects.toThrow("Simulated insert failure");
      //
      // // Should not have persisted events after insert failure
      // expect(storage.calls.append).toHaveLength(0);
    });

    it.skip("should throw and halt execution when append fails", async () => {
      // TODO: Enable once InMemoryStorage is implemented
      // const storage = new InMemoryStorage();
      //
      // const model = createMockModel(async () => ({
      //   content: [message({ role: "assistant", text: "Done" })],
      //   finishReason: "stop",
      //   usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //   warnings: [],
      // }));
      //
      // const agent = new Agent({
      //   id: "test-agent",
      //   name: "Test",
      //   instructions: "Test",
      //   model,
      // });
      //
      // const thread = new Thread({
      //   agent,
      //   input: [message({ role: "user", text: "Test" })],
      //   storage: storage.threads,
      // });
      //
      // // Fail after insert succeeds
      // storage.shouldFailOnAppend = true;
      //
      // await expect(thread.execute()).rejects.toThrow("Simulated append failure");
    });

    it.skip("should not retry persist on failure (fail hard)", async () => {
      // TODO: Enable once InMemoryStorage is implemented
      // const storage = new InMemoryStorage();
      // storage.shouldFailOnPersist = true;
      //
      // const model = createMockModel(async () => ({
      //   content: [message({ role: "assistant", text: "Done" })],
      //   finishReason: "stop",
      //   usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      //   warnings: [],
      // }));
      //
      // const agent = new Agent({
      //   id: "test-agent",
      //   name: "Test",
      //   instructions: "Test",
      //   model,
      // });
      //
      // const thread = new Thread({
      //   agent,
      //   input: [message({ role: "user", text: "Test" })],
      //   storage: storage.threads,
      // });
      //
      // await expect(thread.execute()).rejects.toThrow();
      //
      // // Should have only tried once
      // expect(storage.calls.insert).toHaveLength(1);
    });
  });
});
