import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";
import { message } from "@kernl-sdk/protocol";
import type { ThreadEvent } from "kernl/internal";

import {
  create_client,
  create_storage,
  create_mock_registries,
  testid,
} from "../../__tests__/helpers";
import { LibSQLStorage } from "../../storage";

/** Create a message ThreadEvent */
function evt(
  id: string,
  tid: string,
  seq: number,
  timestamp: Date,
): ThreadEvent {
  return {
    ...message({ role: "user", text: `msg-${seq}` }),
    id,
    tid,
    seq,
    timestamp,
    metadata: {},
  } as ThreadEvent;
}

describe("LibSQLThreadStore", () => {
  let client: Client;
  let storage: LibSQLStorage;

  beforeEach(async () => {
    client = create_client();
    storage = create_storage(client);
    storage.bind(create_mock_registries());
    await storage.memories.list(); // init
  });

  afterEach(() => {
    client.close();
  });

  it("inserts and gets a thread", async () => {
    const tid = testid("thread");

    const inserted = await storage.threads.insert({
      id: tid,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
      context: { userId: "user-1" },
      metadata: { title: "Test" },
    });

    expect(inserted.tid).toBe(tid);
    expect(inserted.namespace).toBe("default");

    const found = await storage.threads.get(tid);
    expect(found).not.toBeNull();
    expect(found?.tid).toBe(tid);
    expect(found?.metadata).toEqual({ title: "Test" });
  });

  it("returns null for non-existent thread", async () => {
    const found = await storage.threads.get("nonexistent");
    expect(found).toBeNull();
  });

  it("updates thread fields and metadata", async () => {
    const tid = testid("thread");

    await storage.threads.insert({
      id: tid,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
    });

    const updated = await storage.threads.update(tid, {
      tick: 5,
      state: "running",
      metadata: { title: "Updated", score: 100 },
    });

    expect(updated._tick).toBe(5);
    expect(updated.state).toBe("running");
    expect(updated.metadata).toEqual({ title: "Updated", score: 100 });

    // Verify persisted
    const found = await storage.threads.get(tid);
    expect(found?._tick).toBe(5);
    expect(found?.state).toBe("running");
  });

  it("lists threads with filters and pagination", async () => {
    // Create multiple threads
    await storage.threads.insert({
      id: testid("t1"),
      namespace: "ns1",
      agentId: "test-agent",
      model: "test/model",
      state: "stopped",
    });
    await storage.threads.insert({
      id: testid("t2"),
      namespace: "ns1",
      agentId: "test-agent",
      model: "test/model",
      state: "running",
    });
    await storage.threads.insert({
      id: testid("t3"),
      namespace: "ns2",
      agentId: "test-agent",
      model: "test/model",
      state: "stopped",
    });

    // Filter by namespace
    const ns1Threads = await storage.threads.list({
      filter: { namespace: "ns1" },
    });
    expect(ns1Threads.length).toBe(2);

    // Filter by state
    const stoppedThreads = await storage.threads.list({
      filter: { state: "stopped" },
    });
    expect(stoppedThreads.length).toBe(2);

    // Filter by state array
    const activeThreads = await storage.threads.list({
      filter: { state: ["stopped", "running"] },
    });
    expect(activeThreads.length).toBe(3);

    // Pagination
    const page1 = await storage.threads.list({ limit: 2 });
    expect(page1.length).toBe(2);

    const page2 = await storage.threads.list({ limit: 2, offset: 2 });
    expect(page2.length).toBe(1);
  });

  it("orders threads by createdAt", async () => {
    const t1 = testid("t1");
    const t2 = testid("t2");

    await storage.threads.insert({
      id: t1,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
    });

    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 10));

    await storage.threads.insert({
      id: t2,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
    });

    const asc = await storage.threads.list({
      order: { createdAt: "asc" },
    });
    expect(asc[0].tid).toBe(t1);
    expect(asc[1].tid).toBe(t2);

    const desc = await storage.threads.list({
      order: { createdAt: "desc" },
    });
    expect(desc[0].tid).toBe(t2);
    expect(desc[1].tid).toBe(t1);
  });

  it("deletes thread", async () => {
    const tid = testid("thread");

    await storage.threads.insert({
      id: tid,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
    });

    // Add some events
    await storage.threads.append([evt("evt-1", tid, 1, new Date())]);

    await storage.threads.delete(tid);

    const found = await storage.threads.get(tid);
    expect(found).toBeNull();

    // Events should also be deleted (cascade)
    const history = await storage.threads.history(tid);
    expect(history.length).toBe(0);
  });

  it("returns null when agent/model not in registry", async () => {
    const tid = testid("thread");

    // Insert with non-existent agent
    await client.execute({
      sql: `INSERT INTO kernl_threads (id, namespace, agent_id, model, context, tick, state, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [tid, "default", "unknown-agent", "unknown/model", "{}", 0, "idle", Date.now(), Date.now()],
    });

    // Get should return null (graceful degradation)
    const found = await storage.threads.get(tid);
    expect(found).toBeNull();
  });
});
