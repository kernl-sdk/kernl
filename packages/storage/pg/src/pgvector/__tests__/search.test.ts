import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { PGSearchIndex } from "../search";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;
const SCHEMA = "kernl_search_idx_test";

describe.sequential("PGSearchIndex", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
    return;
  }

  let pool: Pool;
  let pgvec: PGSearchIndex;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });

    // Ensure pgvector extension exists
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Clean slate
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${SCHEMA}"`);

    pgvec = new PGSearchIndex({ pool });
  });

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.end();
  });

  describe("createIndex", () => {
    it("creates a table with correct column types", async () => {
      await pgvec.createIndex({
        id: "articles",
        schema: {
          id: { type: "string", pk: true },
          title: { type: "string" },
          views: { type: "int" },
          rating: { type: "float" },
          published: { type: "boolean" },
          created_at: { type: "date" },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Verify table exists with correct columns
      const result = await pool.query<{
        column_name: string;
        data_type: string;
      }>(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [SCHEMA, "articles"],
      );

      const columns = Object.fromEntries(
        result.rows.map((r) => [r.column_name, r.data_type]),
      );

      expect(columns.id).toBe("text");
      expect(columns.title).toBe("text");
      expect(columns.views).toBe("integer");
      expect(columns.rating).toBe("double precision");
      expect(columns.published).toBe("boolean");
      expect(columns.created_at).toBe("timestamp with time zone");
    });

    it("creates vector columns with correct dimensions", async () => {
      await pgvec.createIndex({
        id: "embeddings",
        schema: {
          id: { type: "string", pk: true },
          embedding: { type: "vector", dimensions: 384 },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Check the vector column type via pg_attribute
      const result = await pool.query<{ typname: string; atttypmod: number }>(
        `SELECT t.typname, a.atttypmod
         FROM pg_attribute a
         JOIN pg_class c ON a.attrelid = c.oid
         JOIN pg_namespace n ON c.relnamespace = n.oid
         JOIN pg_type t ON a.atttypid = t.oid
         WHERE n.nspname = $1
           AND c.relname = $2
           AND a.attname = $3`,
        [SCHEMA, "embeddings", "embedding"],
      );

      expect(result.rows[0]?.typname).toBe("vector");
      // atttypmod encodes dimensions for vector type
      expect(result.rows[0]?.atttypmod).toBe(384);
    });

    it("creates HNSW index for vector fields", async () => {
      await pgvec.createIndex({
        id: "searchable",
        schema: {
          id: { type: "string", pk: true },
          embedding: { type: "vector", dimensions: 128, similarity: "cosine" },
        },
        providerOptions: { schema: SCHEMA },
      });

      const result = await pool.query<{ indexname: string; indexdef: string }>(
        `SELECT indexname, indexdef
         FROM pg_indexes
         WHERE schemaname = $1 AND tablename = $2`,
        [SCHEMA, "searchable"],
      );

      const hnswIndex = result.rows.find(
        (r) => r.indexname === "searchable_embedding_idx",
      );

      expect(hnswIndex).toBeDefined();
      expect(hnswIndex?.indexdef).toContain("hnsw");
      expect(hnswIndex?.indexdef).toContain("vector_cosine_ops");
    });

    it("uses correct operator class for each similarity metric", async () => {
      // Cosine
      await pgvec.createIndex({
        id: "cosine_idx",
        schema: {
          id: { type: "string", pk: true },
          vec: { type: "vector", dimensions: 8, similarity: "cosine" },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Euclidean
      await pgvec.createIndex({
        id: "euclidean_idx",
        schema: {
          id: { type: "string", pk: true },
          vec: { type: "vector", dimensions: 8, similarity: "euclidean" },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Dot product
      await pgvec.createIndex({
        id: "dot_idx",
        schema: {
          id: { type: "string", pk: true },
          vec: { type: "vector", dimensions: 8, similarity: "dot_product" },
        },
        providerOptions: { schema: SCHEMA },
      });

      const result = await pool.query<{ indexname: string; indexdef: string }>(
        `SELECT indexname, indexdef
         FROM pg_indexes
         WHERE schemaname = $1
         ORDER BY indexname`,
        [SCHEMA],
      );

      const indexes = Object.fromEntries(
        result.rows.map((r) => [r.indexname, r.indexdef]),
      );

      expect(indexes["cosine_idx_vec_idx"]).toContain("vector_cosine_ops");
      expect(indexes["euclidean_idx_vec_idx"]).toContain("vector_l2_ops");
      expect(indexes["dot_idx_vec_idx"]).toContain("vector_ip_ops");
    });

    it("throws if schema has no pk field", async () => {
      await expect(
        pgvec.createIndex({
          id: "no_pk",
          schema: {
            title: { type: "string" },
            content: { type: "string" },
          },
          providerOptions: { schema: SCHEMA },
        }),
      ).rejects.toThrow("schema must have a field with pk: true");
    });

    it("auto-binds the created index for immediate use", async () => {
      await pgvec.createIndex({
        id: "auto_bound",
        schema: {
          id: { type: "string", pk: true },
          name: { type: "string" },
          embedding: { type: "vector", dimensions: 3, similarity: "cosine" },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Should be able to use the index immediately without bindIndex
      const handle = pgvec.index("auto_bound");
      expect(handle.id).toBe("auto_bound");

      // Insert and query should work
      await handle.upsert({
        id: "test-1",
        name: "Test Doc",
        embedding: [0.1, 0.2, 0.3],
      });

      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        limit: 1,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("test-1");
    });
  });

  describe("deleteIndex", () => {
    it("drops the table and removes binding", async () => {
      await pgvec.createIndex({
        id: "to_delete",
        schema: {
          id: { type: "string", pk: true },
          name: { type: "string" },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Verify table exists
      const before = await pool.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = $1 AND table_name = $2`,
        [SCHEMA, "to_delete"],
      );
      expect(before.rows).toHaveLength(1);

      await pgvec.deleteIndex("to_delete");

      // Verify table is gone
      const after = await pool.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = $1 AND table_name = $2`,
        [SCHEMA, "to_delete"],
      );
      expect(after.rows).toHaveLength(0);
    });

    it("throws if index is not bound", async () => {
      await expect(pgvec.deleteIndex("nonexistent")).rejects.toThrow(
        'Index "nonexistent" not bound',
      );
    });
  });

  describe("listIndexes", () => {
    it("returns empty page when no indexes match prefix", async () => {
      const page = await pgvec.listIndexes({ prefix: "nonexistent_prefix_" });

      expect(page.data).toEqual([]);
      expect(page.last).toBe(true);
    });

    it("lists created indexes", async () => {
      await pgvec.createIndex({
        id: "list_test_a",
        schema: { id: { type: "string", pk: true } },
        providerOptions: { schema: SCHEMA },
      });
      await pgvec.createIndex({
        id: "list_test_b",
        schema: { id: { type: "string", pk: true } },
        providerOptions: { schema: SCHEMA },
      });

      const page = await pgvec.listIndexes();

      const ids = page.data.map((s) => s.id);
      expect(ids).toContain("list_test_a");
      expect(ids).toContain("list_test_b");
    });

    it("filters by prefix", async () => {
      await pgvec.createIndex({
        id: "prefix_foo_1",
        schema: { id: { type: "string", pk: true } },
        providerOptions: { schema: SCHEMA },
      });
      await pgvec.createIndex({
        id: "prefix_bar_1",
        schema: { id: { type: "string", pk: true } },
        providerOptions: { schema: SCHEMA },
      });

      const page = await pgvec.listIndexes({ prefix: "prefix_foo" });

      expect(page.data).toHaveLength(1);
      expect(page.data[0].id).toBe("prefix_foo_1");
    });

    it("respects limit and provides cursor for pagination", async () => {
      await pgvec.createIndex({
        id: "page_1",
        schema: { id: { type: "string", pk: true } },
        providerOptions: { schema: SCHEMA },
      });
      await pgvec.createIndex({
        id: "page_2",
        schema: { id: { type: "string", pk: true } },
        providerOptions: { schema: SCHEMA },
      });
      await pgvec.createIndex({
        id: "page_3",
        schema: { id: { type: "string", pk: true } },
        providerOptions: { schema: SCHEMA },
      });

      const page1 = await pgvec.listIndexes({ prefix: "page_", limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page1.last).toBe(false);

      const page2 = await page1.next();

      expect(page2).not.toBeNull();
      expect(page2!.data).toHaveLength(1);
      expect(page2!.last).toBe(true);
    });
  });

  describe("describeIndex", () => {
    it("returns stats for an index", async () => {
      await pgvec.createIndex({
        id: "describe_test",
        schema: {
          id: { type: "string", pk: true },
          content: { type: "string" },
          embedding: { type: "vector", dimensions: 128, similarity: "cosine" },
        },
        providerOptions: { schema: SCHEMA },
      });

      const handle = pgvec.index("describe_test");
      const vec = new Array(128).fill(0.1);
      await handle.upsert({ id: "doc-1", content: "hello", embedding: vec });
      await handle.upsert({ id: "doc-2", content: "world", embedding: vec });

      const stats = await pgvec.describeIndex("describe_test");

      expect(stats.id).toBe("describe_test");
      expect(stats.count).toBe(2);
      expect(stats.sizeb).toBeGreaterThan(0);
      expect(stats.dimensions).toBe(128);
      expect(stats.similarity).toBe("cosine");
      expect(stats.status).toBe("ready");
    });

    it("throws if index is not bound", async () => {
      await expect(pgvec.describeIndex("nonexistent")).rejects.toThrow(
        'Index "nonexistent" not bound',
      );
    });
  });
});
