import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";
import { PGSearchIndex } from "../search";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;
const SCHEMA = "kernl_search_test";

describe.sequential("PGIndexHandle", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
    return;
  }

  let pool: Pool;
  let search: PGSearchIndex;
  let initialized = false;

  const ensureInit = async () => {
    if (initialized) return;
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${SCHEMA}"."documents" (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        status TEXT,
        views INTEGER DEFAULT 0,
        embedding vector(3)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS documents_embedding_idx
      ON "${SCHEMA}"."documents"
      USING hnsw (embedding vector_cosine_ops)
    `);
    initialized = true;
  };

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    search = new PGSearchIndex({ pool, ensureInit });

    // Clean slate
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  });

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    // Clear table between tests
    if (initialized) {
      await pool.query(`DELETE FROM "${SCHEMA}"."documents"`);
    }
  });

  describe("bindIndex", () => {
    it("registers binding for later use", async () => {
      await search.bindIndex("docs", {
        schema: SCHEMA,
        table: "documents",
        pkey: "id",
        fields: {
          title: { column: "title", type: "string" },
          content: { column: "content", type: "string" },
          embedding: {
            column: "embedding",
            type: "vector",
            dimensions: 3,
            similarity: "cosine",
          },
        },
      });

      // Can get handle without error
      const handle = search.index("docs");
      expect(handle.id).toBe("docs");
    });
  });

  describe("index().query()", () => {
    beforeAll(async () => {
      await search.bindIndex("docs", {
        schema: SCHEMA,
        table: "documents",
        pkey: "id",
        fields: {
          title: { column: "title", type: "string" },
          content: { column: "content", type: "string" },
          status: { column: "status", type: "string" },
          views: { column: "views", type: "int" },
          embedding: {
            column: "embedding",
            type: "vector",
            dimensions: 3,
            similarity: "cosine",
          },
        },
      });
    });

    async function insertDocs() {
      await ensureInit();
      await pool.query(`
        INSERT INTO "${SCHEMA}"."documents" (id, title, content, status, views, embedding)
        VALUES
          ('doc1', 'Hello World', 'First document', 'active', 100, '[0.1, 0.2, 0.3]'),
          ('doc2', 'Goodbye World', 'Second document', 'active', 200, '[0.4, 0.5, 0.6]'),
          ('doc3', 'Hello Again', 'Third document', 'draft', 50, '[0.15, 0.25, 0.35]'),
          ('doc4', 'Final Doc', 'Fourth document', 'archived', 500, '[0.9, 0.8, 0.7]')
      `);
    }

    it("queries with vector search", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        limit: 2,
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("doc1"); // closest match
      expect(results[0].score).toBeGreaterThan(0.9); // high similarity
      expect(results[0].index).toBe("docs");
    });

    it("queries with filter", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        filter: { status: "active" },
        limit: 10,
      });

      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect(r.document?.status).toBe("active");
      });
    });

    it("queries with comparison filter", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        filter: { views: { $gte: 100 } },
        limit: 10,
      });

      expect(results.length).toBeGreaterThanOrEqual(2);
      results.forEach((r) => {
        expect(r.document?.views).toBeGreaterThanOrEqual(100);
      });
    });

    it("queries with $or filter", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        filter: {
          $or: [{ status: "draft" }, { status: "archived" }],
        },
        limit: 10,
      });

      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect(["draft", "archived"]).toContain(r.document?.status);
      });
    });

    it("queries with $in filter", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        filter: { status: { $in: ["active", "draft"] } },
        limit: 10,
      });

      expect(results).toHaveLength(3);
    });

    it("respects limit", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5] }],
        limit: 2,
      });

      expect(results).toHaveLength(2);
    });

    it("respects offset for pagination", async () => {
      await insertDocs();

      const handle = search.index("docs");

      // Get first 2
      const page1 = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5] }],
        limit: 2,
        offset: 0,
      });

      // Get next 2
      const page2 = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5] }],
        limit: 2,
        offset: 2,
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it("queries with orderBy (non-vector)", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        filter: { status: "active" },
        orderBy: { field: "views", direction: "desc" },
        limit: 10,
      });

      expect(results).toHaveLength(2);
      expect(results[0].document?.views).toBe(200);
      expect(results[1].document?.views).toBe(100);
    });

    it("returns documents with mapped field names", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        limit: 1,
      });

      expect(results[0].document).toHaveProperty("title");
      expect(results[0].document).toHaveProperty("content");
      expect(results[0].document).toHaveProperty("status");
      expect(results[0].document).toHaveProperty("views");
      expect(results[0].document).toHaveProperty("embedding");
    });

    it("returns empty array when no matches", async () => {
      await insertDocs();

      const handle = search.index("docs");
      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        filter: { status: "nonexistent" },
        limit: 10,
      });

      expect(results).toEqual([]);
    });
  });

  describe("index() generic type", () => {
    interface DocFields {
      title: string;
      content: string;
      status: string;
      views: number;
    }

    beforeAll(async () => {
      await search.bindIndex("typed-docs", {
        schema: SCHEMA,
        table: "documents",
        pkey: "id",
        fields: {
          title: { column: "title", type: "string" },
          content: { column: "content", type: "string" },
          status: { column: "status", type: "string" },
          views: { column: "views", type: "int" },
          embedding: {
            column: "embedding",
            type: "vector",
            dimensions: 3,
            similarity: "cosine",
          },
        },
      });
    });

    it("provides typed document access", async () => {
      await ensureInit();
      await pool.query(`
        INSERT INTO "${SCHEMA}"."documents" (id, title, content, status, views, embedding)
        VALUES ('typed1', 'Typed Doc', 'Typed content', 'active', 42, '[0.1, 0.2, 0.3]')
      `);

      const handle = search.index<DocFields>("typed-docs");
      const results = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3] }],
        limit: 1,
      });

      // TypeScript should allow these without errors
      const doc = results[0].document;
      expect(doc?.title).toBe("Typed Doc");
      expect(doc?.views).toBe(42);
    });
  });

  describe("error handling", () => {
    it("throws when table does not exist", async () => {
      const handle = search.index("unbound-index");

      // Convention-based indexing tries to use "public.unbound-index"
      // which doesn't exist, so PostgreSQL throws an error
      await expect(
        handle.query({ query: [{ embedding: [0.1, 0.2, 0.3] }] }),
      ).rejects.toThrow('relation "public.unbound-index" does not exist');
    });
  });
});
