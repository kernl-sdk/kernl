import assert from "assert";
import type { Pool, PoolClient } from "pg";

import {
  Context,
  type AgentRegistry,
  type ModelRegistry,
  type ThreadStore,
  type NewThread,
  type ThreadUpdate,
  type ThreadInclude,
  type ThreadListOptions,
  type ThreadHistoryOptions,
} from "kernl";
import { Thread, type ThreadEvent } from "kernl/internal";
import {
  SCHEMA_NAME,
  NewThreadCodec,
  ThreadEventRecordCodec,
  type ThreadRecord,
  type ThreadEventRecord,
} from "@kernl-sdk/storage";

import { SQL_WHERE, SQL_ORDER, SQL_UPDATE } from "./sql";

/**
 * PostgreSQL Thread store implementation.
 *
 * IMPORTANT: All async methods must call `await this.ensureInit()` before
 * any database operations. This ensures schema/tables exist.
 */
export class PGThreadStore implements ThreadStore {
  private db: Pool | PoolClient;
  private registries: { agents: AgentRegistry; models: ModelRegistry } | null;
  private ensureInit: () => Promise<void>;

  constructor(db: Pool | PoolClient, ensureInit: () => Promise<void>) {
    this.db = db;
    this.ensureInit = ensureInit;
    this.registries = null;
  }

  /**
   * Bind runtime registries for hydrating Thread instances.
   *
   * (TODO): move into abstract ThreadStore class
   */
  bind(registries: { agents: AgentRegistry; models: ModelRegistry }): void {
    this.registries = registries;
  }

  /**
   * Get a thread by id.
   */
  async get(tid: string, include?: ThreadInclude): Promise<Thread | null> {
    await this.ensureInit();

    // JOIN with thread_events if include.history
    if (include?.history) {
      const opts =
        typeof include.history === "object" ? include.history : undefined;

      const params: any[] = [tid];
      let index = 2;
      let eventFilter = "";

      if (opts?.after !== undefined) {
        eventFilter += ` AND e.seq > $${index++}`;
        params.push(opts.after);
      }

      if (opts?.kinds && opts.kinds.length > 0) {
        eventFilter += ` AND e.kind = ANY($${index++})`;
        params.push(opts.kinds);
      }

      const order = opts?.order ?? "asc";
      const limit = opts?.limit ? ` LIMIT ${opts.limit}` : "";

      const query = `
        SELECT
          t.*,
          e.id as event_id,
          e.tid as event_tid,
          e.seq,
          e.kind as event_kind,
          e.timestamp,
          e.data,
          e.metadata as event_metadata
        FROM ${SCHEMA_NAME}.threads t
        LEFT JOIN ${SCHEMA_NAME}.thread_events e ON t.id = e.tid${eventFilter}
        WHERE t.id = $1
        ORDER BY e.seq ${order.toUpperCase()}
        ${limit}
      `;

      const result = await this.db.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      // first row has thread data (all rows have same thread data)
      const first = result.rows[0];
      const record: ThreadRecord = {
        id: first.id,
        namespace: first.namespace,
        agent_id: first.agent_id,
        model: first.model,
        context: first.context,
        tick: first.tick,
        state: first.state,
        parent_task_id: first.parent_task_id,
        metadata: first.metadata,
        created_at: first.created_at,
        updated_at: first.updated_at,
      };

      // collect events from all rows (skip rows where event_id is null)
      const events: ThreadEvent[] = result.rows
        .filter((row) => row.event_id !== null)
        .map((row) =>
          ThreadEventRecordCodec.decode({
            id: row.event_id,
            tid: row.event_tid,
            seq: row.seq,
            kind: row.event_kind,
            timestamp: Number(row.timestamp), // pg returns BIGINT as string by default, normalize to number
            data: row.data,
            metadata: row.event_metadata,
          } as ThreadEventRecord),
        );

      try {
        return this.hydrate({ record, events });
      } catch (error) {
        return null;
      }
    }

    // simple query without events
    const result = await this.db.query<ThreadRecord>(
      `SELECT * FROM ${SCHEMA_NAME}.threads WHERE id = $1`,
      [tid],
    );

    if (result.rows.length === 0) {
      return null;
    }

    try {
      return this.hydrate({ record: result.rows[0] });
    } catch (error) {
      return null;
    }
  }

  /**
   * List threads matching the filter.
   */
  async list(options?: ThreadListOptions): Promise<Thread[]> {
    await this.ensureInit();

    const { sql: where, params } = SQL_WHERE.encode({
      filter: options?.filter,
      startIdx: 1,
    });

    let idx = params.length + 1;
    let query = `SELECT * FROM ${SCHEMA_NAME}.threads`;

    if (where) query += ` WHERE ${where}`;
    query += ` ORDER BY ${SQL_ORDER.encode({ order: options?.order })}`;

    if (options?.limit) {
      query += ` LIMIT $${idx++}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${idx++}`;
      params.push(options.offset);
    }

    const result = await this.db.query<ThreadRecord>(query, params);
    return result.rows
      .map((record) => {
        try {
          return this.hydrate({ record });
        } catch (error) {
          // Skip threads with non-existent agent/model (graceful degradation)
          //
          // (TODO): what do we want to do with this?
          return null;
        }
      })
      .filter((thread) => thread !== null);
  }

  /**
   * Insert a new thread into the store.
   */
  async insert(thread: NewThread): Promise<Thread> {
    await this.ensureInit();

    const record = NewThreadCodec.encode(thread);

    const result = await this.db.query<ThreadRecord>(
      `INSERT INTO ${SCHEMA_NAME}.threads
       (id, namespace, agent_id, model, context, tick, state, parent_task_id, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb, $10, $11)
       RETURNING *`,
      [
        record.id,
        record.namespace,
        record.agent_id,
        record.model,
        record.context,
        record.tick,
        record.state,
        record.parent_task_id,
        record.metadata,
        record.created_at,
        record.updated_at,
      ],
    );

    return this.hydrate({ record: result.rows[0] });
  }

  /**
   * Update thread runtime state.
   */
  async update(tid: string, patch: ThreadUpdate): Promise<Thread> {
    await this.ensureInit();

    const { sql: updates, params } = SQL_UPDATE.encode({ patch, startIdx: 1 });
    const idx = params.length + 1;
    params.push(tid);

    const result = await this.db.query<ThreadRecord>(
      `UPDATE ${SCHEMA_NAME}.threads
       SET ${updates}
       WHERE id = $${idx}
       RETURNING *`,
      params,
    );

    return this.hydrate({ record: result.rows[0] });
  }

  /**
   * Delete a thread and cascade to thread_events.
   */
  async delete(tid: string): Promise<void> {
    await this.ensureInit();
    await this.db.query(`DELETE FROM ${SCHEMA_NAME}.threads WHERE id = $1`, [
      tid,
    ]);
  }

  /**
   * Get the event history for a thread.
   */
  async history(
    tid: string,
    opts?: ThreadHistoryOptions,
  ): Promise<ThreadEvent[]> {
    await this.ensureInit();

    let query = `SELECT * FROM ${SCHEMA_NAME}.thread_events WHERE tid = $1`;
    const values: any[] = [tid];
    let paramIndex = 2;

    // - filter:seq -
    if (opts?.after !== undefined) {
      query += ` AND seq > $${paramIndex++}`;
      values.push(opts.after);
    }

    // - filter:kind -
    if (opts?.kinds && opts.kinds.length > 0) {
      query += ` AND kind = ANY($${paramIndex++})`;
      values.push(opts.kinds);
    }

    // - order -
    const order = opts?.order ?? "asc";
    query += ` ORDER BY seq ${order.toUpperCase()}`;

    // - limit -
    if (opts?.limit !== undefined) {
      query += ` LIMIT $${paramIndex++}`;
      values.push(opts.limit);
    }

    const result = await this.db.query<ThreadEventRecord>(query, values);

    return result.rows.map((record) =>
      ThreadEventRecordCodec.decode({
        ...record,
        timestamp: Number(record.timestamp), // normalize BIGINT (string) to number for zod schema
      } as ThreadEventRecord),
    );
  }

  /**
   * Append events to the thread history.
   *
   * Semantics:
   * - Guaranteed per-thread ordering via monotonically increasing `seq`
   * - Idempotent on `(tid, event.id)`: duplicate ids MUST NOT create duplicate rows
   * - Events maintain insertion order
   *
   * NOTE: Thread class manages monotonic seq and timestamp assignment, is the only entrypoint.
   */
  async append(events: ThreadEvent[]): Promise<void> {
    if (events.length === 0) return;
    await this.ensureInit();

    const records = events.map((e) => ThreadEventRecordCodec.encode(e));

    const values: any[] = [];
    const placeholders: string[] = [];

    let index = 1;
    for (const record of records) {
      placeholders.push(
        `($${index++}, $${index++}, $${index++}, $${index++}, $${index++}, $${index++}::jsonb, $${index++}::jsonb)`,
      );
      values.push(
        record.id,
        record.tid,
        record.seq,
        record.kind,
        record.timestamp,
        record.data,
        record.metadata,
      );
    }

    // insert with ON CONFLICT DO NOTHING for idempotency
    await this.db.query(
      `INSERT INTO ${SCHEMA_NAME}.thread_events
       (id, tid, seq, kind, timestamp, data, metadata)
       VALUES ${placeholders.join(", ")}
       ON CONFLICT (tid, id) DO NOTHING`,
      values,
    );
  }

  /**
   * Hydrate a Thread instance from a database record.
   */
  hydrate(thread: { record: ThreadRecord; events?: ThreadEvent[] }): Thread {
    assert(
      this.registries,
      "registries should be bound to storage in Kernl constructor",
    );

    const { record, events = [] } = thread;

    const agent = this.registries.agents.get(record.agent_id);
    const model = this.registries.models.get(record.model);

    // (TODO): we might want to allow this in the future, unclear how it would look though..
    if (!agent || !model) {
      throw new Error(
        `Thread ${record.id} references non-existent agent/model (agent: ${record.agent_id}, model: ${record.model})`,
      );
    }

    return new Thread({
      agent,
      history: events,
      context: new Context(record.namespace, record.context),
      model,
      task: null, // TODO: load from TaskStore when it exists
      tid: record.id,
      namespace: record.namespace,
      tick: record.tick,
      state: record.state,
      metadata: record.metadata,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      storage: this, // pass storage reference so resumed thread can persist
      persisted: true,
    });
  }
}
