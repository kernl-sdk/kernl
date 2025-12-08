/**
 * PostgreSQL Wakeup store implementation.
 * /packages/storage/pg/src/wakeup/store.ts
 */

import type { Pool, PoolClient } from "pg";

import type {
  WakeupStore,
  NewScheduledWakeup,
  ScheduledWakeup,
  ScheduledWakeupUpdate,
} from "kernl";

import {
  KERNL_SCHEMA_NAME,
  ScheduledWakeupRecordSchema,
  type ScheduledWakeupRecord,
} from "@kernl-sdk/storage";

import { NewScheduledWakeupCodec, ScheduledWakeupCodec } from "./codec";
import { PATCH } from "./sql";

/**
 * Convert ms/bigint ms to a JS number in ms.
 */
const toMs = (value: number | bigint): number =>
  typeof value === "bigint" ? Number(value) : value;

/**
 * Convert ms to epoch seconds (integer).
 */
const toSeconds = (ms: number | bigint): number =>
  Math.floor(toMs(ms) / 1000);

/**
 * PostgreSQL implementation of WakeupStore.
 *
 * Follows the same pattern as PGMemoryStore:
 *  - depends on ensureInit() to create tables
 *  - always validates with Zod Schemas
 *  - converts between domain types and DB records via codecs
 */
export class PGWakeupStore implements WakeupStore {
  private db: Pool | PoolClient;
  private ensureInit: () => Promise<void>;

  constructor(db: Pool | PoolClient, ensureInit: () => Promise<void>) {
    this.db = db;
    this.ensureInit = ensureInit;
  }

  async create(input: NewScheduledWakeup): Promise<ScheduledWakeup> {
    await this.ensureInit();

    const row = NewScheduledWakeupCodec.encode(input);

    const result = await this.db.query<ScheduledWakeupRecord>(
      `INSERT INTO ${KERNL_SCHEMA_NAME}.scheduled_wakeups
       (id, thread_id, run_at_s, reason, woken, claimed_at_s, created_at, updated_at, error)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        row.id,
        row.thread_id,
        row.run_at_s,
        row.reason,
        row.woken,
        row.claimed_at_s,
        row.created_at,
        row.updated_at,
        row.error,
      ],
    );

    const record = ScheduledWakeupRecordSchema.parse(result.rows[0]);
    return ScheduledWakeupCodec.decode(record);
  }

  async get(id: string): Promise<ScheduledWakeup | null> {
    await this.ensureInit();

    const result = await this.db.query<ScheduledWakeupRecord>(
      `SELECT * FROM ${KERNL_SCHEMA_NAME}.scheduled_wakeups WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) return null;

    const record = ScheduledWakeupRecordSchema.parse(result.rows[0]);
    return ScheduledWakeupCodec.decode(record);
  }

  async update(
    id: string,
    patch: ScheduledWakeupUpdate,
  ): Promise<ScheduledWakeup> {
    await this.ensureInit();

    const { sql, params } = PATCH.encode({ patch, startIdx: 2 });

    const result = await this.db.query<ScheduledWakeupRecord>(
      `UPDATE ${KERNL_SCHEMA_NAME}.scheduled_wakeups
       SET ${sql}
       WHERE id = $1
       RETURNING *`,
      [id, ...params],
    );

    if (result.rows.length === 0) {
      throw new Error(`Wakeup with id ${id} not found`);
    }

    const record = ScheduledWakeupRecordSchema.parse(result.rows[0]);
    return ScheduledWakeupCodec.decode(record);
  }

  async delete(id: string): Promise<void> {
    await this.ensureInit();

    await this.db.query(
      `DELETE FROM ${KERNL_SCHEMA_NAME}.scheduled_wakeups WHERE id = $1`,
      [id],
    );
  }

  /**
   * Atomically claim up to `limit` due wakeups.
   *
   * Uses SELECT ... FOR UPDATE SKIP LOCKED pattern.
   */
  async claimDue(
    nowMs: number | bigint,
    limit: number,
  ): Promise<ScheduledWakeup[]> {
    await this.ensureInit();

    const nowMsNum = toMs(nowMs);
    const nowS = toSeconds(nowMs);

    const result = await this.db.query<ScheduledWakeupRecord>(
      `
      WITH due AS (
        SELECT id
        FROM ${KERNL_SCHEMA_NAME}.scheduled_wakeups
        WHERE woken = FALSE
          AND claimed_at_s IS NULL
          AND run_at_s <= $1
        ORDER BY run_at_s ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED
      )
      UPDATE ${KERNL_SCHEMA_NAME}.scheduled_wakeups AS sw
      SET claimed_at_s = $1,
          updated_at = $3
      FROM due
      WHERE sw.id = due.id
      RETURNING sw.*;
      `,
      [nowS, limit, nowMsNum],
    );

    return result.rows.map((row) =>
      ScheduledWakeupCodec.decode(
        ScheduledWakeupRecordSchema.parse(row),
      ),
    );
  }
}
