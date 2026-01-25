/**
 * LibSQL client configuration and factory.
 */

import type { KernlStorage } from "kernl";
import { createClient, type Client, type Config } from "@libsql/client";

import { LibSQLStorage } from "./storage";

/**
 * LibSQL connection configuration.
 *
 * Supports:
 * - Local SQLite files: `file:./data.db` or `file:/path/to/data.db`
 * - In-memory: `:memory:`
 * - Remote Turso: `libsql://your-db.turso.io`
 */
export type LibSQLConnectionConfig =
  | { client: Client }
  | { url: string; authToken?: string };

/**
 * LibSQL storage configuration.
 */
export type LibSQLConfig = LibSQLConnectionConfig;

/**
 * Create a LibSQL storage adapter for Kernl.
 *
 * @example Local file
 * ```ts
 * const storage = libsql({ url: 'file:./kernl.db' });
 * ```
 *
 * @example In-memory (for testing)
 * ```ts
 * const storage = libsql({ url: ':memory:' });
 * ```
 *
 * @example Remote Turso
 * ```ts
 * const storage = libsql({
 *   url: 'libsql://your-db.turso.io',
 *   authToken: process.env.TURSO_AUTH_TOKEN
 * });
 * ```
 */
export function libsql(config: LibSQLConfig): KernlStorage {
  const client = createLibSQLClient(config);
  const url = "url" in config ? config.url : undefined;
  return new LibSQLStorage({ client, url });
}

/**
 * Create a LibSQL client from configuration.
 */
function createLibSQLClient(config: LibSQLConnectionConfig): Client {
  if ("client" in config) {
    return config.client;
  }

  const clientConfig: Config = {
    url: config.url,
  };

  if (config.authToken) {
    clientConfig.authToken = config.authToken;
  }

  return createClient(clientConfig);
}
