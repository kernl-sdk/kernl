import { describe, it, expect, beforeEach } from "vitest";

import { message, RUNNING } from "@kernl-sdk/protocol";

import { Agent } from "@/agent";
import { InMemoryThreadStore } from "@/storage/in-memory";
import type { AgentRegistry, ModelRegistry } from "@/types/kernl";
import type { NewThread } from "@/storage";
import { tevent } from "@/thread/utils";
import type { ThreadEvent } from "@/types/thread";
import { RThreads } from "@/api/resources/threads";
import type { MThread } from "@/api/models";

function createTestStore() {
  const store = new InMemoryThreadStore();

  const agents: AgentRegistry & Map<string, Agent> = new Map();
  const models: ModelRegistry & Map<string, any> = new Map();

  const model = {
    spec: "1.0" as const,
    provider: "test",
    modelId: "test-model",
    // generate/stream are never called in these tests
  } as any;

  const agent = new Agent({
    id: "agent-1",
    name: "Test Agent",
    instructions: "You are a test agent.",
    model,
  });

  const modelKey = `${model.provider}/${model.modelId}`;

  agents.set(agent.id, agent);
  models.set(modelKey, model);

  store.bind({ agents, models });

  return { store, agent, modelKey };
}

async function insertThread(args: {
  store: InMemoryThreadStore;
  modelKey: string;
  agentId: string;
  tid: string;
  namespace: string;
  createdAt: Date;
}): Promise<MThread> {
  const thread: NewThread = {
    id: args.tid,
    namespace: args.namespace,
    agentId: args.agentId,
    model: args.modelKey,
    context: { foo: "bar" },
    createdAt: args.createdAt,
    updatedAt: args.createdAt,
  };

  const runtime = await args.store.insert(thread);

  // Minimal mirror of RThreads.toModel to keep the test focused
  const model: MThread = {
    tid: runtime.tid,
    namespace: runtime.namespace,
    agentId: runtime.agent.id,
    model: {
      provider: runtime.model.provider,
      modelId: runtime.model.modelId,
    },
    context: runtime.context.context as Record<string, unknown>,
    parentTaskId: runtime.parent?.id ?? null,
    state: runtime.state,
    createdAt: runtime.createdAt,
    updatedAt: runtime.updatedAt,
  };

  return model;
}

async function appendEvents(
  store: InMemoryThreadStore,
  tid: string,
  seqs: number[],
): Promise<ThreadEvent[]> {
  const events: ThreadEvent[] = [];

  for (const seq of seqs) {
    const item = message({
      role: "user",
      text: `event-${seq}`,
    });
    const e = tevent({
      tid,
      seq,
      kind: "message",
      data: item,
    });
    events.push(e);
  }

  // Add one system event to verify filtering in history
  const systemEvent = tevent({
    tid,
    seq: Math.max(...seqs) + 1,
    kind: "system",
    data: null,
  });
  events.push(systemEvent);

  await store.append(events);
  return events;
}

describe("RThreads", () => {
  let store: InMemoryThreadStore;
  let agentId: string;
  let modelKey: string;
  let threads: RThreads;

  beforeEach(() => {
    const setup = createTestStore();
    store = setup.store;
    agentId = setup.agent.id;
    modelKey = setup.modelKey;
    threads = new RThreads(store);
  });

  it("lists threads with filters and pagination", async () => {
    const now = new Date();
    const t1Created = new Date(now.getTime() - 10_000);
    const t2Created = new Date(now.getTime() - 5_000);

    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "t1",
      namespace: "ns-a",
      createdAt: t1Created,
    });
    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "t2",
      namespace: "ns-a",
      createdAt: t2Created,
    });
    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "t3",
      namespace: "ns-b",
      createdAt: t2Created,
    });

    const page = await threads.list({
      namespace: "ns-a",
      limit: 1,
    });

    // First page should contain the most recently created thread in ns-a
    expect(page.items.map((t) => t.tid)).toEqual(["t2"]);
    expect(page.last).toBe(false);

    const next = await page.next();
    expect(next).not.toBeNull();
    expect(next!.items.map((t) => t.tid)).toEqual(["t1"]);
    expect(next!.last).toBe(true);

    // collect should return both threads in the correct order
    const all = await page.collect();
    expect(all.map((t) => t.tid)).toEqual(["t2", "t1"]);
  });

  it("supports createdAt/updatedAt ordering and before/after filters", async () => {
    const now = new Date();
    const t1Created = new Date(now.getTime() - 30_000);
    const t2Created = new Date(now.getTime() - 20_000);
    const t3Created = new Date(now.getTime() - 10_000);

    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "o1",
      namespace: "order-ns",
      createdAt: t1Created,
    });
    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "o2",
      namespace: "order-ns",
      createdAt: t2Created,
    });
    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "o3",
      namespace: "order-ns",
      createdAt: t3Created,
    });

    // Ascending createdAt should return [o1, o2, o3]
    const asc = await threads.list({
      namespace: "order-ns",
      order: { createdAt: "asc" },
    });
    const ascAll = await asc.collect();
    expect(ascAll.map((t) => t.tid)).toEqual(["o1", "o2", "o3"]);

    // Filter with after/before to include only the middle thread
    const filtered = await threads.list({
      namespace: "order-ns",
      after: t1Created,
      before: t3Created,
      order: { createdAt: "asc" },
    });
    const filteredAll = await filtered.collect();
    expect(filteredAll.map((t) => t.tid)).toEqual(["o2"]);
  });

  it("returns history in latest-first order by default and filters out system events", async () => {
    const createdAt = new Date();
    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "hist-1",
      namespace: "ns-hist",
      createdAt,
    });

    const events = await appendEvents(store, "hist-1", [0, 1, 2]);

    const history = await threads.history("hist-1");

    // Should exclude the system event
    const systemIds = events
      .filter((e) => e.kind === "system")
      .map((e) => e.id);
    expect(history.every((e) => !systemIds.includes(e.id))).toBe(true);

    // Default order is "desc" on seq, so we expect [2, 1, 0]
    expect(history.map((e) => e.seq)).toEqual([2, 1, 0]);
  });

  it("supports history after/kinds/limit options", async () => {
    const createdAt = new Date();
    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "hist-opts",
      namespace: "ns-hist-opts",
      createdAt,
    });

    await appendEvents(store, "hist-opts", [0, 1, 2]);

    // After seq 0, ascending, limit 1 → only seq 1
    const history = await threads.history("hist-opts", {
      after: 0,
      order: "asc",
      limit: 1,
      kinds: ["message"],
    });

    expect(history.map((e) => e.seq)).toEqual([1]);
    expect(history.every((e) => e.kind === "message")).toBe(true);
  });

  it("get() can optionally include history with default and custom options", async () => {
    const createdAt = new Date();
    const model = await insertThread({
      store,
      modelKey,
      agentId,
      tid: "with-history",
      namespace: "ns-get",
      createdAt,
    });

    await appendEvents(store, "with-history", [0, 1, 2]);

    // Mark one of the threads as RUNNING and ensure state filter works via list()
    await store.update(model.tid, { state: RUNNING });
    const byState = await threads.list({
      namespace: "ns-get",
      state: RUNNING,
    });
    const byStateAll = await byState.collect();
    expect(byStateAll.map((t) => t.tid)).toEqual(["with-history"]);

    // history: true → all events with default options
    const base = await threads.get("with-history", {
      history: true,
    });

    expect(base).not.toBeNull();
    expect(base!.history?.map((e) => e.seq)).toEqual([2, 1, 0]);

    // history: { limit: 1, order: "asc" } → oldest event only
    const thread = await threads.get("with-history", {
      history: { limit: 1, order: "asc" },
    });

    expect(thread!.history?.map((e) => e.seq)).toEqual([0]);
  });

  it("create() persists a thread with caller metadata and optional title", async () => {
    const thread = await threads.create({
      agentId,
      model: {
        provider: "test",
        modelId: "test-model",
      },
      namespace: "ns-create",
      context: { foo: "bar" },
      metadata: { foo: "baz" },
      title: "My Thread",
    });

    expect(thread.tid).toMatch(/^tid_/);
    expect(thread.namespace).toBe("ns-create");
    expect(thread.agentId).toBe(agentId);
    expect(thread.title).toBe("My Thread");

    // Verify metadata was persisted and title merged into it.
    const runtime = await store.get(thread.tid, { history: false });
    expect(runtime).not.toBeNull();
    expect(runtime!.metadata).not.toBeNull();
    expect(runtime!.metadata!.foo).toBe("baz");
    expect(runtime!.metadata!.title).toBe("My Thread");
  });

  it("update() can set and clear a thread title", async () => {
    const createdAt = new Date();
    const model = await insertThread({
      store,
      modelKey,
      agentId,
      tid: "title-1",
      namespace: "ns-title",
      createdAt,
    });

    // Initially there is no title
    expect(model.title).toBeUndefined();

    const updated = await threads.update("title-1", {
      title: "  New Title  ",
    });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("New Title");

    const cleared = await threads.update("title-1", { title: "" });
    expect(cleared).not.toBeNull();
    expect(cleared!.title).toBeNull();
  });

  it("update() can modify context and metadata with title overlay", async () => {
    const createdAt = new Date();
    await insertThread({
      store,
      modelKey,
      agentId,
      tid: "update-fields",
      namespace: "ns-update",
      createdAt,
    });

    const updated = await threads.update("update-fields", {
      context: { foo: "bar" },
      metadata: { a: 1 },
      title: "Thread Title",
    });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Thread Title");

    const runtime = await store.get("update-fields", { history: false });
    expect(runtime).not.toBeNull();
    expect(runtime!.context.context).toEqual({ foo: "bar" });
    expect(runtime!.metadata).toEqual({ a: 1, title: "Thread Title" });
  });

  it("rejects context updates while thread is running", async () => {
    const createdAt = new Date();
    const model = await insertThread({
      store,
      modelKey,
      agentId,
      tid: "running-1",
      namespace: "ns-running",
      createdAt,
    });

    // Mark thread as RUNNING in the store
    await store.update(model.tid, { state: RUNNING });

    await expect(
      threads.update("running-1", {
        context: { should: "fail" },
      } as any),
    ).rejects.toThrow(/Cannot update thread context while thread is running/);
  });
});
