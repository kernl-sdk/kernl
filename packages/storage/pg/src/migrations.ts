/**
 * Database migrations.
 */

import type { PoolClient } from "pg";
import type { Table, Column } from "@kernl/storage";
import { TABLE_THREADS, TABLE_THREAD_EVENTS, SCHEMA_NAME } from "@kernl/storage";

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
export const migrations: Migration[] = [
  {
    id: "0001_initial",
    async up(ctx) {
      await ctx.createTable(TABLE_THREADS);
      await ctx.createTable(TABLE_THREAD_EVENTS);
    },
  },
];

/**
 * Minimum schema version required by this version of @kernl/pg.
 */
export const REQUIRED_SCHEMA_VERSION = "0001_initial";
