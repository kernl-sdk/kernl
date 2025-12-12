/**
 * PostgreSQL Memory store implementation.
 * /packages/storage/pg/src/memory/store.ts
 */

import type { Pool, PoolClient } from "pg";

import type {
  MemoryStore,
  MemoryRecord,
  NewMemory,
  MemoryRecordUpdate,
  MemoryListOptions,
} from "kernl";
import {
  KERNL_SCHEMA_NAME,
  MemoryRecordCodec,
  NewMemoryCodec,
  type MemoryDBRecord,
} from "@kernl-sdk/storage";

import { SQL_WHERE, ORDER, SQL_UPDATE } from "./sql";

/**
 * PostgreSQL memory store implementation.
 *
 * All async methods call `ensureInit()` before database operations
 * to ensure schema/tables exist.
 */
export class PGMemoryStore implements MemoryStore {
  private db: Pool | PoolClient;
  private ensureInit: () => Promise<void>;

  constructor(db: Pool | PoolClient, ensureInit: () => Promise<void>) {
    this.db = db;
    this.ensureInit = ensureInit;
  }

  /**
   * Get a memory by ID.
   */
  async get(id: string): Promise<MemoryRecord | null> {
    await this.ensureInit();

    const result = await this.db.query<MemoryDBRecord>(
      `SELECT * FROM ${KERNL_SCHEMA_NAME}.memories WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return MemoryRecordCodec.decode(result.rows[0]);
  }

  /**
   * List memories matching optional filter criteria.
   */
  async list(options?: MemoryListOptions): Promise<MemoryRecord[]> {
    await this.ensureInit();

    const { sql: where, params } = SQL_WHERE.encode({
      filter: options?.filter,
      startIdx: 1,
    });

    let idx = params.length + 1;
    let query = `SELECT * FROM ${KERNL_SCHEMA_NAME}.memories`;

    // build where + order by
    if (where) query += ` WHERE ${where}`;
    query += ` ORDER BY ${ORDER.encode({ order: options?.order })}`;

    // add limit + offset
    if (options?.limit) {
      query += ` LIMIT $${idx++}`;
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ` OFFSET $${idx++}`;
      params.push(options.offset);
    }

    const result = await this.db.query<MemoryDBRecord>(query, params);
    return result.rows.map((row) => MemoryRecordCodec.decode(row));
  }

  /**
   * Create a new memory record.
   */
  async create(memory: NewMemory): Promise<MemoryRecord> {
    await this.ensureInit();

    const row = NewMemoryCodec.encode(memory);

    const result = await this.db.query<MemoryDBRecord>(
      `INSERT INTO ${KERNL_SCHEMA_NAME}.memories
       (id, namespace, entity_id, agent_id, kind, collection, content, wmem, smem_expires_at, timestamp, created_at, updated_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13::jsonb)
       RETURNING *`,
      [
        row.id,
        row.namespace,
        row.entity_id,
        row.agent_id,
        row.kind,
        row.collection,
        JSON.stringify(row.content), // ??
        row.wmem,
        row.smem_expires_at,
        row.timestamp,
        row.created_at,
        row.updated_at,
        row.metadata ? JSON.stringify(row.metadata) : null,
      ],
    );

    return MemoryRecordCodec.decode(result.rows[0]);
  }

  /**
   * Update a memory record.
   */
  async update(id: string, patch: MemoryRecordUpdate): Promise<MemoryRecord> {
    await this.ensureInit();

    const { sql: updates, params } = SQL_UPDATE.encode({ patch, startIdx: 1 });
    const idx = params.length + 1;
    params.push(id);

    // (TODO): might we not want to return the whole record sometimes?
    const result = await this.db.query<MemoryDBRecord>(
      `UPDATE ${KERNL_SCHEMA_NAME}.memories SET ${updates} WHERE id = $${idx} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) {
      throw new Error(`memory not found: ${id}`);
    }

    return MemoryRecordCodec.decode(result.rows[0]);
  }

  /**
   * Delete a memory by ID.
   */
  async delete(id: string): Promise<void> {
    await this.ensureInit();
    await this.db.query(
      `DELETE FROM ${KERNL_SCHEMA_NAME}.memories WHERE id = $1`,
      [id],
    );
  }

  /**
   * Delete multiple memories by ID.
   */
  async mdelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.ensureInit();
    await this.db.query(
      `DELETE FROM ${KERNL_SCHEMA_NAME}.memories WHERE id = ANY($1)`,
      [ids],
    );
  }
}
