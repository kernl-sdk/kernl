/**
 * LibSQL storage adapter.
 */

import type { Client } from "@libsql/client";

import type {
  IAgentRegistry,
  IModelRegistry,
  KernlStorage,
  Transaction,
} from "kernl";
import type { Table, Column } from "@kernl-sdk/storage";
import { KERNL_SCHEMA_NAME, TABLE_MIGRATIONS } from "@kernl-sdk/storage";
import { UnimplementedError } from "@kernl-sdk/shared/lib";

import { LibSQLThreadStore } from "./thread/store";
import { LibSQLMemoryStore } from "./memory/store";
import { MIGRATIONS, createTable } from "./migrations";

/**
 * LibSQL storage configuration.
 */
export interface LibSQLStorageConfig {
  /**
   * LibSQL client instance.
   */
  client: Client;

  /**
   * Original connection URL (optional).
   *
   * Used to detect local file databases for setting SQLite PRAGMAs.
   * Not needed if using a pre-configured client.
   */
  url?: string;
}

/**
 * LibSQL storage adapter.
 *
 * Storage is lazily initialized on first use via `ensureInit()`. This means
 * callers don't need to explicitly call `init()` - it happens automatically.
 */
export class LibSQLStorage implements KernlStorage {
  private client: Client;
  private url?: string;
  private initPromise: Promise<void> | null = null;

  threads: LibSQLThreadStore;
  memories: LibSQLMemoryStore;

  constructor(config: LibSQLStorageConfig) {
    this.client = config.client;
    this.url = config.url;
    this.threads = new LibSQLThreadStore(this.client, () => this.ensureInit());
    this.memories = new LibSQLMemoryStore(this.client, () => this.ensureInit());
  }

  /**
   * Ensure storage is initialized before any operation.
   *
   * Safe to call multiple times - initialization only runs once.
   */
  private async ensureInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.init().catch((err) => {
        this.initPromise = null;
        throw err;
      });
    }
    return this.initPromise;
  }

  /**
   * Bind runtime registries to storage.
   */
  bind(registries: { agents: IAgentRegistry; models: IModelRegistry }): void {
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
    // Set SQLite PRAGMAs for local file databases
    // (Turso handles these automatically for remote connections)
    if (this.isLocal()) {
      await this.client.execute("PRAGMA journal_mode = WAL");
      await this.client.execute("PRAGMA busy_timeout = 5000");
    }

    // Create migrations table first
    await this.createTable(TABLE_MIGRATIONS);
    await this.migrate();
  }

  /**
   * Check if this is a local file or in-memory database.
   */
  private isLocal(): boolean {
    if (!this.url) return false;
    return this.url.startsWith("file:") || this.url === ":memory:";
  }

  /**
   * Close the storage backend and cleanup resources.
   */
  async close(): Promise<void> {
    this.client.close();
  }

  /**
   * Run migrations to ensure all required tables exist.
   */
  async migrate(): Promise<void> {
    const tx = await this.client.transaction("write");

    try {
      // read applied migration IDs
      const migrationsTable = `${KERNL_SCHEMA_NAME}_migrations`;
      const result = await tx.execute(
        `SELECT id FROM "${migrationsTable}" ORDER BY applied_at ASC`,
      );
      const applied = new Set(result.rows.map((row) => row.id as string));

      // filter pending migrations
      const pending = MIGRATIONS.filter((m) => !applied.has(m.id));
      if (pending.length === 0) {
        await tx.commit();
        return;
      }

      // run pending migrations + insert into migrations table
      for (const migration of pending) {
        await migration.up({
          client: tx,
          createTable: async (table: Table<string, Record<string, Column>>) => {
            await createTable(tx, table);
          },
        });
        await tx.execute({
          sql: `INSERT INTO "${migrationsTable}" (id, applied_at) VALUES (?, ?)`,
          args: [migration.id, Date.now()],
        });
      }

      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  /**
   * Create a table from its definition.
   */
  private async createTable(
    table: Table<string, Record<string, Column>>,
  ): Promise<void> {
    await createTable(this.client, table);
  }
}
