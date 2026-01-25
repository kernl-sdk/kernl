/**
 * Database migrations for LibSQL.
 */

import type { Client, Transaction } from "@libsql/client";
import type { Table, Column } from "@kernl-sdk/storage";
import {
  KERNL_SCHEMA_NAME,
  TABLE_THREADS,
  TABLE_THREAD_EVENTS,
  TABLE_MEMORIES,
} from "@kernl-sdk/storage";

import { SQL_IDENTIFIER_REGEX } from "./sql";

/**
 * Migration context with helpers.
 */
export interface MigrationContext {
  client: Client | Transaction;
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
];

/**
 * Minimum schema version required by this version of @kernl/libsql.
 */
export const REQUIRED_SCHEMA_VERSION = "0001_initial";

/**
 * Map PostgreSQL types to SQLite types.
 */
function mapColumnType(type: string): string {
  switch (type.toLowerCase()) {
    case "jsonb":
      return "TEXT"; // Store JSON as TEXT
    case "bigint":
      return "INTEGER"; // SQLite INTEGER can hold 64-bit
    case "boolean":
      return "INTEGER"; // SQLite uses 0/1 for boolean
    default:
      return type.toUpperCase();
  }
}

/**
 * Encode a value for use in a DEFAULT clause.
 */
function encodeDefault(col: Column, value: unknown): string {
  if (value === null || value === undefined) return "NULL";

  const type = col.type.toLowerCase();
  switch (type) {
    case "text":
      return `'${String(value).replace(/'/g, "''")}'`;
    case "integer":
    case "bigint":
      return String(value);
    case "boolean":
      return value ? "1" : "0";
    case "jsonb":
      return `'${JSON.stringify(value)}'`;
    default:
      return String(value);
  }
}

/**
 * Create a table from its definition.
 *
 * This function handles the conversion from the generic table definition
 * to SQLite-compatible DDL.
 */
export async function createTable(
  client: Client | Transaction,
  table: Table<string, Record<string, Column>>,
): Promise<void> {
  if (!SQL_IDENTIFIER_REGEX.test(table.name)) {
    throw new Error(`Invalid table name: ${table.name}`);
  }

  const columns: string[] = [];
  const tableConstraints: string[] = [];
  const indexes: { name: string; columns: string[]; unique?: boolean }[] = [];

  // build column definitions
  for (const name in table.columns) {
    const col = table.columns[name];
    const sqlType = mapColumnType(col.type);

    const constraints: string[] = [];
    if (col._pk) constraints.push("PRIMARY KEY");
    if (col._unique) constraints.push("UNIQUE");
    if (!col._nullable && !col._pk) constraints.push("NOT NULL");
    if (col._default !== undefined) {
      constraints.push(`DEFAULT ${encodeDefault(col, col._default)}`);
    }

    // foreign key reference
    if (col._fk) {
      let ref = `REFERENCES "${KERNL_SCHEMA_NAME}_${col._fk.table}" ("${col._fk.column}")`;
      if (col._onDelete) {
        ref += ` ON DELETE ${col._onDelete}`;
      }
      constraints.push(ref);
    }

    columns.push(
      `"${name}" ${sqlType} ${constraints.join(" ")}`.trim(),
    );
  }

  // table-level constraints
  if (table.constraints) {
    for (const constraint of table.constraints) {
      switch (constraint.kind) {
        case "unique": {
          const name =
            constraint.name ??
            `${table.name}_${constraint.columns.join("_")}_unique`;
          const cols = constraint.columns.map((c) => `"${c}"`).join(", ");
          tableConstraints.push(`CONSTRAINT "${name}" UNIQUE (${cols})`);
          break;
        }

        case "pkey": {
          const name = constraint.name ?? `${table.name}_pkey`;
          const cols = constraint.columns.map((c) => `"${c}"`).join(", ");
          tableConstraints.push(`CONSTRAINT "${name}" PRIMARY KEY (${cols})`);
          break;
        }

        case "fkey": {
          throw new Error(
            "Composite foreign keys not yet supported. Use column-level .references() for single-column FKs.",
          );
        }

        case "check": {
          const name = constraint.name ?? `${table.name}_check`;
          tableConstraints.push(
            `CONSTRAINT "${name}" CHECK (${constraint.expression})`,
          );
          break;
        }

        case "index": {
          // collect indexes to create after table
          indexes.push({
            name: `idx_${table.name}_${constraint.columns.join("_")}`,
            columns: constraint.columns,
            unique: constraint.unique,
          });
          break;
        }
      }
    }
  }

  const allConstraints = [...columns, ...tableConstraints];

  // Use schema prefix in table name (SQLite doesn't have schemas)
  const fullTableName = `${KERNL_SCHEMA_NAME}_${table.name}`;

  const sql = `
    CREATE TABLE IF NOT EXISTS "${fullTableName}" (
      ${allConstraints.join(",\n      ")}
    )
  `.trim();

  await client.execute(sql);

  // create indexes
  for (const index of indexes) {
    const uniqueKeyword = index.unique ? "UNIQUE " : "";
    const cols = index.columns.map((c) => `"${c}"`).join(", ");
    const indexSql = `
      CREATE ${uniqueKeyword}INDEX IF NOT EXISTS "${index.name}"
      ON "${fullTableName}" (${cols})
    `.trim();
    await client.execute(indexSql);
  }
}
