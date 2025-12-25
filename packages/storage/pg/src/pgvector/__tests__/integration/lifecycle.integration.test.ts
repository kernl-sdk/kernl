/**
 * Index lifecycle integration tests for pgvector.
 *
 * Tests the full index lifecycle: create, bind, upsert, query,
 * patch, delete documents, delete index.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";

import { PGSearchIndex } from "../../search";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;
const SCHEMA = "kernl_lifecycle_integration_test";

describe.sequential("pgvector index lifecycle integration tests", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
    return;
  }

  let pool: Pool;
  let pgvec: PGSearchIndex;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });

    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${SCHEMA}"`);

    pgvec = new PGSearchIndex({ pool });
  }, 30000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.end();
  });

  // ============================================================
  // FULL LIFECYCLE TEST
  // ============================================================

  describe("complete index lifecycle", () => {
    const indexId = "lifecycle_test";

    it("creates index with schema", async () => {
      await pgvec.createIndex({
        id: indexId,
        schema: {
          id: { type: "string", pk: true },
          title: { type: "string" },
          views: { type: "int" },
          published: { type: "boolean" },
          embedding: { type: "vector", dimensions: 4, similarity: "cosine" },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Verify table was created
      const tableCheck = await pool.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = $1 AND table_name = $2`,
        [SCHEMA, indexId],
      );
      expect(tableCheck.rows).toHaveLength(1);
    });

    it("index is immediately usable after creation", async () => {
      const handle = pgvec.index(indexId);
      expect(handle.id).toBe(indexId);
    });

    it("upserts documents", async () => {
      const handle = pgvec.index(indexId);

      const result = await handle.upsert([
        {
          id: "doc-1",
          title: "First Document",
          views: 100,
          published: true,
          embedding: [1, 0, 0, 0],
        },
        {
          id: "doc-2",
          title: "Second Document",
          views: 200,
          published: false,
          embedding: [0, 1, 0, 0],
        },
        {
          id: "doc-3",
          title: "Third Document",
          views: 50,
          published: true,
          embedding: [0, 0, 1, 0],
        },
      ]);

      expect(result.count).toBe(3);
      expect(result.inserted).toBe(3);
    });

    it("queries documents with vector search", async () => {
      const handle = pgvec.index(indexId);

      const hits = await handle.query({
        query: [{ embedding: [1, 0, 0, 0] }],
        limit: 10,
      });

      expect(hits).toHaveLength(3);
      expect(hits[0].id).toBe("doc-1");
    });

    it("queries documents with filter", async () => {
      const handle = pgvec.index(indexId);

      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        filter: { published: true },
        limit: 10,
      });

      expect(hits).toHaveLength(2);
      for (const hit of hits) {
        expect(hit.document?.published).toBe(true);
      }
    });

    it("patches documents", async () => {
      const handle = pgvec.index(indexId);

      await handle.patch({
        id: "doc-1",
        views: 500,
        title: "Updated First Document",
      });

      const hits = await handle.query({
        filter: { id: "doc-1" },
        limit: 1,
      });

      expect(hits[0].document?.views).toBe(500);
      expect(hits[0].document?.title).toBe("Updated First Document");
    });

    it("deletes documents", async () => {
      const handle = pgvec.index(indexId);

      await handle.delete("doc-3");

      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        limit: 10,
      });

      expect(hits).toHaveLength(2);
      expect(hits.find((h) => h.id === "doc-3")).toBeUndefined();
    });

    it("describes index", async () => {
      const stats = await pgvec.describeIndex(indexId);

      expect(stats.id).toBe(indexId);
      expect(stats.count).toBe(2);
      expect(stats.dimensions).toBe(4);
      expect(stats.similarity).toBe("cosine");
      expect(stats.status).toBe("ready");
      expect(stats.sizeb).toBeGreaterThan(0);
    });

    it("lists index", async () => {
      const page = await pgvec.listIndexes({ prefix: "lifecycle" });

      expect(page.data).toHaveLength(1);
      expect(page.data[0].id).toBe(indexId);
      expect(page.data[0].status).toBe("ready");
    });

    it("deletes index", async () => {
      await pgvec.deleteIndex(indexId);

      // Verify table was dropped
      const tableCheck = await pool.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = $1 AND table_name = $2`,
        [SCHEMA, indexId],
      );
      expect(tableCheck.rows).toHaveLength(0);
    });

    it("throws on operations after delete", async () => {
      await expect(pgvec.describeIndex(indexId)).rejects.toThrow(
        `Index "${indexId}" not bound`,
      );
    });
  });

  // ============================================================
  // BIND EXISTING TABLE
  // ============================================================

  describe("bindIndex", () => {
    const tableId = "existing_table";

    beforeAll(async () => {
      // Create table manually
      await pool.query(`
        CREATE TABLE "${SCHEMA}"."${tableId}" (
          doc_id TEXT PRIMARY KEY,
          doc_title TEXT,
          doc_count INTEGER,
          doc_embedding vector(4)
        )
      `);

      // Insert some data
      await pool.query(`
        INSERT INTO "${SCHEMA}"."${tableId}" (doc_id, doc_title, doc_count, doc_embedding)
        VALUES
          ('existing-1', 'Existing Doc 1', 10, '[0.1, 0.2, 0.3, 0.4]'),
          ('existing-2', 'Existing Doc 2', 20, '[0.5, 0.6, 0.7, 0.8]')
      `);
    });

    it("binds to existing table with custom field mapping", async () => {
      await pgvec.bindIndex("custom_binding", {
        schema: SCHEMA,
        table: tableId,
        pkey: "doc_id",
        fields: {
          id: { column: "doc_id", type: "string" },
          title: { column: "doc_title", type: "string" },
          count: { column: "doc_count", type: "int" },
          embedding: {
            column: "doc_embedding",
            type: "vector",
            dimensions: 4,
            similarity: "cosine",
          },
        },
      });

      const handle = pgvec.index("custom_binding");
      expect(handle.id).toBe("custom_binding");
    });

    it("queries bound table", async () => {
      const handle = pgvec.index("custom_binding");

      const hits = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3, 0.4] }],
        limit: 10,
      });

      expect(hits).toHaveLength(2);
      expect(hits[0].id).toBe("existing-1");
    });

    it("upserts to bound table", async () => {
      const handle = pgvec.index("custom_binding");

      await handle.upsert({
        id: "new-doc",
        title: "New Document",
        count: 30,
        embedding: [0.9, 0.9, 0.9, 0.9],
      });

      // Verify in raw SQL
      const result = await pool.query(
        `SELECT * FROM "${SCHEMA}"."${tableId}" WHERE doc_id = 'new-doc'`,
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].doc_title).toBe("New Document");
      expect(result.rows[0].doc_count).toBe(30);
    });

    it("respects custom primary key", async () => {
      const handle = pgvec.index("custom_binding");

      // Update existing doc
      await handle.upsert({
        id: "existing-1",
        title: "Updated Existing",
        count: 100,
        embedding: [0.1, 0.2, 0.3, 0.4],
      });

      const result = await pool.query(
        `SELECT * FROM "${SCHEMA}"."${tableId}" WHERE doc_id = 'existing-1'`,
      );

      expect(result.rows[0].doc_title).toBe("Updated Existing");
      expect(result.rows[0].doc_count).toBe(100);
    });

    it("rebinding updates configuration", async () => {
      // Rebind with different field mapping
      await pgvec.bindIndex("custom_binding", {
        schema: SCHEMA,
        table: tableId,
        pkey: "doc_id",
        fields: {
          id: { column: "doc_id", type: "string" },
          title: { column: "doc_title", type: "string" },
          // count field omitted
          embedding: {
            column: "doc_embedding",
            type: "vector",
            dimensions: 4,
            similarity: "cosine",
          },
        },
      });

      // Should still work
      const handle = pgvec.index("custom_binding");
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        limit: 1,
      });

      expect(hits).toHaveLength(1);
    });
  });

  // ============================================================
  // MULTIPLE INDEXES
  // ============================================================

  describe("multiple indexes", () => {
    it("manages multiple indexes independently", async () => {
      // Create two indexes
      await pgvec.createIndex({
        id: "multi_index_a",
        schema: {
          id: { type: "string", pk: true },
          name: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });

      await pgvec.createIndex({
        id: "multi_index_b",
        schema: {
          id: { type: "string", pk: true },
          title: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Insert different data
      const handleA = pgvec.index("multi_index_a");
      const handleB = pgvec.index("multi_index_b");

      await handleA.upsert({ id: "a-1", name: "Index A Doc", embedding: [1, 0, 0, 0] });
      await handleB.upsert({ id: "b-1", title: "Index B Doc", embedding: [0, 1, 0, 0] });

      // Query each
      const hitsA = await handleA.query({
        query: [{ embedding: [1, 0, 0, 0] }],
        limit: 10,
      });

      const hitsB = await handleB.query({
        query: [{ embedding: [0, 1, 0, 0] }],
        limit: 10,
      });

      expect(hitsA).toHaveLength(1);
      expect(hitsA[0].document?.name).toBe("Index A Doc");

      expect(hitsB).toHaveLength(1);
      expect(hitsB[0].document?.title).toBe("Index B Doc");

      // Delete one doesn't affect the other
      await pgvec.deleteIndex("multi_index_a");

      const stillExists = await handleB.query({
        query: [{ embedding: [0, 1, 0, 0] }],
        limit: 10,
      });
      expect(stillExists).toHaveLength(1);

      // Cleanup
      await pgvec.deleteIndex("multi_index_b");
    });

    it("lists multiple indexes with pagination", async () => {
      // Create several indexes
      for (let i = 0; i < 5; i++) {
        await pgvec.createIndex({
          id: `paginated_${i}`,
          schema: {
            id: { type: "string", pk: true },
            embedding: { type: "vector", dimensions: 4 },
          },
          providerOptions: { schema: SCHEMA },
        });
      }

      // List with limit
      const page1 = await pgvec.listIndexes({ prefix: "paginated_", limit: 2 });
      expect(page1.data).toHaveLength(2);
      expect(page1.last).toBe(false);

      const page2 = await page1.next();
      expect(page2).not.toBeNull();
      expect(page2!.data).toHaveLength(2);

      const page3 = await page2!.next();
      expect(page3).not.toBeNull();
      expect(page3!.data).toHaveLength(1);
      expect(page3!.last).toBe(true);

      // Cleanup
      for (let i = 0; i < 5; i++) {
        await pgvec.deleteIndex(`paginated_${i}`);
      }
    });
  });

  // ============================================================
  // SCHEMA VARIATIONS
  // ============================================================

  describe("schema variations", () => {
    it("creates index with all field types", async () => {
      await pgvec.createIndex({
        id: "all_types",
        schema: {
          id: { type: "string", pk: true },
          str_field: { type: "string" },
          int_field: { type: "int" },
          float_field: { type: "float" },
          bool_field: { type: "boolean" },
          date_field: { type: "date" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });

      // Verify column types
      const result = await pool.query<{
        column_name: string;
        data_type: string;
      }>(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [SCHEMA, "all_types"],
      );

      const columns = Object.fromEntries(
        result.rows.map((r) => [r.column_name, r.data_type]),
      );

      expect(columns.str_field).toBe("text");
      expect(columns.int_field).toBe("integer");
      expect(columns.float_field).toBe("double precision");
      expect(columns.bool_field).toBe("boolean");
      expect(columns.date_field).toBe("timestamp with time zone");

      await pgvec.deleteIndex("all_types");
    });

    it("creates index with high-dimensional vectors", async () => {
      await pgvec.createIndex({
        id: "high_dim",
        schema: {
          id: { type: "string", pk: true },
          embedding: { type: "vector", dimensions: 1536, similarity: "cosine" },
        },
        providerOptions: { schema: SCHEMA },
      });

      const handle = pgvec.index("high_dim");
      const vec = new Array(1536).fill(0.1);

      await handle.upsert({ id: "high-1", embedding: vec });

      const hits = await handle.query({
        query: [{ embedding: vec }],
        limit: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.embedding).toHaveLength(1536);

      await pgvec.deleteIndex("high_dim");
    });

    it("creates index with multiple vector fields", async () => {
      await pgvec.createIndex({
        id: "multi_vec",
        schema: {
          id: { type: "string", pk: true },
          title_embedding: { type: "vector", dimensions: 4, similarity: "cosine" },
          content_embedding: { type: "vector", dimensions: 4, similarity: "euclidean" },
        },
        providerOptions: { schema: SCHEMA },
      });

      const handle = pgvec.index("multi_vec");

      await handle.upsert({
        id: "mv-1",
        title_embedding: [1, 0, 0, 0],
        content_embedding: [0, 1, 0, 0],
      });

      // Query on first vector field
      const hits = await handle.query({
        query: [{ title_embedding: [1, 0, 0, 0] }],
        limit: 1,
      });

      expect(hits).toHaveLength(1);

      await pgvec.deleteIndex("multi_vec");
    });
  });

  // ============================================================
  // PERSISTENCE ACROSS INSTANCES
  // ============================================================

  describe("persistence", () => {
    it("loads existing indexes on new instance", async () => {
      // Create index with first instance
      await pgvec.createIndex({
        id: "persist_test",
        schema: {
          id: { type: "string", pk: true },
          name: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });

      const handle1 = pgvec.index("persist_test");
      await handle1.upsert({ id: "p-1", name: "Persisted", embedding: [1, 0, 0, 0] });

      // Create new instance
      const pgvec2 = new PGSearchIndex({ pool });

      // Should be able to access the index
      const stats = await pgvec2.describeIndex("persist_test");
      expect(stats.count).toBe(1);

      const handle2 = pgvec2.index("persist_test");
      const hits = await handle2.query({
        query: [{ embedding: [1, 0, 0, 0] }],
        limit: 1,
      });

      expect(hits[0].document?.name).toBe("Persisted");

      await pgvec.deleteIndex("persist_test");
    });
  });
});
