import assert from "assert";
import type { Pool, PoolClient } from "pg";

import {
  SCHEMA_NAME,
  NewThreadCodec,
  ThreadEventRecordCodec,
  type ThreadRecord,
  type ThreadEventRecord,
} from "@kernl-sdk/storage";
import {
  Thread,
  Context,
  type ThreadEvent,
  type AgentRegistry,
  type ModelRegistry,
  type ThreadStore,
  type NewThread,
  type ThreadUpdate,
  type ThreadInclude,
  type ThreadListOptions,
  type ThreadHistoryOptions,
} from "@kernl-sdk/core";

/**
 * PostgreSQL Thread store implementation.
 */
export class PGThreadStore implements ThreadStore {
  private db: Pool | PoolClient;
  private registries: { agents: AgentRegistry; models: ModelRegistry } | null;

  constructor(db: Pool | PoolClient) {
    this.db = db;
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
    let query = `SELECT * FROM ${SCHEMA_NAME}.threads`;
    const values: any[] = [];
    let paramIndex = 1;

    // build WHERE clause
    const conditions: string[] = [];
    if (options?.filter) {
      const { state, agentId, parentTaskId, createdAfter, createdBefore } =
        options.filter;

      if (state) {
        if (Array.isArray(state)) {
          conditions.push(`state = ANY($${paramIndex++})`);
          values.push(state);
        } else {
          conditions.push(`state = $${paramIndex++}`);
          values.push(state);
        }
      }

      if (agentId) {
        conditions.push(`agent_id = $${paramIndex++}`);
        values.push(agentId);
      }

      if (parentTaskId) {
        conditions.push(`parent_task_id = $${paramIndex++}`);
        values.push(parentTaskId);
      }

      if (createdAfter) {
        conditions.push(`created_at > $${paramIndex++}`);
        values.push(createdAfter.getTime());
      }

      if (createdBefore) {
        conditions.push(`created_at < $${paramIndex++}`);
        values.push(createdBefore.getTime());
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // build ORDER BY clause
    const orderClauses: string[] = [];
    if (options?.order?.createdAt) {
      orderClauses.push(`created_at ${options.order.createdAt.toUpperCase()}`);
    }
    if (options?.order?.updatedAt) {
      orderClauses.push(`updated_at ${options.order.updatedAt.toUpperCase()}`);
    }
    if (orderClauses.length > 0) {
      query += ` ORDER BY ${orderClauses.join(", ")}`;
    } else {
      // default: most recent first
      query += ` ORDER BY created_at DESC`;
    }

    if (options?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      values.push(options.offset);
    }

    const result = await this.db.query<ThreadRecord>(query, values);
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
    const record = NewThreadCodec.encode(thread);

    const result = await this.db.query<ThreadRecord>(
      `INSERT INTO ${SCHEMA_NAME}.threads
       (id, agent_id, model, context, tick, state, parent_task_id, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10)
       RETURNING *`,
      [
        record.id,
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
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (patch.tick !== undefined) {
      updates.push(`tick = $${paramIndex++}`);
      values.push(patch.tick);
    }

    if (patch.state !== undefined) {
      updates.push(`state = $${paramIndex++}`);
      values.push(patch.state);
    }

    if (patch.context !== undefined) {
      updates.push(`context = $${paramIndex++}`);
      values.push(JSON.stringify(patch.context));
    }

    if (patch.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(patch.metadata ? JSON.stringify(patch.metadata) : null);
    }

    // always update `updated_at`
    updates.push(`updated_at = $${paramIndex++}`);
    values.push(Date.now());

    values.push(tid); // WHERE id = $N

    const result = await this.db.query<ThreadRecord>(
      `UPDATE ${SCHEMA_NAME}.threads
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values,
    );

    return this.hydrate({ record: result.rows[0] });
  }

  /**
   * Delete a thread and cascade to thread_events.
   */
  async delete(tid: string): Promise<void> {
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
        // Normalize BIGINT (string) to number for zod schema
        timestamp: Number(record.timestamp),
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

    if (!agent || !model) {
      throw new Error(
        `Thread ${record.id} references non-existent agent/model (agent: ${record.agent_id}, model: ${record.model})`,
      );
    }

    return new Thread({
      agent,
      history: events,
      context: new Context(record.context),
      model,
      task: null, // TODO: load from TaskStore when it exists
      tid: record.id,
      tick: record.tick,
      state: record.state,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      storage: this, // pass storage reference so resumed thread can persist
    });
  }
}
