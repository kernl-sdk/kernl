import type { Pool } from "pg";
import { CursorPage, type CursorPageResponse } from "@kernl-sdk/shared";
import { KERNL_SCHEMA_NAME } from "@kernl-sdk/storage";
import type {
  SearchIndex,
  IndexHandle,
  NewIndexParams,
  ListIndexesParams,
  IndexSummary,
  IndexStats,
  UnknownDocument,
  SearchCapabilities,
} from "@kernl-sdk/retrieval";

import { PGIndexHandle } from "./handle";
import { FIELD_TYPE, SIMILARITY } from "./sql";
import type { PGIndexConfig, PGFieldBinding } from "./types";

const META_TABLE = "search_indexes";

export interface PGSearchIndexConfig {
  pool: Pool;
  ensureInit?: () => Promise<void>;
}

/**
 * pgvector-backed SearchIndex implementation.
 */
export class PGSearchIndex implements SearchIndex<PGIndexConfig> {
  readonly id = "pgvector";

  private pool: Pool;
  private userInit: () => Promise<void>;
  private configs = new Map<string, PGIndexConfig>();
  private ready = false;

  constructor(config: PGSearchIndexConfig) {
    this.pool = config.pool;
    this.userInit = config.ensureInit ?? (() => Promise.resolve());
  }

  /**
   * Create a new index table.
   *
   * @param params.id - Table name
   * @param params.schema - Field definitions (one field must have pk: true)
   * @param params.providerOptions.schema - Postgres schema (default: "public")
   */
  async createIndex(params: NewIndexParams): Promise<void> {
    await this.ensureInit();

    const schemaName = (params.providerOptions?.schema as string) ?? "public";

    // find primary key field
    const pkEntry = Object.entries(params.schema).find(([, f]) => f.pk);
    if (!pkEntry) {
      throw new Error("schema must have a field with pk: true");
    }
    const pkey = pkEntry[0];

    const columns: string[] = [];
    const vectorFields: Array<{
      name: string;
      dimensions: number;
      similarity?: string;
    }> = [];

    for (const [name, field] of Object.entries(params.schema)) {
      const colDef = `"${name}" ${FIELD_TYPE.encode(field)}${field.pk ? " PRIMARY KEY" : ""}`;
      columns.push(colDef);

      if (field.type === "vector") {
        vectorFields.push({
          name,
          dimensions: field.dimensions,
          similarity: field.similarity,
        });
      }
    }

    // create table
    await this.pool.query(`
      CREATE TABLE "${schemaName}"."${params.id}" (
        ${columns.join(",\n        ")}
      )
    `);

    // create HNSW indexes for vector fields
    for (const vf of vectorFields) {
      await this.pool.query(`
        CREATE INDEX "${params.id}_${vf.name}_idx"
        ON "${schemaName}"."${params.id}"
        USING hnsw ("${vf.name}" ${SIMILARITY.encode(vf.similarity as "cosine" | "euclidean" | "dot_product" | undefined)})
      `);
    }

    // auto-bind the created table
    const fields: Record<string, PGFieldBinding> = {};
    for (const [name, field] of Object.entries(params.schema)) {
      fields[name] = {
        column: name,
        type: field.type,
        ...(field.type === "vector" && {
          dimensions: field.dimensions,
          similarity: field.similarity,
        }),
      };
    }

    const config: PGIndexConfig = {
      schema: schemaName,
      table: params.id,
      pkey,
      fields,
    };

    // persist to metadata table
    await this.pool.query(
      `INSERT INTO "${KERNL_SCHEMA_NAME}"."${META_TABLE}" (id, backend, config, created_at)
       VALUES ($1, $2, $3, $4)`,
      [params.id, this.id, JSON.stringify(config), Date.now()],
    );

    this.configs.set(params.id, config);
  }

  /**
   * List all indexes.
   */
  async listIndexes(
    params?: ListIndexesParams,
  ): Promise<CursorPage<IndexSummary>> {
    await this.ensureInit();

    const loader = async (
      p: ListIndexesParams,
    ): Promise<CursorPageResponse<IndexSummary>> => {
      const limit = p.limit ?? 100;

      let sql = `
        SELECT id FROM "${KERNL_SCHEMA_NAME}"."${META_TABLE}"
        WHERE backend = $1
      `;
      const sqlParams: unknown[] = [this.id];
      let idx = 2;

      if (p.prefix) {
        sql += ` AND id LIKE $${idx}`;
        sqlParams.push(`${p.prefix}%`);
        idx++;
      }

      if (p.cursor) {
        sql += ` AND id > $${idx}`;
        sqlParams.push(p.cursor);
        idx++;
      }

      sql += ` ORDER BY id ASC LIMIT $${idx}`;
      sqlParams.push(limit + 1);

      const result = await this.pool.query<{ id: string }>(sql, sqlParams);

      const hasMore = result.rows.length > limit;
      const rows = hasMore ? result.rows.slice(0, -1) : result.rows;

      const data: IndexSummary[] = rows.map((row) => ({
        id: row.id,
        status: "ready" as const,
      }));

      return {
        data,
        next: hasMore ? (rows[rows.length - 1]?.id ?? null) : null,
        last: !hasMore,
      };
    };

    const response = await loader(params ?? {});

    return new CursorPage({
      params: params ?? {},
      response,
      loader,
    });
  }

  /**
   * Get index statistics.
   */
  async describeIndex(id: string): Promise<IndexStats> {
    await this.ensureInit();

    const cfg = this.configs.get(id);
    if (!cfg) {
      throw new Error(`Index "${id}" not bound`);
    }

    // get row count
    const countRes = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${cfg.schema}"."${cfg.table}"`,
    );
    const count = parseInt(countRes.rows[0]?.count ?? "0", 10);

    // get table size in bytes
    const sizeRes = await this.pool.query<{ size: string }>(
      `SELECT pg_total_relation_size('"${cfg.schema}"."${cfg.table}"') as size`,
    );
    const sizeb = parseInt(sizeRes.rows[0]?.size ?? "0", 10);

    // find vector field for dimensions/similarity
    const vectorField = Object.values(cfg.fields).find(
      (f) => f.type === "vector",
    );

    return {
      id,
      count,
      sizeb,
      dimensions: vectorField?.dimensions,
      similarity: vectorField?.similarity,
      status: "ready",
    };
  }

  /**
   * Delete an index and all its documents.
   */
  async deleteIndex(id: string): Promise<void> {
    await this.ensureInit();

    const cfg = this.configs.get(id);
    if (!cfg) {
      throw new Error(`Index "${id}" not bound`);
    }

    await this.pool.query(
      `DROP TABLE IF EXISTS "${cfg.schema}"."${cfg.table}"`,
    );
    await this.pool.query(
      `DELETE FROM "${KERNL_SCHEMA_NAME}"."${META_TABLE}" WHERE id = $1`,
      [id],
    );
    this.configs.delete(id);
  }

  /**
   * No-op for pgvector.
   */
  async warm(_id: string): Promise<void> {}

  /**
   * pgvector capabilities.
   */
  capabilities(): SearchCapabilities {
    return {
      modes: new Set(["vector"]),
      multiSignal: false,
      multiVector: false,
      filters: true,
      orderBy: true,
    };
  }

  /**
   * Get a handle for operating on a specific index.
   */
  index<TDocument = UnknownDocument>(id: string): IndexHandle<TDocument> {
    const cfg = this.configs.get(id);
    return new PGIndexHandle<TDocument>(
      this.pool,
      () => this.ensureInit(),
      id,
      cfg,
    );
  }

  /**
   * Bind an existing Postgres table as an index.
   */
  async bindIndex(id: string, config: PGIndexConfig): Promise<void> {
    await this.ensureInit();

    // upsert to metadata table
    await this.pool.query(
      `INSERT INTO "${KERNL_SCHEMA_NAME}"."${META_TABLE}" (id, backend, config, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET config = $3`,
      [id, this.id, JSON.stringify(config), Date.now()],
    );

    this.configs.set(id, config);
  }

  /* --- internal utils --- */

  /**
   * Ensure metadata table exists and load configs.
   */
  private async ensureInit(): Promise<void> {
    if (this.ready) return;

    await this.userInit();

    // create metadata table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS "${KERNL_SCHEMA_NAME}"."${META_TABLE}" (
        id TEXT PRIMARY KEY,
        backend TEXT NOT NULL,
        config JSONB NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);

    // load existing configs for this backend
    const result = await this.pool.query<{
      id: string;
      config: PGIndexConfig;
    }>(
      `SELECT id, config FROM "${KERNL_SCHEMA_NAME}"."${META_TABLE}" WHERE backend = $1`,
      [this.id],
    );

    for (const row of result.rows) {
      this.configs.set(row.id, row.config);
    }

    this.ready = true;
  }
}
