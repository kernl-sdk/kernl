import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";

import {
  create_client,
  create_storage,
  THREADS_TABLE,
  MEMORIES_TABLE,
} from "./helpers";

describe("LibSQL migrations", () => {
  let client: Client;

  beforeEach(() => {
    client = create_client();
  });

  afterEach(() => {
    client.close();
  });

  it("creates tables with mapped SQLite types", async () => {
    const storage = create_storage(client);
    await storage.memories.list();

    // Check threads table schema
    const threadInfo = await client.execute(
      `PRAGMA table_info("${THREADS_TABLE}")`,
    );
    const threadCols = Object.fromEntries(
      threadInfo.rows.map((r) => [r.name, r.type]),
    );

    // JSON fields should be TEXT (not JSONB)
    expect(threadCols.context).toBe("TEXT");
    expect(threadCols.metadata).toBe("TEXT");
    expect(threadCols.state).toBe("TEXT");

    // Check memories table schema
    const memoryInfo = await client.execute(
      `PRAGMA table_info("${MEMORIES_TABLE}")`,
    );
    const memoryCols = Object.fromEntries(
      memoryInfo.rows.map((r) => [r.name, r.type]),
    );

    // Boolean fields should be INTEGER
    expect(memoryCols.wmem).toBe("INTEGER");
    // JSON fields should be TEXT
    expect(memoryCols.content).toBe("TEXT");
    expect(memoryCols.metadata).toBe("TEXT");
  });

  it("applies column defaults correctly", async () => {
    const storage = create_storage(client);
    await storage.memories.list();

    // Check threads table defaults
    const threadInfo = await client.execute(
      `PRAGMA table_info("${THREADS_TABLE}")`,
    );
    const tickCol = threadInfo.rows.find((r) => r.name === "tick");
    const namespaceCol = threadInfo.rows.find((r) => r.name === "namespace");

    expect(tickCol?.dflt_value).toBe("0");
    expect(namespaceCol?.dflt_value).toBe("'kernl'");

    // Check memories table defaults
    const memoryInfo = await client.execute(
      `PRAGMA table_info("${MEMORIES_TABLE}")`,
    );
    const wmemCol = memoryInfo.rows.find((r) => r.name === "wmem");

    expect(wmemCol?.dflt_value).toBe("0");
  });

  it("creates indexes from table definitions", async () => {
    const storage = create_storage(client);
    await storage.memories.list();

    // Check for indexes on threads table
    const threadIndexes = await client.execute(
      `PRAGMA index_list("${THREADS_TABLE}")`,
    );
    const threadIndexNames = threadIndexes.rows.map((r) => r.name as string);

    // Should have index on namespace
    expect(threadIndexNames.some((n) => n.includes("namespace"))).toBe(true);

    // Check for indexes on memories table
    const memoryIndexes = await client.execute(
      `PRAGMA index_list("${MEMORIES_TABLE}")`,
    );
    const memoryIndexNames = memoryIndexes.rows.map((r) => r.name as string);

    // Should have indexes for common queries
    expect(memoryIndexNames.some((n) => n.includes("namespace"))).toBe(true);
  });

  it("creates foreign key constraint on thread_events", async () => {
    const storage = create_storage(client);
    await storage.memories.list();

    const fkInfo = await client.execute(
      'PRAGMA foreign_key_list("kernl_thread_events")',
    );

    expect(fkInfo.rows.length).toBeGreaterThan(0);
    const threadFk = fkInfo.rows.find((r) => r.table === THREADS_TABLE);
    expect(threadFk).toBeDefined();
    expect(threadFk?.from).toBe("tid");
    expect(threadFk?.to).toBe("id");
  });
});
