import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";
import { message, IN_PROGRESS, COMPLETED } from "@kernl-sdk/protocol";
import type { ThreadEvent } from "kernl/internal";

import {
  create_client,
  create_storage,
  create_mock_registries,
  THREADS_TABLE,
  THREAD_EVENTS_TABLE,
  testid,
} from "./helpers";
import { LibSQLStorage } from "../storage";

/** Create a ThreadEvent from a message */
function evt(
  id: string,
  tid: string,
  seq: number,
  timestamp: Date,
  role: "user" | "assistant",
  text: string,
): ThreadEvent {
  return {
    ...message({ role, text }),
    id,
    tid,
    seq,
    timestamp,
    metadata: {},
  } as ThreadEvent;
}

/** Create a tool.call ThreadEvent */
function toolCallEvt(
  id: string,
  tid: string,
  seq: number,
  timestamp: Date,
  callId: string,
  toolId: string,
): ThreadEvent {
  return {
    kind: "tool.call",
    id,
    tid,
    seq,
    timestamp,
    callId,
    toolId,
    state: IN_PROGRESS,
    arguments: "{}",
    metadata: {},
  } as ThreadEvent;
}

/** Create a tool.result ThreadEvent */
function toolResultEvt(
  id: string,
  tid: string,
  seq: number,
  timestamp: Date,
  callId: string,
  toolId: string,
): ThreadEvent {
  return {
    kind: "tool.result",
    id,
    tid,
    seq,
    timestamp,
    callId,
    toolId,
    state: COMPLETED,
    result: null,
    error: null,
    metadata: {},
  } as ThreadEvent;
}

describe("LibSQL thread lifecycle", () => {
  let client: Client;
  let storage: LibSQLStorage;

  beforeEach(async () => {
    client = create_client();
    storage = create_storage(client);
    storage.bind(create_mock_registries());
    // Initialize tables
    await storage.memories.list();
  });

  afterEach(() => {
    client.close();
  });

  it("persists thread and events for simple run", async () => {
    const tid = testid("thread");

    // Insert thread
    const thread = await storage.threads.insert({
      id: tid,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
      context: { userId: "user-1" },
      metadata: { title: "Test Thread" },
    });

    expect(thread.tid).toBe(tid);

    // Append events
    const now = Date.now();
    await storage.threads.append([
      evt("evt-1", tid, 1, new Date(now), "user", "Hello"),
      evt("evt-2", tid, 2, new Date(now + 1), "assistant", "Hi!"),
    ]);

    // Verify in database
    const events = await client.execute({
      sql: `SELECT * FROM "${THREAD_EVENTS_TABLE}" WHERE tid = ? ORDER BY seq`,
      args: [tid],
    });
    expect(events.rows.length).toBe(2);
    expect(events.rows[0].kind).toBe("message");
    expect(events.rows[1].seq).toBe(2);
  });

  it("persists tool call events across ticks", async () => {
    const tid = testid("thread");

    await storage.threads.insert({
      id: tid,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
    });

    const now = Date.now();

    // Tick 1: user message + assistant with tool call
    await storage.threads.append([
      evt("evt-1", tid, 1, new Date(now), "user", "search for something"),
      toolCallEvt("evt-2", tid, 2, new Date(now + 1), "call-1", "search"),
    ]);
    await storage.threads.update(tid, { tick: 1, state: "interruptible" });

    // Tick 2: tool result + final response
    await storage.threads.append([
      toolResultEvt("evt-3", tid, 3, new Date(now + 2), "call-1", "search"),
      evt("evt-4", tid, 4, new Date(now + 3), "assistant", "I found it"),
    ]);
    await storage.threads.update(tid, { tick: 2, state: "stopped" });

    // Verify all events persisted
    const history = await storage.threads.history(tid);
    expect(history.length).toBe(4);
    expect(history.map((e) => e.kind)).toEqual([
      "message",
      "tool.call",
      "tool.result",
      "message",
    ]);
  });

  it("resumes a thread and appends new events", async () => {
    const tid = testid("thread");

    // Create thread with initial events
    await storage.threads.insert({
      id: tid,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
    });

    const now = Date.now();
    await storage.threads.append([
      evt("evt-1", tid, 1, new Date(now), "user", "hello"),
      evt("evt-2", tid, 2, new Date(now + 1), "assistant", "hi"),
    ]);
    await storage.threads.update(tid, { tick: 1, state: "stopped" });

    // Resume: get thread with history
    const resumed = await storage.threads.get(tid, { history: true });
    expect(resumed).not.toBeNull();

    // Append more events
    await storage.threads.append([
      evt("evt-3", tid, 3, new Date(now + 100), "user", "continue"),
      evt("evt-4", tid, 4, new Date(now + 101), "assistant", "ok"),
    ]);
    await storage.threads.update(tid, { tick: 2 });

    // Verify total history
    const history = await storage.threads.history(tid);
    expect(history.length).toBe(4);
  });

  it("keeps event seq monotonic across runs", async () => {
    const tid = testid("thread");

    await storage.threads.insert({
      id: tid,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
    });

    const now = Date.now();

    // Run 1
    await storage.threads.append([
      evt("r1-1", tid, 1, new Date(now), "user", "m1"),
      evt("r1-2", tid, 2, new Date(now + 1), "assistant", "m2"),
    ]);

    // Run 2 (continuing sequence)
    await storage.threads.append([
      evt("r2-1", tid, 3, new Date(now + 100), "user", "m3"),
      evt("r2-2", tid, 4, new Date(now + 101), "assistant", "m4"),
    ]);

    // Run 3
    await storage.threads.append([
      evt("r3-1", tid, 5, new Date(now + 200), "user", "m5"),
    ]);

    const history = await storage.threads.history(tid);
    const seqs = history.map((e) => e.seq);
    expect(seqs).toEqual([1, 2, 3, 4, 5]);
  });
});
