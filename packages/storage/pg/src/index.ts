/**
 * @kernl/pg - PostgreSQL storage adapter for Kernl
 * /packages/storage/pg/src/index.ts
 */

export {
  PGStorage,
  type PGStorageConfig,
  type PGVectorConfig,
  type VectorSimilarity,
  type ResolvedVectorConfig,
  DEFAULT_VECTOR_CONFIG,
  resolveVectorConfig,
} from "./storage";
export { PGMemoryStore } from "./memory/store";
export { PGWakeupStore } from "./wakeup/store";
export { postgres, pgvector, type PostgresConfig } from "./postgres";
export { MIGRATIONS, REQUIRED_SCHEMA_VERSION } from "./migrations";
export {
  PGSearchIndex,
  PGIndexHandle,
  type PGSearchIndexConfig,
  type PGIndexConfig,
  type PGFieldBinding,
} from "./pgvector";
