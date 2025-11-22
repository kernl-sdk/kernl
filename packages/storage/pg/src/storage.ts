import assert from "assert";
import type { Pool, PoolClient } from "pg";

/* workspace */
import type { Table, Column, IndexConstraint } from "@kernl-sdk/storage";
import { SCHEMA_NAME, TABLE_MIGRATIONS } from "@kernl-sdk/storage";
import type {
  AgentRegistry,
  ModelRegistry,
  KernlStorage,
  Transaction,
} from "@kernl-sdk/core";
import { UnimplementedError } from "@kernl-sdk/shared/lib";

/* pg */
import { PGThreadStore } from "./thread/store";
import { SQL_IDENTIFIER_REGEX } from "./sql";
import { migrations } from "./migrations";

/**
 * PostgreSQL storage configuration.
 */
export interface PGStorageConfig {
  /**
   * Pool instance for database connections.
   */
  pool: Pool;
}

/**
 * PostgreSQL storage adapter.
 */
export class PGStorage implements KernlStorage {
  private pool: Pool;

  threads: PGThreadStore;

  constructor(config: PGStorageConfig) {
    this.pool = config.pool;
    this.threads = new PGThreadStore(this.pool);
  }

  /**
   * Bind runtime registries to storage.
   */
  bind(registries: { agents: AgentRegistry; models: ModelRegistry }): void {
    this.threads.bind(registries);
  }

  /**
   * Execute a function within a transaction.
   */
  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    throw new UnimplementedError();
  }

  /**
   * Initialize the storage backend.
   */
  async init(): Promise<void> {
    await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA_NAME}"`);
    await this.createTable(TABLE_MIGRATIONS);
    await this.migrate();
  }

  /**
   * Close the storage backend and cleanup resources.
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Run migrations to ensure all required tables exist.
   */
  async migrate(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // read applied migration IDs
      const result = await client.query<{ id: string }>(
        `SELECT id FROM "${SCHEMA_NAME}".migrations ORDER BY applied_at ASC`,
      );
      const applied = new Set(result.rows.map((row) => row.id));

      // filter pending migrations
      const pending = migrations.filter((m) => !applied.has(m.id));
      if (pending.length === 0) {
        await client.query("COMMIT");
        return;
      }

      // run pending migrations + insert into migrations table
      for (const migration of pending) {
        await migration.up({
          client,
          createTable: async (table: Table<string, Record<string, Column>>) => {
            await this._createTable(client, table);
          },
        });
        await client.query(
          `INSERT INTO "${SCHEMA_NAME}".migrations (id, applied_at) VALUES ($1, $2)`,
          [migration.id, Date.now()],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a table from its definition.
   */
  private async createTable(
    table: Table<string, Record<string, Column>>,
  ): Promise<void> {
    assert(
      SQL_IDENTIFIER_REGEX.test(table.name),
      "system table should have a valid name",
    );
    await this._createTable(this.pool, table);
  }

  /**
   * Create a table from its definition using a specific client.
   */
  private async _createTable(
    client: Pool | PoolClient,
    table: Table<string, Record<string, Column>>,
  ): Promise<void> {
    const columns: string[] = [];
    const tableConstraints: string[] = [];

    // build column definitions
    for (const name in table.columns) {
      const col = table.columns[name];

      const constraints: string[] = [];
      if (col._pk) constraints.push("PRIMARY KEY");
      if (col._unique) constraints.push("UNIQUE");
      if (!col._nullable && !col._pk) constraints.push("NOT NULL");
      if (col._default !== undefined) {
        constraints.push(`DEFAULT ${col.encode(col._default)}`);
      }

      // foreign key reference
      if (col._fk) {
        let ref = `REFERENCES "${SCHEMA_NAME}"."${col._fk.table}" ("${col._fk.column}")`;
        if (col._onDelete) {
          ref += ` ON DELETE ${col._onDelete}`;
        }
        constraints.push(ref);
      }

      columns.push(
        `"${name}" ${col.type.toUpperCase()} ${constraints.join(" ")}`.trim(),
      );
    }

    // table-level constraints
    const indexes: IndexConstraint[] = [];
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
            throw new UnimplementedError(
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
            indexes.push(constraint);
            break;
          }
        }
      }
    }

    const constraints = [...columns, ...tableConstraints];

    const sql = `
      CREATE TABLE IF NOT EXISTS "${SCHEMA_NAME}"."${table.name}" (
        ${constraints.join(",\n  ")}
      )
    `.trim();

    await client.query(sql);

    // create indexes
    for (const index of indexes) {
      await this.createIndex(client, table.name, index);
    }
  }

  /**
   * Alter a table definition (not implemented).
   */
  private async alterTable(
    table: Table<string, Record<string, Column>>,
  ): Promise<void> {
    throw new UnimplementedError();
  }

  /**
   * Clear all rows from a table (not implemented).
   */
  private async clearTable(tableName: string): Promise<void> {
    throw new UnimplementedError();
  }

  /**
   * Drop a table (not implemented).
   */
  private async dropTable(tableName: string): Promise<void> {
    throw new UnimplementedError();
  }

  /**
   * Create an index from its definition.
   */
  private async createIndex(
    client: Pool | PoolClient,
    tableName: string,
    index: IndexConstraint,
  ): Promise<void> {
    const uniqueKeyword = index.unique ? "UNIQUE" : "";
    const columns = index.columns.map((c) => `"${c}"`).join(", ");

    // Auto-generate index name: idx_{table}_{col1}_{col2}...
    const indexName = `idx_${tableName}_${index.columns.join("_")}`;

    const sql = `
      CREATE ${uniqueKeyword} INDEX IF NOT EXISTS "${indexName}"
      ON "${SCHEMA_NAME}"."${tableName}" (${columns})
    `.trim();

    await client.query(sql);
  }
}
