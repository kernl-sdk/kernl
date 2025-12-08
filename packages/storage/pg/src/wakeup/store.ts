import type { Pool, PoolClient } from "pg";

import type {
  WakeupStore,
  NewScheduledWakeup,
  ScheduledWakeup,
  ScheduledWakeupUpdate,
} from "kernl";
import {
  KERNL_SCHEMA_NAME,
  NewScheduledWakeupCodec,
  ScheduledWakeupRecordCodec,
  type ScheduledWakeupRecord,
} from "@kernl-sdk/storage";

/**
 * PostgreSQL wakeup store implementation.
 */
export class PGWakeupStore implements WakeupStore {
  private db: Pool | PoolClient;
  private ensureInit: () => Promise<void>;

  constructor(db: Pool | PoolClient, ensureInit: () => Promise<void>) {
    this.db = db;
    this.ensureInit = ensureInit;
  }

  /**
   * Create a scheduled wakeup.
   */
  async create(wakeup: NewScheduledWakeup): Promise<ScheduledWakeup> {
    await this.ensureInit();
    const record = NewScheduledWakeupCodec.encode(wakeup);

    const result = await this.db.query<ScheduledWakeupRecord>(
      `INSERT INTO ${KERNL_SCHEMA_NAME}.scheduled_wakeups
       (id, thread_id, wait_time_ms, reason, woken, claimed_at, created_at, updated_at, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        record.id,
        record.thread_id,
        record.wait_time_ms,
        record.reason,
        record.woken,
        record.claimed_at,
        record.created_at,
        record.updated_at,
        record.error,
      ],
    );

    return ScheduledWakeupRecordCodec.decode(result.rows[0]);
  }

  /**
   * Atomically claim due wakeups using SKIP LOCKED to avoid double-processing.
   */
  async claimDue(limit: number): Promise<ScheduledWakeup[]> {
    await this.ensureInit();
    if (limit <= 0) return [];

    const now = Date.now();

    const result = await this.db.query<ScheduledWakeupRecord>(
      `
      WITH due AS (
        SELECT id
        FROM ${KERNL_SCHEMA_NAME}.scheduled_wakeups
        WHERE woken = false
          AND claimed_at IS NULL
          AND created_at + wait_time_ms <= $1::bigint
        ORDER BY created_at ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED
      )
      UPDATE ${KERNL_SCHEMA_NAME}.scheduled_wakeups w
      SET claimed_at = $1,
          updated_at = $1
      FROM due
      WHERE w.id = due.id
      RETURNING w.*
    `,
      [now, limit],
    );

    return result.rows.map((row) => ScheduledWakeupRecordCodec.decode(row));
  }

  /**
   * Update wakeup status/error fields.
   */
  async update(
    id: string,
    patch: ScheduledWakeupUpdate,
  ): Promise<ScheduledWakeup> {
    await this.ensureInit();

    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (patch.woken !== undefined) {
      fields.push(`woken = $${idx++}`);
      params.push(patch.woken);
    }
    if (patch.claimedAt !== undefined) {
      fields.push(`claimed_at = $${idx++}`);
      params.push(patch.claimedAt ? patch.claimedAt.getTime() : null);
    }

    if (patch.error !== undefined) {
      fields.push(`error = $${idx++}`);
      params.push(patch.error);
    }

    const updatedAt = patch.updatedAt?.getTime() ?? Date.now();
    fields.push(`updated_at = $${idx++}`);
    params.push(updatedAt);

    params.push(id);
    const idParam = idx;

    const result = await this.db.query<ScheduledWakeupRecord>(
      `
      UPDATE ${KERNL_SCHEMA_NAME}.scheduled_wakeups
      SET ${fields.join(", ")}
      WHERE id = $${idParam}
      RETURNING *
    `,
      params,
    );

    if (result.rows.length === 0) {
      throw new Error(`Wakeup ${id} not found`);
    }

    return ScheduledWakeupRecordCodec.decode(result.rows[0]);
  }

  /**
   * Cancel all pending wakeups for a thread.
   */
  async cancelForThread(tid: string): Promise<void> {
    await this.ensureInit();
    await this.db.query(
      `
      DELETE FROM ${KERNL_SCHEMA_NAME}.scheduled_wakeups
      WHERE thread_id = $1 AND woken = false
    `,
      [tid],
    );
  }
}
