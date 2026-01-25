import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";

import {
  create_client,
  create_storage,
  MIGRATIONS_TABLE,
  THREADS_TABLE,
  MEMORIES_TABLE,
} from "./helpers";

describe("LibSQLStorage init", () => {
  let client: Client;

  beforeEach(() => {
    client = create_client();
  });

  afterEach(() => {
    client.close();
  });

  it("auto-initializes on first store operation", async () => {
    const storage = create_storage(client);

    // Tables shouldn't exist yet
    const before = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      args: [THREADS_TABLE],
    });
    expect(before.rows.length).toBe(0);

    // Trigger init via store operation
    await storage.memories.list();

    // Now tables should exist
    const after = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      args: [THREADS_TABLE],
    });
    expect(after.rows.length).toBe(1);
  });

  it("creates migrations table and applies migrations", async () => {
    const storage = create_storage(client);

    // Trigger init
    await storage.memories.list();

    // Check migrations table exists and has records
    const result = await client.execute(`SELECT * FROM "${MIGRATIONS_TABLE}"`);
    expect(result.rows.length).toBeGreaterThan(0);

    // Verify migration IDs
    const migrationIds = result.rows.map((r) => r.id);
    expect(migrationIds).toContain("001_threads");
  });

  it("is idempotent across multiple init calls", async () => {
    const storage = create_storage(client);

    // Trigger init multiple times
    await storage.memories.list();
    await storage.threads.list();
    await storage.memories.list();

    // Should still work and have same migrations
    const result = await client.execute(`SELECT * FROM "${MIGRATIONS_TABLE}"`);
    const migrationCount = result.rows.length;

    // Trigger again
    await storage.memories.list();

    const result2 = await client.execute(`SELECT * FROM "${MIGRATIONS_TABLE}"`);
    expect(result2.rows.length).toBe(migrationCount);
  });

  it("creates all required tables", async () => {
    const storage = create_storage(client);
    await storage.memories.list();

    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const tableNames = tables.rows.map((r) => r.name as string);

    expect(tableNames).toContain(MIGRATIONS_TABLE);
    expect(tableNames).toContain(THREADS_TABLE);
    expect(tableNames).toContain(MEMORIES_TABLE);
    expect(tableNames).toContain("kernl_thread_events");
  });
});
