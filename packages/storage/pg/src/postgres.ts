import { Pool } from "pg";
import type { KernlStorage } from "@kernl-sdk/core";

import { PGStorage } from "./storage";

/**
 * PostgreSQL connection configuration.
 */
export type PostgresConfig =
  | { pool: Pool }
  | { connstr: string }
  | {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };

/**
 * Create a PostgreSQL storage adapter for Kernl.
 *
 * @param config - Connection configuration (pool, connection string, or credentials)
 * @returns KernlStorage instance backed by PostgreSQL
 *
 * @example
 * ```typescript
 * // with connection string
 * const storage = postgres({ connstr: "postgresql://localhost/mydb" });
 *
 * // with connection options
 * const storage = postgres({
 *   host: "localhost",
 *   port: 5432,
 *   database: "mydb",
 *   user: "user",
 *   password: "password"
 * });
 *
 * // existing pool
 * const pool = new Pool({ ... });
 * const storage = postgres({ pool });
 * ```
 */
export function postgres(config: PostgresConfig): KernlStorage {
  let pool: Pool;

  if ("pool" in config) {
    pool = config.pool;
  } else if ("connstr" in config) {
    pool = new Pool({ connectionString: config.connstr });
  } else {
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });
  }

  return new PGStorage({ pool });
}
