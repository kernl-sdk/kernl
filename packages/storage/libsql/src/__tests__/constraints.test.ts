import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";

import {
  create_client,
  create_storage,
  enable_foreign_keys,
  THREADS_TABLE,
  THREAD_EVENTS_TABLE,
  testid,
} from "./helpers";
import { LibSQLStorage } from "../storage";

describe("LibSQL constraints", () => {
  let client: Client;
  let storage: LibSQLStorage;

  beforeEach(async () => {
    client = create_client();
    await enable_foreign_keys(client);
    storage = create_storage(client);
    // Initialize tables
    await storage.memories.list();
  });

  afterEach(() => {
    client.close();
  });

  it("enforces thread_events foreign key to threads", async () => {
    // Try to insert event for non-existent thread
    const result = client.execute({
      sql: `INSERT INTO "${THREAD_EVENTS_TABLE}" (id, tid, seq, kind, timestamp) VALUES (?, ?, ?, ?, ?)`,
      args: ["evt-1", "nonexistent-thread", 1, "message", Date.now()],
    });

    await expect(result).rejects.toThrow(/FOREIGN KEY/i);
  });

  it("cascades thread deletion to events", async () => {
    const tid = testid("thread");

    // Insert a thread directly
    await client.execute({
      sql: `INSERT INTO "${THREADS_TABLE}" (id, namespace, agent_id, model, context, tick, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        tid,
        "default",
        "agent-1",
        "test/model",
        "{}",
        0,
        "idle",
        Date.now(),
        Date.now(),
      ],
    });

    // Insert events for the thread
    await client.execute({
      sql: `INSERT INTO "${THREAD_EVENTS_TABLE}" (id, tid, seq, kind, timestamp) VALUES (?, ?, ?, ?, ?)`,
      args: ["evt-1", tid, 1, "message", Date.now()],
    });
    await client.execute({
      sql: `INSERT INTO "${THREAD_EVENTS_TABLE}" (id, tid, seq, kind, timestamp) VALUES (?, ?, ?, ?, ?)`,
      args: ["evt-2", tid, 2, "message", Date.now()],
    });

    // Verify events exist
    const beforeDelete = await client.execute({
      sql: `SELECT COUNT(*) as count FROM "${THREAD_EVENTS_TABLE}" WHERE tid = ?`,
      args: [tid],
    });
    expect(beforeDelete.rows[0].count).toBe(2);

    // Delete thread
    await client.execute({
      sql: `DELETE FROM "${THREADS_TABLE}" WHERE id = ?`,
      args: [tid],
    });

    // Events should be cascaded
    const afterDelete = await client.execute({
      sql: `SELECT COUNT(*) as count FROM "${THREAD_EVENTS_TABLE}" WHERE tid = ?`,
      args: [tid],
    });
    expect(afterDelete.rows[0].count).toBe(0);
  });

  it("enforces unique (tid, id) on thread_events", async () => {
    const tid = testid("thread");

    // Insert a thread
    await client.execute({
      sql: `INSERT INTO "${THREADS_TABLE}" (id, namespace, agent_id, model, context, tick, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        tid,
        "default",
        "agent-1",
        "test/model",
        "{}",
        0,
        "idle",
        Date.now(),
        Date.now(),
      ],
    });

    // Insert an event
    await client.execute({
      sql: `INSERT INTO "${THREAD_EVENTS_TABLE}" (id, tid, seq, kind, timestamp) VALUES (?, ?, ?, ?, ?)`,
      args: ["evt-1", tid, 1, "message", Date.now()],
    });

    // Try to insert duplicate (tid, id) - should fail
    const duplicate = client.execute({
      sql: `INSERT INTO "${THREAD_EVENTS_TABLE}" (id, tid, seq, kind, timestamp) VALUES (?, ?, ?, ?, ?)`,
      args: ["evt-1", tid, 2, "message", Date.now()],
    });

    await expect(duplicate).rejects.toThrow(/UNIQUE/i);
  });
});
