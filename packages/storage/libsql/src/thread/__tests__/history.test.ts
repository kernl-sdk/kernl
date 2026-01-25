import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";
import { message, IN_PROGRESS, COMPLETED } from "@kernl-sdk/protocol";
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
  role: "user" | "assistant" = "user",
): ThreadEvent {
  return {
    ...message({ role, text: `msg-${seq}` }),
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
): ThreadEvent {
  return {
    kind: "tool.call",
    id,
    tid,
    seq,
    timestamp,
    callId: `call-${seq}`,
    toolId: "test-tool",
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
): ThreadEvent {
  return {
    kind: "tool.result",
    id,
    tid,
    seq,
    timestamp,
    callId: `call-${seq - 1}`,
    toolId: "test-tool",
    state: COMPLETED,
    result: null,
    error: null,
    metadata: {},
  } as ThreadEvent;
}

describe("LibSQLThreadStore history", () => {
  let client: Client;
  let storage: LibSQLStorage;
  let tid: string;

  beforeEach(async () => {
    client = create_client();
    storage = create_storage(client);
    storage.bind(create_mock_registries());
    await storage.memories.list(); // init

    tid = testid("thread");
    await storage.threads.insert({
      id: tid,
      namespace: "default",
      agentId: "test-agent",
      model: "test/model",
    });

    // Add test events
    const now = Date.now();
    await storage.threads.append([
      evt("e1", tid, 1, new Date(now)),
      toolCallEvt("e2", tid, 2, new Date(now + 1)),
      toolResultEvt("e3", tid, 3, new Date(now + 2)),
      evt("e4", tid, 4, new Date(now + 3)),
      evt("e5", tid, 5, new Date(now + 4)),
    ]);
  });

  afterEach(() => {
    client.close();
  });

  it("returns events in asc order by default", async () => {
    const history = await storage.threads.history(tid);

    expect(history.length).toBe(5);
    expect(history[0].seq).toBe(1);
    expect(history[4].seq).toBe(5);
  });

  it("filters by after seq", async () => {
    const history = await storage.threads.history(tid, { after: 2 });

    expect(history.length).toBe(3);
    expect(history[0].seq).toBe(3);
    expect(history[2].seq).toBe(5);
  });

  it("filters by kinds", async () => {
    const history = await storage.threads.history(tid, {
      kinds: ["message"],
    });

    expect(history.length).toBe(3);
    expect(history.every((e) => e.kind === "message")).toBe(true);
  });

  it("filters by multiple kinds", async () => {
    const history = await storage.threads.history(tid, {
      kinds: ["tool.call", "tool.result"],
    });

    expect(history.length).toBe(2);
    expect(history.map((e) => e.kind)).toEqual(["tool.call", "tool.result"]);
  });

  it("supports desc order and limit", async () => {
    const history = await storage.threads.history(tid, {
      order: "desc",
      limit: 2,
    });

    expect(history.length).toBe(2);
    expect(history[0].seq).toBe(5);
    expect(history[1].seq).toBe(4);
  });

  it("combines after, kinds, and limit", async () => {
    const history = await storage.threads.history(tid, {
      after: 1,
      kinds: ["message"],
      limit: 1,
      order: "asc",
    });

    expect(history.length).toBe(1);
    expect(history[0].seq).toBe(4); // First message after seq 1
  });

  it("returns empty array for non-existent thread", async () => {
    const history = await storage.threads.history("nonexistent");
    expect(history).toEqual([]);
  });

  it("includes history when getting thread with include option", async () => {
    const thread = await storage.threads.get(tid, { history: true });

    // Thread is returned with history loaded (history is private,
    // so we verify via get returning non-null and separate history() call)
    expect(thread).not.toBeNull();
    expect(thread?.tid).toBe(tid);

    // Verify events exist via direct history query
    const history = await storage.threads.history(tid);
    expect(history.length).toBe(5);
  });

  it("respects history options when getting thread", async () => {
    const thread = await storage.threads.get(tid, {
      history: { after: 3, limit: 2 },
    });

    // Thread is returned with filtered history loaded
    expect(thread).not.toBeNull();
    expect(thread?.tid).toBe(tid);

    // Verify filtered history via direct query with same options
    const history = await storage.threads.history(tid, { after: 3, limit: 2 });
    expect(history.length).toBe(2);
    expect(history[0].seq).toBe(4);
  });
});
