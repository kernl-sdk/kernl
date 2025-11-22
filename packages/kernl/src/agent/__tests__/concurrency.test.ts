import { describe, it, expect } from "vitest";
import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { createMockModel } from "@/thread/__tests__/fixtures/mock-model";
import { RuntimeError } from "@/lib/error";
import { message } from "@kernl-sdk/protocol";

describe("Concurrent execution prevention", () => {
  // (TODO): this should work
  it.skip("should prevent two Agent.run() calls with same threadId", async () => {
    const model = createMockModel(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      };
    });

    const agent = new Agent({
      id: "test-agent",
      name: "Test",
      instructions: "Test",
      model,
    });

    const kernl = new Kernl();
    kernl.register(agent);

    const tid = "concurrent-test-1";

    // Start first run
    const run1 = agent.run("First", { threadId: tid });

    // Try second run immediately
    await expect(agent.run("Second", { threadId: tid })).rejects.toThrow(
      RuntimeError,
    );

    await expect(agent.run("Second", { threadId: tid })).rejects.toThrow(
      /already running/,
    );

    // Wait for first to complete
    await run1;

    // Now third should work
    await expect(agent.run("Third", { threadId: tid })).resolves.toBeDefined();
  });

  // (TODO): this should work
  it.skip("should prevent Agent.stream() on thread already in Agent.run()", async () => {
    const model = createMockModel(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      };
    });

    const agent = new Agent({
      id: "test-agent",
      name: "Test",
      instructions: "Test",
      model,
    });

    const kernl = new Kernl();
    kernl.register(agent);

    const tid = "concurrent-test-2";

    // Start run()
    const runPromise = agent.run("Test", { threadId: tid });

    // Try to stream same thread
    const streamIterable = agent.stream("Test", { threadId: tid });
    const streamIterator = streamIterable[Symbol.asyncIterator]();
    await expect(streamIterator.next()).rejects.toThrow(RuntimeError);
    await expect(streamIterator.next()).rejects.toThrow(/already running/);

    await runPromise;
  });

  it("should prevent Agent.run() on thread already in Agent.stream()", async () => {
    const model = createMockModel(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      };
    });

    const agent = new Agent({
      id: "test-agent",
      name: "Test",
      instructions: "Test",
      model,
    });

    const kernl = new Kernl();
    kernl.register(agent);

    const tid = "concurrent-test-3";

    // Start stream() but don't await - start consuming
    const streamIterator = agent.stream("Test", { threadId: tid });
    const streamPromise = (async () => {
      for await (const _event of streamIterator) {
        // consume
      }
    })();

    // Give stream time to start
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Try to run() same thread
    await expect(agent.run("Test", { threadId: tid })).rejects.toThrow(
      RuntimeError,
    );

    await streamPromise;
  });

  it("should allow different threadIds to run concurrently", async () => {
    const model = createMockModel(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        content: [message({ role: "assistant", text: "Done" })],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      };
    });

    const agent = new Agent({
      id: "test-agent",
      name: "Test",
      instructions: "Test",
      model,
    });

    const kernl = new Kernl();
    kernl.register(agent);

    // These should all succeed
    const results = await Promise.all([
      agent.run("Test 1", { threadId: "thread-1" }),
      agent.run("Test 2", { threadId: "thread-2" }),
      agent.run("Test 3", { threadId: "thread-3" }),
    ]);

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.response === "Done")).toBe(true);
  });

  it("should allow same threadId after previous run completes", async () => {
    const model = createMockModel(async () => ({
      content: [message({ role: "assistant", text: "Done" })],
      finishReason: "stop",
      usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      warnings: [],
    }));

    const agent = new Agent({
      id: "test-agent",
      name: "Test",
      instructions: "Test",
      model,
    });

    const kernl = new Kernl();
    kernl.register(agent);

    const tid = "reuse-thread";

    // First run
    const result1 = await agent.run("First", { threadId: tid });
    expect(result1.response).toBe("Done");

    // Second run (should work since first completed)
    const result2 = await agent.run("Second", { threadId: tid });
    expect(result2.response).toBe("Done");

    // Third run
    const result3 = await agent.run("Third", { threadId: tid });
    expect(result3.response).toBe("Done");
  });
});
