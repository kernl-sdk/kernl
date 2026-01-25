import { Pool } from "pg";
import type { KernlStorage } from "kernl";

import { PGStorage, type PGVectorConfig } from "./storage";
import { PGSearchIndex } from "./pgvector/search";

/**
 * Create a PostgreSQL storage adapter for Kernl.
 */
export function postgres(config: PostgresConfig): KernlStorage {
  const p = pool(config);
  return new PGStorage({ pool: p, vector: config.vector });
}

/**
 * Create a pgvector-backed search index.
 */
export function pgvector(config: ConnectionConfig) {
  const p = pool(config);
  return new PGSearchIndex({ pool: p });
}

/**
 * Connection options for PostgreSQL.
 */
export type ConnectionConfig =
  | { pool: Pool }
  | { url: string }
  | {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };

/**
 * PostgreSQL storage configuration.
 */
export type PostgresConfig = ConnectionConfig & {
  /**
   * Enable pgvector support for semantic search.
   */
  vector?: boolean | PGVectorConfig;
};

function pool(config: ConnectionConfig): Pool {
  if ("pool" in config) {
    return config.pool;
  } else if ("url" in config) {
    return new Pool({ connectionString: config.url });
  } else {
    return new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });
  }
}
