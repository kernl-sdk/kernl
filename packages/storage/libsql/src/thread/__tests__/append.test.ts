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

/** Create a ThreadEvent from a message */
function evt(
  id: string,
  tid: string,
  seq: number,
  timestamp: Date,
  role: "user" | "assistant" = "user",
  text: string = `msg-${seq}`,
  metadata: Record<string, unknown> = {},
): ThreadEvent {
  return {
    ...message({ role, text }),
    id,
    tid,
    seq,
    timestamp,
    metadata,
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

describe("LibSQLThreadStore append", () => {
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
  });

  afterEach(() => {
    client.close();
  });

  it("appends events in order", async () => {
    const now = Date.now();

    await storage.threads.append([
      evt("e1", tid, 1, new Date(now), "user"),
      evt("e2", tid, 2, new Date(now + 1), "assistant"),
    ]);

    const history = await storage.threads.history(tid);

    expect(history.length).toBe(2);
    expect(history[0].id).toBe("e1");
    expect(history[0].seq).toBe(1);
    expect(history[1].id).toBe("e2");
    expect(history[1].seq).toBe(2);
  });

  it("preserves event data and metadata", async () => {
    const now = Date.now();
    const metadata = { source: "api", version: 2 };

    await storage.threads.append([
      evt("e1", tid, 1, new Date(now), "user", "Hello, world!", metadata),
    ]);

    const history = await storage.threads.history(tid);
    const event = history[0];

    expect(event.kind).toBe("message");
    if (event.kind === "message") {
      expect(event.role).toBe("user");
      expect(event.content).toEqual([{ kind: "text", text: "Hello, world!" }]);
    }
    expect(event.metadata).toEqual(metadata);
    expect(event.timestamp.getTime()).toBe(now);
  });

  it("is idempotent on duplicate ids", async () => {
    const now = Date.now();

    // First append
    await storage.threads.append([evt("e1", tid, 1, new Date(now))]);

    // Duplicate append (same id)
    await storage.threads.append([evt("e1", tid, 1, new Date(now + 100))]);

    const history = await storage.threads.history(tid);

    // Should only have one event
    expect(history.length).toBe(1);
    // Original timestamp should be preserved
    expect(history[0].timestamp.getTime()).toBe(now);
  });

  it("handles empty event list", async () => {
    await storage.threads.append([]);

    const history = await storage.threads.history(tid);
    expect(history.length).toBe(0);
  });

  it("handles multiple appends", async () => {
    const now = Date.now();

    await storage.threads.append([evt("e1", tid, 1, new Date(now))]);

    await storage.threads.append([
      toolCallEvt("e2", tid, 2, new Date(now + 1)),
      toolResultEvt("e3", tid, 3, new Date(now + 2)),
    ]);

    await storage.threads.append([evt("e4", tid, 4, new Date(now + 3))]);

    const history = await storage.threads.history(tid);

    expect(history.length).toBe(4);
    expect(history.map((e) => e.id)).toEqual(["e1", "e2", "e3", "e4"]);
  });

  it("handles mixed duplicate and new events", async () => {
    const now = Date.now();

    await storage.threads.append([
      evt("e1", tid, 1, new Date(now)),
      evt("e2", tid, 2, new Date(now + 1)),
    ]);

    // Append with one duplicate and one new
    await storage.threads.append([
      evt("e2", tid, 2, new Date(now + 100)), // duplicate
      evt("e3", tid, 3, new Date(now + 2)), // new
    ]);

    const history = await storage.threads.history(tid);

    expect(history.length).toBe(3);
    expect(history.map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
    // e2 should have original timestamp
    expect(history[1].timestamp.getTime()).toBe(now + 1);
  });
});
