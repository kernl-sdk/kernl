import { describe, it, expect } from "vitest";
import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { createMockModel } from "@/thread/__tests__/fixtures/mock-model";
import { MisconfiguredError } from "@/error";
import { message } from "@kernl-sdk/protocol";
import { InMemoryStorage } from "@/storage/in-memory";

describe("Agent.run() lifecycle", () => {
  describe("Storage wiring", () => {
    it("should pass storage to new Thread when creating", async () => {
      const storage = new InMemoryStorage();
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

      const kernl = new Kernl({ storage: { db: storage } });
      kernl.register(agent);

      await agent.run("Hello");

      // Verify storage was used - check that events were appended
      const threads = await storage.threads.list();
      expect(threads).toHaveLength(1);

      const history = await storage.threads.history(threads[0].tid);
      expect(history.length).toBeGreaterThan(0);
    });

    it("should work without storage (persist is no-op)", async () => {
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

      const kernl = new Kernl(); // No storage
      kernl.register(agent);

      const result = await agent.run("Hello");

      // Should complete successfully
      expect(result.response).toBe("Done");
      expect(result.state).toBe("stopped");
    });

    it("should throw MisconfiguredError when agent not bound to kernl", async () => {
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

      // Don't register with kernl
      await expect(agent.run("Hello")).rejects.toThrow(MisconfiguredError);
      await expect(agent.run("Hello")).rejects.toThrow(/not bound to kernl/);
    });
  });

  describe("New thread path", () => {
    it("should create new thread when no threadId provided", async () => {
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

      const result = await agent.run("Hello");

      expect(result.response).toBe("Done");
      expect(result.state).toBe("stopped");
    });

    it("should create new thread when threadId not found in storage", async () => {
      const storage = new InMemoryStorage();
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

      const kernl = new Kernl({ storage: { db: storage } });
      kernl.register(agent);

      await agent.run("Hello", { threadId: "non-existent" });

      // Should have created new thread with the specified tid
      const threads = await storage.threads.list();
      expect(threads).toHaveLength(1);
      expect(threads[0].tid).toBe("non-existent");
    });

    it("should resume existing thread from storage", async () => {
      const storage = new InMemoryStorage();
      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Response" })],
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

      const kernl = new Kernl({ storage: { db: storage } });
      kernl.register(agent);

      const tid = "resume-thread";

      // First run
      await agent.run("First", { threadId: tid });

      const firstHistory = await storage.threads.history(tid);
      const firstEventCount = firstHistory.length;
      expect(firstEventCount).toBeGreaterThanOrEqual(2); // user + assistant

      // Second run (resume)
      await agent.run("Second", { threadId: tid });

      const secondHistory = await storage.threads.history(tid);
      const secondEventCount = secondHistory.length;

      // Should have more events (added user + assistant from second run)
      expect(secondEventCount).toBeGreaterThanOrEqual(firstEventCount + 2);
    });
  });

  describe("String vs array input", () => {
    it("should handle string input (converted to message)", async () => {
      const storage = new InMemoryStorage();
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

      const kernl = new Kernl({ storage: { db: storage } });
      kernl.register(agent);

      await agent.run("Hello world");

      const threads = await storage.threads.list();
      const events = await storage.threads.history(threads[0].tid);

      // Find the user message (first event should be user message)
      const userMessage = events.find((e: any) => e.role === "user");
      expect(userMessage).toMatchObject({
        kind: "message",
        role: "user",
        content: [{ kind: "text", text: "Hello world" }],
      });
    });

    it("should handle array input (used as-is)", async () => {
      const storage = new InMemoryStorage();
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

      const kernl = new Kernl({ storage: { db: storage } });
      kernl.register(agent);

      const input = [message({ role: "user", text: "Custom" })];
      await agent.run(input);

      const threads = await storage.threads.list();
      const events = await storage.threads.history(threads[0].tid);

      // Find the user message
      const userMessage = events.find((e: any) => e.role === "user");
      expect(userMessage).toMatchObject({
        kind: "message",
        role: "user",
        content: [{ kind: "text", text: "Custom" }],
      });
    });
  });
});

describe("Agent.stream() lifecycle", () => {
  it("should yield stream-start event first", async () => {
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

    const events = [];
    for await (const event of agent.stream("Hello")) {
      events.push(event);
    }

    expect(events[0]).toEqual({ kind: "stream.start" });
  });

  it("should have same persistence behavior as run()", async () => {
    const storage = new InMemoryStorage();
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

    const kernl = new Kernl({ storage: { db: storage } });
    kernl.register(agent);

    const events = [];
    for await (const event of agent.stream("Hello")) {
      events.push(event);
    }

    // Should have persisted like run()
    const threads = await storage.threads.list();
    expect(threads).toHaveLength(1);

    const history = await storage.threads.history(threads[0].tid);
    expect(history.length).toBeGreaterThan(0);

    // Should have streamed events
    expect(events).toEqual(
      expect.arrayContaining([
        { kind: "stream.start" },
        expect.objectContaining({ kind: "message" }),
      ]),
    );
  });
});

describe("Agent.threads helper", () => {
  it("should throw MisconfiguredError when agent is not bound to kernl", () => {
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

    expect(() => agent.threads).toThrow(MisconfiguredError);
  });

  it("should list only threads for this agent", async () => {
    const storage = new InMemoryStorage();
    const model = createMockModel(async () => ({
      content: [message({ role: "assistant", text: "Done" })],
      finishReason: "stop",
      usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
      warnings: [],
    }));

    const agentA = new Agent({
      id: "agent-a",
      name: "Agent A",
      instructions: "Test",
      model,
    });

    const agentB = new Agent({
      id: "agent-b",
      name: "Agent B",
      instructions: "Test",
      model,
    });

    const kernl = new Kernl({ storage: { db: storage } });
    kernl.register(agentA);
    kernl.register(agentB);

    await agentA.run("Hello from A");
    await agentB.run("Hello from B");
    await agentB.run("Another from B");

    const threadsAPage = await agentA.threads.list();
    const threadsBPage = await agentB.threads.list();

    const threadsA = await threadsAPage.collect();
    const threadsB = await threadsBPage.collect();

    expect(threadsA).toHaveLength(1);
    expect(threadsB.length).toBeGreaterThanOrEqual(2);

    for (const thread of threadsA) {
      expect(thread.agentId).toBe("agent-a");
    }

    for (const thread of threadsB) {
      expect(thread.agentId).toBe("agent-b");
    }
  });

  it("should expose thread history via threads.history()", async () => {
    const storage = new InMemoryStorage();
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

    const kernl = new Kernl({ storage: { db: storage } });
    kernl.register(agent);

    await agent.run("Hello");

    const threadsPage = await agent.threads.list();
    const threads = await threadsPage.collect();
    expect(threads).toHaveLength(1);

    const tid = threads[0].tid;
    const events = await agent.threads.history(tid, { order: "asc" });

    // Expect exactly two events: user message then assistant message
    expect(events).toHaveLength(2);

    const [userEvent, assistantEvent] = events;

    // Common headers
    expect(userEvent.tid).toBe(tid);
    expect(assistantEvent.tid).toBe(tid);
    expect(userEvent.seq).toBe(0);
    expect(assistantEvent.seq).toBe(1);

    // User message
    expect(userEvent.kind).toBe("message");
    // @ts-expect-error ThreadEvent extends LanguageModelItem at runtime
    expect(userEvent.role).toBe("user");
    // @ts-expect-error ThreadEvent extends LanguageModelItem at runtime
    expect(userEvent.content).toEqual([
      { kind: "text", text: "Hello" },
    ]);

    // Assistant message
    expect(assistantEvent.kind).toBe("message");
    // @ts-expect-error ThreadEvent extends LanguageModelItem at runtime
    expect(assistantEvent.role).toBe("assistant");
    // @ts-expect-error ThreadEvent extends LanguageModelItem at runtime
    expect(assistantEvent.content).toEqual([
      { kind: "text", text: "Done" },
    ]);
  });
});

