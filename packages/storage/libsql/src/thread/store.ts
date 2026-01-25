/**
 * LibSQL Thread store implementation.
 */

import assert from "assert";
import type { Client, InValue } from "@libsql/client";

import {
  Agent,
  Context,
  type IAgentRegistry,
  type IModelRegistry,
  type ThreadStore,
  type NewThread,
  type ThreadUpdate,
  type ThreadInclude,
  type ThreadListOptions,
  type ThreadHistoryOptions,
} from "kernl";
import { Thread, type ThreadEvent } from "kernl/internal";
import {
  KERNL_SCHEMA_NAME,
  NewThreadCodec,
  ThreadEventRecordCodec,
  type ThreadRecord,
} from "@kernl-sdk/storage";

import { SQL_WHERE, SQL_ORDER, SQL_UPDATE } from "./sql";
import {
  RowToThreadRecord,
  RowToEventRecord,
  RowToEventRecordDirect,
} from "./row";
import { expandarray } from "../sql";

// SQLite doesn't support schemas, so we use table name prefix
const THREADS_TABLE = `${KERNL_SCHEMA_NAME}_threads`;
const THREAD_EVENTS_TABLE = `${KERNL_SCHEMA_NAME}_thread_events`;

/**
 * LibSQL Thread store implementation.
 *
 * All async methods call `ensureInit()` before database operations
 * to ensure schema/tables exist.
 */
export class LibSQLThreadStore implements ThreadStore {
  private db: Client;
  private registries: { agents: IAgentRegistry; models: IModelRegistry } | null;
  private ensureInit: () => Promise<void>;

  constructor(db: Client, ensureInit: () => Promise<void>) {
    this.db = db;
    this.ensureInit = ensureInit;
    this.registries = null;
  }

  /**
   * Bind runtime registries for hydrating Thread instances.
   */
  bind(registries: { agents: IAgentRegistry; models: IModelRegistry }): void {
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

      const params: InValue[] = [tid];
      let eventFilter = "";

      if (opts?.after !== undefined) {
        eventFilter += ` AND e.seq > ?`;
        params.push(opts.after);
      }

      if (opts?.kinds && opts.kinds.length > 0) {
        const { placeholders, params: kindParams } = expandarray(opts.kinds);
        eventFilter += ` AND e.kind IN (${placeholders})`;
        params.push(...(kindParams as InValue[]));
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
        FROM ${THREADS_TABLE} t
        LEFT JOIN ${THREAD_EVENTS_TABLE} e ON t.id = e.tid${eventFilter}
        WHERE t.id = ?
        ORDER BY e.seq ${order.toUpperCase()}
        ${limit}
      `;

      // Move tid to end of params (WHERE t.id = ?)
      const finalParams = [...params.slice(1), tid];

      const result = await this.db.execute({ sql: query, args: finalParams });

      if (result.rows.length === 0) {
        return null;
      }

      // first row has thread data (all rows have same thread data)
      const record = RowToThreadRecord.encode(result.rows[0]);

      // collect events from all rows (skip rows where event_id is null)
      const events: ThreadEvent[] = result.rows
        .filter((row) => row.event_id !== null)
        .map((row) =>
          ThreadEventRecordCodec.decode(RowToEventRecord.encode(row)),
        );

      try {
        return this.hydrate({ record, events });
      } catch {
        return null;
      }
    }

    // simple query without events
    const result = await this.db.execute({
      sql: `SELECT * FROM ${THREADS_TABLE} WHERE id = ?`,
      args: [tid],
    });

    if (result.rows.length === 0) {
      return null;
    }

    try {
      return this.hydrate({ record: RowToThreadRecord.encode(result.rows[0]) });
    } catch {
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
    });

    let query = `SELECT * FROM ${THREADS_TABLE}`;

    if (where) query += ` WHERE ${where}`;
    query += ` ORDER BY ${SQL_ORDER.encode({ order: options?.order })}`;

    const args = [...params] as InValue[];

    if (options?.limit) {
      query += ` LIMIT ?`;
      args.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET ?`;
      args.push(options.offset);
    }

    const result = await this.db.execute({ sql: query, args });

    return result.rows
      .map((row) => {
        try {
          return this.hydrate({ record: RowToThreadRecord.encode(row) });
        } catch {
          // Skip threads with non-existent agent/model (graceful degradation)
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

    const result = await this.db.execute({
      sql: `INSERT INTO ${THREADS_TABLE}
       (id, namespace, agent_id, model, context, tick, state, parent_task_id, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      args: [
        record.id,
        record.namespace,
        record.agent_id,
        record.model,
        JSON.stringify(record.context),
        record.tick,
        record.state,
        record.parent_task_id,
        record.metadata ? JSON.stringify(record.metadata) : null,
        record.created_at,
        record.updated_at,
      ],
    });

    return this.hydrate({ record: RowToThreadRecord.encode(result.rows[0]) });
  }

  /**
   * Update thread runtime state.
   */
  async update(tid: string, patch: ThreadUpdate): Promise<Thread> {
    await this.ensureInit();

    const { sql: updates, params } = SQL_UPDATE.encode({ patch });
    const args = [...params, tid] as InValue[];

    const result = await this.db.execute({
      sql: `UPDATE ${THREADS_TABLE}
       SET ${updates}
       WHERE id = ?
       RETURNING *`,
      args,
    });

    return this.hydrate({ record: RowToThreadRecord.encode(result.rows[0]) });
  }

  /**
   * Delete a thread and cascade to thread_events.
   */
  async delete(tid: string): Promise<void> {
    await this.ensureInit();
    await this.db.execute({
      sql: `DELETE FROM ${THREADS_TABLE} WHERE id = ?`,
      args: [tid],
    });
  }

  /**
   * Get the event history for a thread.
   */
  async history(
    tid: string,
    opts?: ThreadHistoryOptions,
  ): Promise<ThreadEvent[]> {
    await this.ensureInit();

    let query = `SELECT * FROM ${THREAD_EVENTS_TABLE} WHERE tid = ?`;
    const args: InValue[] = [tid];

    // - filter:seq -
    if (opts?.after !== undefined) {
      query += ` AND seq > ?`;
      args.push(opts.after);
    }

    // - filter:kind -
    if (opts?.kinds && opts.kinds.length > 0) {
      const { placeholders, params: kindParams } = expandarray(opts.kinds);
      query += ` AND kind IN (${placeholders})`;
      args.push(...(kindParams as InValue[]));
    }

    // - order -
    const order = opts?.order ?? "asc";
    query += ` ORDER BY seq ${order.toUpperCase()}`;

    // - limit -
    if (opts?.limit !== undefined) {
      query += ` LIMIT ?`;
      args.push(opts.limit);
    }

    const result = await this.db.execute({ sql: query, args });

    return result.rows.map((row) =>
      ThreadEventRecordCodec.decode(RowToEventRecordDirect.encode(row)),
    );
  }

  /**
   * Append events to the thread history.
   *
   * Semantics:
   * - Guaranteed per-thread ordering via monotonically increasing `seq`
   * - Idempotent on `(tid, event.id)`: duplicate ids MUST NOT create duplicate rows
   * - Events maintain insertion order
   */
  async append(events: ThreadEvent[]): Promise<void> {
    if (events.length === 0) return;
    await this.ensureInit();

    const records = events.map((e) => ThreadEventRecordCodec.encode(e));

    const placeholders: string[] = [];
    const values: InValue[] = [];

    for (const record of records) {
      placeholders.push(`(?, ?, ?, ?, ?, ?, ?)`);
      values.push(
        record.id,
        record.tid,
        record.seq,
        record.kind,
        record.timestamp,
        record.data ? JSON.stringify(record.data) : null,
        record.metadata ? JSON.stringify(record.metadata) : null,
      );
    }

    // insert with ON CONFLICT DO NOTHING for idempotency
    await this.db.execute({
      sql: `INSERT INTO ${THREAD_EVENTS_TABLE}
       (id, tid, seq, kind, timestamp, data, metadata)
       VALUES ${placeholders.join(", ")}
       ON CONFLICT (tid, id) DO NOTHING`,
      args: values,
    });
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

    // safety: threads only exist for llm agents
    if (agent.kind !== "llm") {
      throw new Error(
        `Thread ${record.id} references non-llm agent ${record.agent_id} (kind: ${agent.kind})`,
      );
    }

    return new Thread({
      agent: agent as Agent,
      history: events,
      context: new Context(record.namespace, record.context),
      model,
      task: null, // TODO: load from TaskStore when it exists
      tid: record.id,
      namespace: record.namespace,
      tick: record.tick,
      state: record.state,
      metadata: record.metadata,
      createdAt: new Date(Number(record.created_at)),
      updatedAt: new Date(Number(record.updated_at)),
      storage: this, // pass storage reference so resumed thread can persist
      persisted: true,
    });
  }
}
