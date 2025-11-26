import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Pool } from "pg";

import { PGStorage } from "../storage";
import { PGThreadStore } from "../thread/store";
import {
  Agent,
  Context,
  type AgentRegistry,
  type ModelRegistry,
} from "kernl";
import { Thread } from "kernl/internal";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;

type TestLanguageModel =
  ModelRegistry extends { get(key: string): infer T | undefined } ? T : never;

describe.sequential("PGStorage auto-initialization", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL to be set", () => {});
    return;
  }

  /**
   * Verifies that ALL store methods auto-initialize without explicit init() call.
   *
   * This is critical for DX - users should not need to remember to call init().
   * Each method must internally call ensureInit() before any DB operation.
   *
   * Methods covered: get, list, insert, update, delete, history, append
   */
  it("auto-initializes on first store operation (no explicit init required)", async () => {
    const pool = new Pool({ connectionString: TEST_DB_URL });
    const storage = new PGStorage({ pool });

    // Clean slate - drop schema to prove init runs automatically
    await pool.query('DROP SCHEMA IF EXISTS "kernl" CASCADE');

    // Bind minimal registries
    const model = {
      spec: "1.0" as const,
      provider: "test",
      modelId: "auto-init-model",
    } as unknown as TestLanguageModel;

    const agent = new Agent({
      id: "auto-init-agent",
      name: "Auto Init Agent",
      instructions: () => "test",
      model,
    });

    const agents: AgentRegistry = new Map([["auto-init-agent", agent]]);
    const models: ModelRegistry = new Map([
      ["test/auto-init-model", model],
    ]) as unknown as ModelRegistry;

    storage.bind({ agents, models });
    const store = storage.threads;
    const tid = "auto-init-thread";

    // 1) list() - should auto-init
    const threads = await store.list();
    expect(threads).toEqual([]);

    // 2) get() - should work (returns null for non-existent)
    const got = await store.get(tid);
    expect(got).toBeNull();

    // 3) insert() - should work
    const inserted = await store.insert({
      id: tid,
      namespace: "kernl",
      agentId: "auto-init-agent",
      model: "test/auto-init-model",
    });
    expect(inserted.tid).toBe(tid);

    // 4) update() - should work
    await store.update(tid, { tick: 1 });
    const tickResult = await pool.query<{ tick: number }>(
      `SELECT tick FROM "kernl"."threads" WHERE id = $1`,
      [tid],
    );
    expect(tickResult.rows[0]?.tick).toBe(1);

    // 5) history() - should work (empty)
    const hist = await store.history(tid);
    expect(hist).toEqual([]);

    // 6) append() - should work
    await store.append([
      {
        id: "evt-1",
        tid,
        seq: 0,
        kind: "message",
        timestamp: new Date(),
        data: { role: "user", text: "test" },
        metadata: null,
      } as any,
    ]);

    // 7) delete() - should work
    await store.delete(tid);
    const afterDelete = await store.get(tid);
    expect(afterDelete).toBeNull();

    // Verify schema was created
    const schemaResult = await pool.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'kernl'`,
    );
    expect(schemaResult.rows).toHaveLength(1);

    await storage.close();
  });
});

describe.sequential("PGStorage integration", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL to be set", () => {
      // Intentionally empty - environment not configured for integration tests.
    });
    return;
  }

  interface TableRow {
    table_name: string;
  }

  interface MigrationRow {
    id: string;
  }

  let pool: Pool;
  let storage: PGStorage;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    storage = new PGStorage({ pool });

    // Ensure a clean schema for this test run.
    await pool.query('DROP SCHEMA IF EXISTS "kernl" CASCADE');
  });

  afterAll(async () => {
    await storage.close(); // calls pool.end()
  });

  it("connects, creates schema, runs migrations, enforces constraints, and is idempotent", async () => {
    // First init: should create schema + migrations table + apply all migrations.
    await storage.init();

    // ---- verify tables exist ----
    const tablesResult = await pool.query<TableRow>(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'kernl'
        ORDER BY table_name ASC
      `,
    );

    const tableNames = tablesResult.rows.map((row) => row.table_name);
    expect(tableNames).toContain("migrations");
    expect(tableNames).toContain("threads");
    expect(tableNames).toContain("thread_events");

    // ---- verify migrations recorded ----
    const migrationsResult = await pool.query<MigrationRow>(
      `SELECT id FROM "kernl".migrations ORDER BY applied_at ASC`,
    );
    const appliedMigrationIds = migrationsResult.rows.map((row) => row.id);
    expect(appliedMigrationIds).toEqual(["001_threads", "002_memories"]);

    // ---- verify indexes created by table definitions ----
    const indexesResult = await pool.query<{
      indexname: string;
      tablename: string;
    }>(
      `
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'kernl'
      `,
    );

    const indexNames = indexesResult.rows.map((row) => row.indexname);
    expect(indexNames).toEqual(
      expect.arrayContaining([
        "idx_threads_state",
        "idx_threads_namespace",
        "idx_threads_agent_id",
        "idx_threads_parent_task_id",
        "idx_threads_created_at",
        "idx_threads_updated_at",
        "idx_thread_events_tid_seq",
        "idx_thread_events_tid_kind",
      ]),
    );

    // ---- verify unique + foreign-key constraints on thread_events ----

    // Insert a parent thread row that satisfies NOT NULL constraints.
    const now = Date.now();
    const threadId = "thread-int-1";
    await pool.query(
      `
        INSERT INTO "kernl"."threads"
          (id, agent_id, model, context, parent_task_id, tick, state, metadata, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10)
      `,
      [
        threadId,
        "agent-int",
        "provider/model",
        JSON.stringify({ foo: "bar" }),
        null,
        0,
        "stopped",
        null,
        now,
        now,
      ],
    );

    // 1) Foreign key should reject events for non-existent threads.
    await expect(
      pool.query(
        `
          INSERT INTO "kernl"."thread_events"
            (id, tid, seq, kind, timestamp, data, metadata)
          VALUES
            ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
        `,
        [
          "event-bad-thread",
          "non-existent-thread",
          0,
          "system",
          now,
          null,
          null,
        ],
      ),
    ).rejects.toThrow();

    // 2) Unique constraint on (tid, id) should reject duplicates.
    const eventId = "event-1";
    await pool.query(
      `
        INSERT INTO "kernl"."thread_events"
          (id, tid, seq, kind, timestamp, data, metadata)
        VALUES
          ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
      `,
      [eventId, threadId, 0, "system", now, null, null],
    );

    await expect(
      pool.query(
        `
          INSERT INTO "kernl"."thread_events"
            (id, tid, seq, kind, timestamp, data, metadata)
          VALUES
            ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
        `,
        [eventId, threadId, 1, "system", now, null, null],
      ),
    ).rejects.toThrow();

    // 3) ON DELETE CASCADE: deleting the thread should delete its events.
    await pool.query(
      `DELETE FROM "kernl"."threads" WHERE id = $1`,
      [threadId],
    );

    const countResult = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM "kernl"."thread_events"
        WHERE tid = $1
      `,
      [threadId],
    );
    expect(countResult.rows[0]?.count).toBe("0");

    // ---- verify init() is idempotent ----
    await storage.init();

    const migrationsAfterResult = await pool.query<MigrationRow>(
      `SELECT id FROM "kernl".migrations ORDER BY applied_at ASC`,
    );
    expect(migrationsAfterResult.rows).toHaveLength(
      migrationsResult.rows.length,
    );
  });

  it("performs basic thread CRUD via PGThreadStore", async () => {
    // Ensure schema is initialized (idempotent if already run).
    await storage.init();

    // Bind minimal agent/model registries so PGThreadStore can hydrate threads.
    const model = {
      spec: "1.0" as const,
      provider: "test",
      modelId: "test-model",
    } as unknown as TestLanguageModel;

    const agent = new Agent({
      id: "agent-1",
      name: "Test Agent",
      instructions: () => "test",
      model,
    });

    const agents: AgentRegistry = new Map<string, Agent>([["agent-1", agent]]);
    const models: ModelRegistry = new Map<string, TestLanguageModel>([
      ["provider/model", model],
    ]) as unknown as ModelRegistry;

    storage.bind({ agents, models });
    const store = storage.threads;

    const tid = "thread-store-1";

    // Insert a new thread (no explicit context/metadata) and verify defaults.
    await store.insert({
      id: tid,
      namespace: "kernl",
      agentId: "agent-1",
      model: "provider/model",
    });

    const inserted = await pool.query<{
      id: string;
      agent_id: string;
      model: string;
      tick: number;
      state: string;
      context: unknown;
      metadata: unknown;
    }>(
      `
        SELECT id, agent_id, model, tick, state, context, metadata
        FROM "kernl"."threads"
        WHERE id = $1
      `,
      [tid],
    );

    expect(inserted.rows).toHaveLength(1);
    expect(inserted.rows[0]?.id).toBe(tid);
    expect(inserted.rows[0]?.agent_id).toBe("agent-1");
    expect(inserted.rows[0]?.model).toBe("provider/model");
    expect(inserted.rows[0]?.tick).toBe(0);
    expect(inserted.rows[0]?.state).toBe("stopped");
    // NewThreadCodec should default context to {} and metadata to null.
    expect(inserted.rows[0]?.context).toEqual({});
    expect(inserted.rows[0]?.metadata).toBeNull();

    // Insert a thread with a non-trivial context to verify JSONB handling.
    const tidWithContext = "thread-store-ctx";
    const complexContext = { foo: "bar", nested: { a: 1, b: [1, 2, 3] } };

    await store.insert({
      id: tidWithContext,
      namespace: "kernl",
      agentId: "agent-1",
      model: "provider/model",
      context: complexContext as unknown as never,
    });

    const ctxResult = await pool.query<{ context: unknown }>(
      `
        SELECT context
        FROM "kernl"."threads"
        WHERE id = $1
      `,
      [tidWithContext],
    );

    expect(ctxResult.rows).toHaveLength(1);
    expect(ctxResult.rows[0]?.context).toEqual(complexContext);

    // Update context via ThreadStore.update and verify JSONB is replaced.
    const updatedContext = { foo: "baz", nested: { a: 2, b: [4, 5, 6] } };

    await store.update(tidWithContext, {
      context: new Context("kernl", updatedContext as unknown),
    });

    const ctxUpdatedResult = await pool.query<{ context: unknown }>(
      `
        SELECT context
        FROM "kernl"."threads"
        WHERE id = $1
      `,
      [tidWithContext],
    );

    expect(ctxUpdatedResult.rows).toHaveLength(1);
    expect(ctxUpdatedResult.rows[0]?.context).toEqual(updatedContext);

    // Update the original thread with full patch, including a title in metadata.
    await store.update(tid, {
      tick: 5,
      state: "running",
      metadata: { source: "integration-test", title: "Test Thread" },
    });

    const updatedFull = await pool.query<{
      tick: number;
      state: string;
      metadata: unknown;
    }>(
      `
        SELECT tick, state, metadata
        FROM "kernl"."threads"
        WHERE id = $1
      `,
      [tid],
    );

    expect(updatedFull.rows).toHaveLength(1);
    expect(updatedFull.rows[0]?.tick).toBe(5);
    expect(updatedFull.rows[0]?.state).toBe("running");
    expect(updatedFull.rows[0]?.metadata).toEqual({
      source: "integration-test",
      title: "Test Thread",
    });

    // Partial update: only tick should change; state/metadata should stay the same.
    await store.update(tid, {
      tick: 10,
    });

    const updatedPartial = await pool.query<{
      tick: number;
      state: string;
      metadata: unknown;
    }>(
      `
        SELECT tick, state, metadata
        FROM "kernl"."threads"
        WHERE id = $1
      `,
      [tid],
    );

    expect(updatedPartial.rows).toHaveLength(1);
    expect(updatedPartial.rows[0]?.tick).toBe(10);
    expect(updatedPartial.rows[0]?.state).toBe("running");
    expect(updatedPartial.rows[0]?.metadata).toEqual({
      source: "integration-test",
      title: "Test Thread",
    });

    // Update with metadata explicitly null to verify JSONB nulling.
    await store.update(tid, {
      metadata: null,
    });

    const updatedNullMeta = await pool.query<{
      metadata: unknown;
    }>(
      `
        SELECT metadata
        FROM "kernl"."threads"
        WHERE id = $1
      `,
      [tid],
    );

    expect(updatedNullMeta.rows).toHaveLength(1);
    expect(updatedNullMeta.rows[0]?.metadata).toBeNull();

    // Delete the thread.
    await store.delete(tid);

    const afterDelete = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM "kernl"."threads"
        WHERE id = $1
      `,
      [tid],
    );

    expect(afterDelete.rows[0]?.count).toBe("0");
  });

  it("appends and queries thread events via PGThreadStore.history", async () => {
    await storage.init();

    // Reset tables for this test so we only see events we insert here.
    await pool.query('DELETE FROM "kernl"."thread_events"');
    await pool.query('DELETE FROM "kernl"."threads"');

    const model = {
      spec: "1.0" as const,
      provider: "test",
      modelId: "test-model",
    } as unknown as TestLanguageModel;

    const agent = new Agent({
      id: "agent-1",
      name: "Test Agent",
      instructions: () => "test",
      model,
    });

    const agents: AgentRegistry = new Map<string, Agent>([["agent-1", agent]]);
    const models: ModelRegistry = new Map<string, TestLanguageModel>([
      ["provider/model", model],
    ]) as unknown as ModelRegistry;

    storage.bind({ agents, models });
    const store = storage.threads;

    const tid = "thread-events-1";

    await store.insert({
      id: tid,
      namespace: "kernl",
      agentId: "agent-1",
      model: "provider/model",
    });

    const thread = new Thread({
      agent,
      model,
      tid,
    });

    const [event1, event2, event3] = thread.append(
      { kind: "message", role: "user", text: "one" } as any,
      { kind: "message", role: "assistant", text: "two" } as any,
      { kind: "reasoning", text: "thinking" } as any,
    );

    await store.append([event1, event2, event3]);

    const allAsc = await store.history(tid);
    expect(allAsc.map((e) => e.id)).toEqual([
      event1.id,
      event2.id,
      event3.id,
    ]);

    const afterFirst = await store.history(tid, { after: event1.seq });
    expect(afterFirst.map((e) => e.id)).toEqual([event2.id, event3.id]);

    const reasoningOnly = await store.history(tid, { kinds: ["reasoning"] });
    expect(reasoningOnly).toHaveLength(1);
    expect(reasoningOnly[0]?.id).toBe(event3.id);
    expect(reasoningOnly[0]?.kind).toBe("reasoning");

    const lastDesc = await store.history(tid, { order: "desc", limit: 1 });
    expect(lastDesc).toHaveLength(1);
    expect(lastDesc[0]?.id).toBe(event3.id);
  });

  it("does not re-insert an existing thread when streaming from a hydrated instance", async () => {
    await storage.init();

    // Reset tables for this test
    await pool.query('DELETE FROM "kernl"."thread_events"');
    await pool.query('DELETE FROM "kernl"."threads"');

    const model = {
      spec: "1.0" as const,
      provider: "test",
      modelId: "test-model",
      // generate/stream are not used in this test - we only advance stream
      // far enough to trigger the first checkpoint.
    } as unknown as TestLanguageModel;

    const agent = new Agent({
      id: "agent-1",
      name: "Test Agent",
      instructions: () => "test",
      model,
    });

    const agents: AgentRegistry = new Map<string, Agent>([["agent-1", agent]]);
    const models: ModelRegistry = new Map<string, TestLanguageModel>([
      ["provider/model", model],
    ]) as unknown as ModelRegistry;

    storage.bind({ agents, models });
    const store = storage.threads;

    const tid = "thread-stream-checkpoint-1";

    // Create the thread row once via the store.
    await store.insert({
      id: tid,
      namespace: "kernl",
      agentId: "agent-1",
      model: "provider/model",
    });

    // Hydrate a Thread instance from storage.
    const hydrated = await store.get(tid);
    expect(hydrated).not.toBeNull();

    // Advance the stream once to trigger the initial checkpoint().
    const iterator = hydrated!.stream()[Symbol.asyncIterator]();
    await iterator.next();

    // Ensure only one row exists for this tid (no duplicate INSERT).
    const countResult = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM "kernl"."threads"
        WHERE id = $1
      `,
      [tid],
    );

    expect(countResult.rows[0]?.count).toBe("1");
  });

  it("gets a thread with joined history via include.history", async () => {
    await storage.init();

    await pool.query('DELETE FROM "kernl"."thread_events"');
    await pool.query('DELETE FROM "kernl"."threads"');

    const model = {
      spec: "1.0" as const,
      provider: "test",
      modelId: "test-model",
    } as unknown as TestLanguageModel;

    const agent = new Agent({
      id: "agent-1",
      name: "Test Agent",
      instructions: () => "test",
      model,
    });

    const agents: AgentRegistry = new Map<string, Agent>([["agent-1", agent]]);
    const models: ModelRegistry = new Map<string, TestLanguageModel>([
      ["provider/model", model],
    ]) as unknown as ModelRegistry;

    storage.bind({ agents, models });
    const store = storage.threads;

    const tid = "thread-get-1";

    await store.insert({
      id: tid,
      namespace: "kernl",
      agentId: "agent-1",
      model: "provider/model",
    });

    const thread = new Thread({
      agent,
      model,
      tid,
    });

    const [event1, event2] = thread.append(
      { kind: "message", role: "user", text: "hello" } as any,
      { kind: "message", role: "assistant", text: "world" } as any,
    );

    await store.append([event1, event2]);

    const loaded = await store.get(tid, { history: true });
    expect(loaded).not.toBeNull();

    const loadedAny = loaded as any;
    expect(loadedAny.tid).toBe(tid);
    expect(Array.isArray(loadedAny.history)).toBe(true);
    expect(loadedAny.history.map((e: any) => e.id)).toEqual([
      event1.id,
      event2.id,
    ]);
  });

  it("lists threads with filters, ordering, and pagination", async () => {
    await storage.init();

    // Reset tables for this test so list results are deterministic.
    await pool.query('DELETE FROM "kernl"."thread_events"');
    await pool.query('DELETE FROM "kernl"."threads"');

    const model = {
      spec: "1.0" as const,
      provider: "test",
      modelId: "test-model",
    } as unknown as TestLanguageModel;

    const agent1 = new Agent({
      id: "agent-1",
      name: "Agent 1",
      instructions: () => "test",
      model,
    });

    const agent2 = new Agent({
      id: "agent-2",
      name: "Agent 2",
      instructions: () => "test",
      model,
    });

    const agents: AgentRegistry = new Map<string, Agent>([
      ["agent-1", agent1],
      ["agent-2", agent2],
    ]);
    const models: ModelRegistry = new Map<string, TestLanguageModel>([
      ["provider/model", model],
    ]) as unknown as ModelRegistry;

    storage.bind({ agents, models });
    const store = storage.threads;

    const now = Date.now();
    const t1Created = new Date(now - 3000);
    const t2Created = new Date(now - 2000);
    const t3Created = new Date(now - 1000);

    await store.insert({
      id: "list-1",
      namespace: "kernl",
      agentId: "agent-1",
      model: "provider/model",
      state: "running" as any,
      parentTaskId: "task-1",
      createdAt: t1Created,
      updatedAt: t1Created,
    });

    await store.insert({
      id: "list-2",
      namespace: "kernl",
      agentId: "agent-1",
      model: "provider/model",
      state: "stopped" as any,
      parentTaskId: "task-2",
      createdAt: t2Created,
      updatedAt: t2Created,
    });

    await store.insert({
      id: "list-3",
      namespace: "kernl",
      agentId: "agent-2",
      model: "provider/model",
      state: "running" as any,
      parentTaskId: null,
      createdAt: t3Created,
      updatedAt: t3Created,
    });

    // Default ordering: created_at DESC.
    const all = await store.list();
    expect(all.map((t) => t.tid)).toEqual(["list-3", "list-2", "list-1"]);

    // Filter by state (single).
    const running = await store.list({ filter: { state: "running" as any } });
    expect(running.map((t) => t.tid)).toEqual(
      expect.arrayContaining(["list-1", "list-3"]),
    );

    // Filter by state (array).
    const states = await store.list({
      filter: { state: ["running", "stopped"] as any },
    });
    expect(states.map((t) => t.tid)).toEqual(
      expect.arrayContaining(["list-1", "list-2", "list-3"]),
    );

    // Filter by agentId.
    const agent2Threads = await store.list({ filter: { agentId: "agent-2" } });
    expect(agent2Threads.map((t) => t.tid)).toEqual(["list-3"]);

    // Filter by parentTaskId.
    const task2Threads = await store.list({
      filter: { parentTaskId: "task-2" },
    });
    expect(task2Threads.map((t) => t.tid)).toEqual(["list-2"]);

    // Filter by createdAfter / createdBefore.
    const afterT1 = await store.list({ filter: { createdAfter: t1Created } });
    expect(afterT1.map((t) => t.tid)).toEqual(
      expect.arrayContaining(["list-2", "list-3"]),
    );

    const beforeT3 = await store.list({
      filter: { createdBefore: t3Created },
      order: { createdAt: "asc" },
    });
    expect(beforeT3.map((t) => t.tid)).toEqual(["list-1", "list-2"]);

    // Pagination with explicit ordering.
    const page = await store.list({
      order: { createdAt: "asc" },
      limit: 2,
      offset: 1,
    });
    expect(page.map((t) => t.tid)).toEqual(["list-2", "list-3"]);
  });

  it("persists namespace and filters by namespace", async () => {
    await storage.init();

    await pool.query('DELETE FROM "kernl"."thread_events"');
    await pool.query('DELETE FROM "kernl"."threads"');

    const model = {
      spec: "1.0" as const,
      provider: "test",
      modelId: "test-model",
    } as unknown as TestLanguageModel;

    const agent = new Agent({
      id: "agent-1",
      name: "Test Agent",
      instructions: () => "test",
      model,
    });

    const agents: AgentRegistry = new Map<string, Agent>([["agent-1", agent]]);
    const models: ModelRegistry = new Map<string, TestLanguageModel>([
      ["provider/model", model],
    ]) as unknown as ModelRegistry;

    storage.bind({ agents, models });
    const store = storage.threads;

    await store.insert({
      id: "ns-1a",
      namespace: "ns-a",
      agentId: "agent-1",
      model: "provider/model",
    });
    await store.insert({
      id: "ns-2b",
      namespace: "ns-b",
      agentId: "agent-1",
      model: "provider/model",
    });
    await store.insert({
      id: "ns-3a",
      namespace: "ns-a",
      agentId: "agent-1",
      model: "provider/model",
    });

    const a = await store.list({ filter: { namespace: "ns-a" } });
    expect(a.map((t) => t.tid)).toEqual(
      expect.arrayContaining(["ns-1a", "ns-3a"]),
    );
    expect(a.every((t) => t.namespace === "ns-a")).toBe(true);

    const b = await store.list({ filter: { namespace: "ns-b" } });
    expect(b.map((t) => t.tid)).toEqual(["ns-2b"]);
    expect(b[0]?.namespace).toBe("ns-b");

    // get with history should hydrate namespace properly
    const loaded = await store.get("ns-1a", { history: true });
    expect(loaded?.namespace).toBe("ns-a");
    expect(loaded?.context.namespace).toBe("ns-a");
  });
});

