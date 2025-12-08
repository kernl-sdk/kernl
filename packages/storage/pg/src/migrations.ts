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
];

/**
 * Minimum schema version required by this version of @kernl/pg.
 */
export const REQUIRED_SCHEMA_VERSION = "0001_initial";
