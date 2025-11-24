import { describe, it, expect, beforeEach } from "vitest";
import { STOPPED, RUNNING, DEAD, IN_PROGRESS } from "@kernl-sdk/protocol";

import { InMemoryStorage, InMemoryThreadStore } from "../in-memory";
import { Agent } from "@/agent";
import { Thread } from "@/thread";
import type { NewThread } from "@/storage";
import type { ThreadEvent } from "@/types/thread";
import { createMockModel } from "@/thread/__tests__/fixtures/mock-model";

describe("InMemoryThreadStore", () => {
  let store: InMemoryThreadStore;
  let agent: Agent;
  let model: ReturnType<typeof createMockModel>;

  beforeEach(() => {
    store = new InMemoryThreadStore();
    model = createMockModel(async () => ({
      content: [
        {
          kind: "message" as const,
          id: "msg_1",
          role: "assistant" as const,
          content: [{ kind: "text" as const, text: "Hello" }],
        },
      ],
      finishReason: "stop",
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      warnings: [],
    }));

    agent = new Agent({
      id: "test-agent",
      name: "Test Agent",
      instructions: "Test instructions",
      model,
    });

    // Bind registries
    const agents = new Map([[agent.id, agent]]);
    const models = new Map([[`${model.provider}/${model.modelId}`, model]]);
    store.bind({ agents, models });
  });

  describe("insert", () => {
    it("should insert a new thread", async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
        context: { foo: "bar" },
      };

      const thread = await store.insert(newThread);

      expect(thread).toBeInstanceOf(Thread);
      expect(thread.tid).toBe("thread-1");
      expect(thread._tick).toBe(0);
      expect(thread.state).toBe(STOPPED);
    });

    it("should use provided defaults", async () => {
      const createdAt = new Date("2024-01-01");
      const newThread: NewThread = {
        id: "thread-2",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
        tick: 5,
        state: RUNNING,
        createdAt,
      };

      const thread = await store.insert(newThread);

      expect(thread._tick).toBe(5);
      expect(thread.state).toBe(RUNNING);
    });
  });

  describe("get", () => {
    it("should get a thread by id", async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
      };

      await store.insert(newThread);
      const thread = await store.get("thread-1");

      expect(thread).not.toBeNull();
      expect(thread?.tid).toBe("thread-1");
    });

    it("should return null for non-existent thread", async () => {
      const thread = await store.get("non-existent");
      expect(thread).toBeNull();
    });

    it("should include history when requested", async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
      };

      await store.insert(newThread);

      const events: ThreadEvent[] = [
        {
          kind: "message",
          id: "msg-1",
          tid: "thread-1",
          seq: 0,
          timestamp: new Date(),
          role: "user",
          content: [{ kind: "text", text: "Hello" }],
          metadata: {},
        },
      ];

      await store.append(events);

      const thread = await store.get("thread-1", { history: true });
      expect(thread).not.toBeNull();

      // Access private history for testing
      const history = (thread as any).history as ThreadEvent[];
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe("msg-1");
    });
  });

  describe("update", () => {
    it("should update thread state", async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
      };

      await store.insert(newThread);
      const updated = await store.update("thread-1", {
        state: DEAD,
        tick: 10,
      });

      expect(updated.state).toBe(DEAD);
      expect(updated._tick).toBe(10);
    });

    it("should throw on non-existent thread", async () => {
      await expect(
        store.update("non-existent", { state: DEAD }),
      ).rejects.toThrow("Thread non-existent not found");
    });
  });

  describe("delete", () => {
    it("should delete a thread and its events", async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
      };

      await store.insert(newThread);
      await store.append([
        {
          kind: "message",
          id: "msg-1",
          tid: "thread-1",
          seq: 0,
          timestamp: new Date(),
          role: "user",
          content: [{ kind: "text", text: "Hello" }],
          metadata: {},
        },
      ]);

      await store.delete("thread-1");

      const thread = await store.get("thread-1");
      const history = await store.history("thread-1");

      expect(thread).toBeNull();
      expect(history).toHaveLength(0);
    });
  });

  describe("append", () => {
    it("should append events to thread history", async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
      };

      await store.insert(newThread);

      const events: ThreadEvent[] = [
        {
          kind: "message",
          id: "msg-1",
          tid: "thread-1",
          seq: 0,
          timestamp: new Date(),
          role: "user",
          content: [{ kind: "text", text: "Hello" }],
          metadata: {},
        },
        {
          kind: "message",
          id: "msg-2",
          tid: "thread-1",
          seq: 1,
          timestamp: new Date(),
          role: "assistant",
          content: [{ kind: "text", text: "Hi" }],
          metadata: {},
        },
      ];

      await store.append(events);

      const history = await store.history("thread-1");
      expect(history).toHaveLength(2);
      expect(history[0].seq).toBe(0);
      expect(history[1].seq).toBe(1);
    });

    it("should be idempotent on event.id", async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
      };

      await store.insert(newThread);

      const event: ThreadEvent = {
        kind: "message",
        id: "msg-1",
        tid: "thread-1",
        seq: 0,
        timestamp: new Date(),
        role: "user",
        content: [{ kind: "text", text: "Hello" }],
        metadata: {},
      };

      await store.append([event]);
      await store.append([event]); // duplicate

      const history = await store.history("thread-1");
      expect(history).toHaveLength(1);
    });

    it("should maintain seq ordering", async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
      };

      await store.insert(newThread);

      // Insert out of order
      await store.append([
        {
          kind: "message",
          id: "msg-2",
          tid: "thread-1",
          seq: 2,
          timestamp: new Date(),
          role: "user",
          content: [{ kind: "text", text: "Second" }],
          metadata: {},
        },
      ]);

      await store.append([
        {
          kind: "message",
          id: "msg-1",
          tid: "thread-1",
          seq: 1,
          timestamp: new Date(),
          role: "user",
          content: [{ kind: "text", text: "First" }],
          metadata: {},
        },
      ]);

      const history = await store.history("thread-1");
      expect(history).toHaveLength(2);
      expect(history[0].seq).toBe(1);
      expect(history[1].seq).toBe(2);
    });
  });

  describe("history", () => {
    beforeEach(async () => {
      const newThread: NewThread = {
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
      };

      await store.insert(newThread);

      await store.append([
        {
          kind: "message",
          id: "msg-1",
          tid: "thread-1",
          seq: 0,
          timestamp: new Date(),
          role: "user",
          content: [{ kind: "text", text: "First" }],
          metadata: {},
        },
        {
          kind: "message",
          id: "msg-2",
          tid: "thread-1",
          seq: 1,
          timestamp: new Date(),
          role: "assistant",
          content: [{ kind: "text", text: "Second" }],
          metadata: {},
        },
        {
          kind: "message",
          id: "msg-3",
          tid: "thread-1",
          seq: 2,
          timestamp: new Date(),
          role: "user",
          content: [{ kind: "text", text: "Third" }],
          metadata: {},
        },
      ]);
    });

    it("should return all events by default", async () => {
      const history = await store.history("thread-1");
      expect(history).toHaveLength(3);
    });

    it("should filter by after seq", async () => {
      const history = await store.history("thread-1", { after: 0 });
      expect(history).toHaveLength(2);
      expect(history[0].seq).toBe(1);
    });

    it("should filter by kinds", async () => {
      await store.append([
        {
          kind: "tool-call",
          id: "tc-1",
          tid: "thread-1",
          seq: 3,
          timestamp: new Date(),
          callId: "call-1",
          toolId: "test-tool",
          state: IN_PROGRESS,
          arguments: "{}",
          metadata: {},
        },
      ]);

      const history = await store.history("thread-1", {
        kinds: ["tool-call"],
      });
      expect(history).toHaveLength(1);
      expect(history[0].kind).toBe("tool-call");
    });

    it("should apply limit", async () => {
      const history = await store.history("thread-1", { limit: 2 });
      expect(history).toHaveLength(2);
    });

    it("should support desc ordering", async () => {
      const history = await store.history("thread-1", { order: "desc" });
      expect(history).toHaveLength(3);
      expect(history[0].seq).toBe(2);
      expect(history[2].seq).toBe(0);
    });
  });

  describe("list", () => {
    beforeEach(async () => {
      await store.insert({
        id: "thread-1",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
        state: STOPPED,
        createdAt: new Date("2024-01-01"),
      });

      await store.insert({
        id: "thread-2",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
        state: RUNNING,
        createdAt: new Date("2024-01-02"),
      });

      await store.insert({
        id: "thread-3",
        namespace: "test",
        agentId: agent.id,
        model: `${model.provider}/${model.modelId}`,
        state: DEAD,
        createdAt: new Date("2024-01-03"),
      });
    });

    it("should list all threads", async () => {
      const threads = await store.list();
      expect(threads).toHaveLength(3);
    });

    it("should filter by state", async () => {
      const threads = await store.list({
        filter: { state: RUNNING },
      });
      expect(threads).toHaveLength(1);
      expect(threads[0].tid).toBe("thread-2");
    });

    it("should filter by multiple states", async () => {
      const threads = await store.list({
        filter: { state: [STOPPED, DEAD] },
      });
      expect(threads).toHaveLength(2);
    });

    it("should filter by agentId", async () => {
      const threads = await store.list({
        filter: { agentId: agent.id },
      });
      expect(threads).toHaveLength(3);
    });

    it("should filter by createdAfter", async () => {
      const threads = await store.list({
        filter: { createdAfter: new Date("2024-01-01T12:00:00") },
      });
      expect(threads).toHaveLength(2);
    });

    it("should filter by createdBefore", async () => {
      const threads = await store.list({
        filter: { createdBefore: new Date("2024-01-02T12:00:00") },
      });
      expect(threads).toHaveLength(2);
    });

    it("should apply limit", async () => {
      const threads = await store.list({ limit: 2 });
      expect(threads).toHaveLength(2);
    });

    it("should apply offset", async () => {
      const threads = await store.list({ offset: 1, limit: 2 });
      expect(threads).toHaveLength(2);
    });

    it("should sort by createdAt asc", async () => {
      const threads = await store.list({
        order: { createdAt: "asc" },
      });
      expect(threads[0].tid).toBe("thread-1");
      expect(threads[2].tid).toBe("thread-3");
    });

    it("should sort by createdAt desc (default)", async () => {
      const threads = await store.list({
        order: { createdAt: "desc" },
      });
      expect(threads[0].tid).toBe("thread-3");
      expect(threads[2].tid).toBe("thread-1");
    });
  });
});

describe("InMemoryStorage", () => {
  it("should create storage with thread store", () => {
    const storage = new InMemoryStorage();
    expect(storage.threads).toBeInstanceOf(InMemoryThreadStore);
  });

  it("should bind registries to thread store", () => {
    const storage = new InMemoryStorage();
    const agents = new Map();
    const models = new Map();

    storage.bind({ agents, models });

    // Verify binding by checking thread store can hydrate (would throw if not bound)
    expect(() => {
      (storage.threads as any).registries;
    }).not.toThrow();
  });

  it("should have no-op lifecycle methods", async () => {
    const storage = new InMemoryStorage();
    await expect(storage.init()).resolves.toBeUndefined();
    await expect(storage.close()).resolves.toBeUndefined();
    await expect(storage.migrate()).resolves.toBeUndefined();
  });

  it("should throw on transaction", async () => {
    const storage = new InMemoryStorage();
    await expect(storage.transaction(async () => {})).rejects.toThrow(
      "Transactions not supported",
    );
  });
});
