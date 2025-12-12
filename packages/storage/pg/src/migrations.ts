/**
 * Database migrations.
 */

import type { PoolClient } from "pg";
import type { Table, Column } from "@kernl-sdk/storage";
import {
  TABLE_THREADS,
  TABLE_THREAD_EVENTS,
  TABLE_MEMORIES,
  TABLE_SCHEDULED_WAKEUPS,
} from "@kernl-sdk/storage";

/**
 * Migration context with helpers.
 */
export interface MigrationContext {
  client: PoolClient;
  createTable: (table: Table<string, Record<string, Column>>) => Promise<void>;
}

export interface Migration {
  id: string;
  up: (ctx: MigrationContext) => Promise<void>;
}

/**
 * List of all migrations in order.
 */
export const MIGRATIONS: Migration[] = [
  {
    id: "000_enable_vector",
    async up(ctx) {
      await ctx.client.query("CREATE EXTENSION IF NOT EXISTS vector");
    },
  },
  {
    id: "001_threads",
    async up(ctx) {
      await ctx.createTable(TABLE_THREADS);
      await ctx.createTable(TABLE_THREAD_EVENTS);
    },
  },
  {
    id: "002_memories",
    async up(ctx) {
      await ctx.createTable(TABLE_MEMORIES);
    },
  },
  {
    id: "003_scheduled_wakeups",
    async up(ctx) {
      await ctx.createTable(TABLE_SCHEDULED_WAKEUPS);
    },
  },
  {
    id: "004_scheduled_wakeups_v2",
    async up(ctx) {
      // v1 -> v2:
      // - run_at_s -> wakeup_at
      // - add sleep_for
      // - convert created_at/updated_at from ms -> seconds (if needed)
      // - backfill sleep_for for existing rows
      const schema = "kernl";

      const colsRes = await ctx.client.query<{ column_name: string }>(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'scheduled_wakeups'
        `,
        [schema],
      );

      if (colsRes.rows.length === 0) return;

      const cols = new Set(colsRes.rows.map((r) => r.column_name));

      if (cols.has("run_at_s") && !cols.has("wakeup_at")) {
        await ctx.client.query(
          `ALTER TABLE ${schema}.scheduled_wakeups RENAME COLUMN run_at_s TO wakeup_at`,
        );
        cols.delete("run_at_s");
        cols.add("wakeup_at");
      }

      // If we somehow ended up with both columns, keep wakeup_at and drop the old name.
      if (cols.has("run_at_s") && cols.has("wakeup_at")) {
        await ctx.client.query(
          `ALTER TABLE ${schema}.scheduled_wakeups DROP COLUMN run_at_s`,
        );
        cols.delete("run_at_s");
      }

      if (!cols.has("sleep_for")) {
        await ctx.client.query(
          `ALTER TABLE ${schema}.scheduled_wakeups ADD COLUMN sleep_for bigint`,
        );
        cols.add("sleep_for");
      }

      // Convert ms -> seconds only when the values are clearly ms.
      await ctx.client.query(
        `
        UPDATE ${schema}.scheduled_wakeups
        SET created_at = created_at / 1000,
            updated_at = updated_at / 1000
        WHERE created_at > 100000000000 OR updated_at > 100000000000;
        `,
      );

      // Backfill sleep_for for existing rows.
      await ctx.client.query(
        `
        UPDATE ${schema}.scheduled_wakeups
        SET sleep_for = GREATEST(0, wakeup_at - created_at)
        WHERE sleep_for IS NULL;
        `,
      );

      // Enforce non-null/default after backfill.
      await ctx.client.query(
        `ALTER TABLE ${schema}.scheduled_wakeups ALTER COLUMN sleep_for SET DEFAULT 0`,
      );
      await ctx.client.query(
        `ALTER TABLE ${schema}.scheduled_wakeups ALTER COLUMN sleep_for SET NOT NULL`,
      );

      // Ensure the polling indexes exist (safe even if duplicates already exist under other names).
      await ctx.client.query(
        `CREATE INDEX IF NOT EXISTS scheduled_wakeups_woken_wakeup_at_idx ON ${schema}.scheduled_wakeups (woken, wakeup_at)`,
      );
      await ctx.client.query(
        `CREATE INDEX IF NOT EXISTS scheduled_wakeups_thread_id_idx ON ${schema}.scheduled_wakeups (thread_id)`,
      );
      await ctx.client.query(
        `CREATE INDEX IF NOT EXISTS scheduled_wakeups_claimed_at_s_idx ON ${schema}.scheduled_wakeups (claimed_at_s)`,
      );
    },
  },

];

/**
 * Minimum schema version required by this version of @kernl/pg.
 */
export const REQUIRED_SCHEMA_VERSION = "0001_initial";
