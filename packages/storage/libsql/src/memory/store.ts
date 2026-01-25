/**
 * LibSQL Memory store implementation.
 */

import type { Client, InValue } from "@libsql/client";

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
} from "@kernl-sdk/storage";

import { SQL_WHERE, ORDER, SQL_UPDATE } from "./sql";
import { RowToMemoryRecord } from "./row";
import { expandarray } from "../sql";

// SQLite doesn't support schemas, so we use table name prefix
const MEMORIES_TABLE = `${KERNL_SCHEMA_NAME}_memories`;

/**
 * LibSQL memory store implementation.
 *
 * All async methods call `ensureInit()` before database operations
 * to ensure schema/tables exist.
 */
export class LibSQLMemoryStore implements MemoryStore {
  private db: Client;
  private ensureInit: () => Promise<void>;

  constructor(db: Client, ensureInit: () => Promise<void>) {
    this.db = db;
    this.ensureInit = ensureInit;
  }

  /**
   * Get a memory by ID.
   */
  async get(id: string): Promise<MemoryRecord | null> {
    await this.ensureInit();

    const result = await this.db.execute({
      sql: `SELECT * FROM ${MEMORIES_TABLE} WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    return MemoryRecordCodec.decode(RowToMemoryRecord.encode(result.rows[0]));
  }

  /**
   * List memories matching optional filter criteria.
   */
  async list(options?: MemoryListOptions): Promise<MemoryRecord[]> {
    await this.ensureInit();

    const { sql: where, params } = SQL_WHERE.encode({
      filter: options?.filter,
    });

    let query = `SELECT * FROM ${MEMORIES_TABLE}`;

    // build where + order by
    if (where) query += ` WHERE ${where}`;
    query += ` ORDER BY ${ORDER.encode({ order: options?.order })}`;

    const args = [...params] as InValue[];

    // add limit + offset
    // SQLite requires LIMIT when using OFFSET, so use -1 for unlimited
    if (options?.limit || options?.offset) {
      query += ` LIMIT ?`;
      args.push(options?.limit ?? -1);
    }
    if (options?.offset) {
      query += ` OFFSET ?`;
      args.push(options.offset);
    }

    const result = await this.db.execute({ sql: query, args });
    return result.rows.map((row) =>
      MemoryRecordCodec.decode(RowToMemoryRecord.encode(row)),
    );
  }

  /**
   * Create a new memory record.
   */
  async create(memory: NewMemory): Promise<MemoryRecord> {
    await this.ensureInit();

    const row = NewMemoryCodec.encode(memory);

    const result = await this.db.execute({
      sql: `INSERT INTO ${MEMORIES_TABLE}
       (id, namespace, entity_id, agent_id, kind, collection, content, wmem, smem_expires_at, timestamp, created_at, updated_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      args: [
        row.id,
        row.namespace,
        row.entity_id,
        row.agent_id,
        row.kind,
        row.collection,
        JSON.stringify(row.content),
        row.wmem ? 1 : 0, // SQLite uses 0/1 for boolean
        row.smem_expires_at,
        row.timestamp,
        row.created_at,
        row.updated_at,
        row.metadata ? JSON.stringify(row.metadata) : null,
      ],
    });

    return MemoryRecordCodec.decode(RowToMemoryRecord.encode(result.rows[0]));
  }

  /**
   * Update a memory record.
   */
  async update(id: string, patch: MemoryRecordUpdate): Promise<MemoryRecord> {
    await this.ensureInit();

    const { sql: updates, params } = SQL_UPDATE.encode({ patch });
    const args = [...params, id] as InValue[];

    const result = await this.db.execute({
      sql: `UPDATE ${MEMORIES_TABLE} SET ${updates} WHERE id = ? RETURNING *`,
      args,
    });

    if (result.rows.length === 0) {
      throw new Error(`memory not found: ${id}`);
    }

    return MemoryRecordCodec.decode(RowToMemoryRecord.encode(result.rows[0]));
  }

  /**
   * Delete a memory by ID.
   */
  async delete(id: string): Promise<void> {
    await this.ensureInit();
    await this.db.execute({
      sql: `DELETE FROM ${MEMORIES_TABLE} WHERE id = ?`,
      args: [id],
    });
  }

  /**
   * Delete multiple memories by ID.
   */
  async mdelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.ensureInit();

    const { placeholders, params } = expandarray(ids);
    await this.db.execute({
      sql: `DELETE FROM ${MEMORIES_TABLE} WHERE id IN (${placeholders})`,
      args: params as InValue[],
    });
  }
}
