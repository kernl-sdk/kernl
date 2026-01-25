import { createClient, type Client } from "@libsql/client";
import { KERNL_SCHEMA_NAME } from "@kernl-sdk/storage";
import type { IAgentRegistry, IModelRegistry } from "kernl";

import { LibSQLStorage } from "../storage";

// Counter to ensure unique database URLs within the same process
let dbCounter = 0;

/**
 * Generate a unique database URL for each test.
 * Uses temp file instead of :memory: due to libsql bug with in-memory transactions.
 */
export function test_db_url(): string {
  return `file:/tmp/kernl-test-${process.pid}-${Date.now()}-${++dbCounter}.db`;
}

export const THREADS_TABLE = `${KERNL_SCHEMA_NAME}_threads`;
export const THREAD_EVENTS_TABLE = `${KERNL_SCHEMA_NAME}_thread_events`;
export const MEMORIES_TABLE = `${KERNL_SCHEMA_NAME}_memories`;
export const MIGRATIONS_TABLE = `${KERNL_SCHEMA_NAME}_migrations`;

/**
 * Create a test database setup with client and storage sharing the same URL.
 */
export function create_test_db(): { client: Client; storage: LibSQLStorage; url: string } {
  const url = test_db_url();
  const client = createClient({ url });
  const storage = new LibSQLStorage({ client, url });
  return { client, storage, url };
}

export function create_client(url?: string): Client {
  const dbUrl = url ?? test_db_url();
  return createClient({ url: dbUrl });
}

export async function enable_foreign_keys(client: Client): Promise<void> {
  await client.execute("PRAGMA foreign_keys = ON");
}

export function create_storage(client: Client, url?: string): LibSQLStorage {
  const dbUrl = url ?? test_db_url();
  return new LibSQLStorage({ client, url: dbUrl });
}

export async function reset_tables(client: Client): Promise<void> {
  await client.execute(`DELETE FROM "${THREAD_EVENTS_TABLE}"`);
  await client.execute(`DELETE FROM "${THREADS_TABLE}"`);
  await client.execute(`DELETE FROM "${MEMORIES_TABLE}"`);
}

/**
 * Create mock registries for thread hydration tests.
 */
export function create_mock_registries(): {
  agents: IAgentRegistry;
  models: IModelRegistry;
} {
  const agentMap = new Map<string, any>();
  const modelMap = new Map<string, any>();

  // Add a test agent
  agentMap.set("test-agent", {
    id: "test-agent",
    kind: "llm",
    name: "Test Agent",
  });

  // Add a test model
  modelMap.set("test/model", {
    id: "test/model",
    provider: "test",
    modelId: "model",
  });

  return {
    agents: {
      get: (id: string) => agentMap.get(id),
      set: (id: string, agent: any) => agentMap.set(id, agent),
      has: (id: string) => agentMap.has(id),
      list: () => Array.from(agentMap.values()),
    } as IAgentRegistry,
    models: {
      get: (id: string) => modelMap.get(id),
      set: (id: string, model: any) => modelMap.set(id, model),
      has: (id: string) => modelMap.has(id),
      list: () => Array.from(modelMap.values()),
    } as IModelRegistry,
  };
}

/**
 * Generate a unique ID for tests.
 */
export function testid(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
