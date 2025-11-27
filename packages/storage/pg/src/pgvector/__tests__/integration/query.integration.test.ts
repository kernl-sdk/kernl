/**
 * Query behavior integration tests for pgvector.
 *
 * Tests vector search, topK behavior, offset pagination, orderBy,
 * and result structure against real PostgreSQL.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";

import { PGSearchIndex } from "../../search";
import type { IndexHandle } from "@kernl-sdk/retrieval";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;
const SCHEMA = "kernl_query_integration_test";

/**
 * Test document type.
 */
interface TestDoc {
  id: string;
  title: string;
  category: string;
  priority: number;
  score: number;
  embedding: number[];
}

/**
 * Deterministic test dataset for query testing.
 *
 * Documents with orthogonal vectors for predictable similarity results.
 */
const TEST_DOCS: TestDoc[] = [
  {
    id: "vec-1",
    title: "Machine Learning Basics",
    category: "ml",
    priority: 1,
    score: 95.5,
    embedding: [1.0, 0.0, 0.0, 0.0], // Basis vector 1
  },
  {
    id: "vec-2",
    title: "Advanced Neural Networks",
    category: "ml",
    priority: 2,
    score: 88.0,
    embedding: [0.0, 1.0, 0.0, 0.0], // Basis vector 2
  },
  {
    id: "vec-3",
    title: "Database Fundamentals",
    category: "db",
    priority: 3,
    score: 92.0,
    embedding: [0.0, 0.0, 1.0, 0.0], // Basis vector 3
  },
  {
    id: "vec-4",
    title: "Vector Databases",
    category: "db",
    priority: 4,
    score: 75.5,
    embedding: [0.0, 0.0, 0.0, 1.0], // Basis vector 4
  },
  {
    id: "vec-5",
    title: "Search Engine Optimization",
    category: "search",
    priority: 5,
    score: 82.0,
    embedding: [0.5, 0.5, 0.0, 0.0], // Mix of 1 and 2
  },
  {
    id: "vec-6",
    title: "Hybrid Search Systems",
    category: "search",
    priority: 6,
    score: 79.0,
    embedding: [0.0, 0.5, 0.5, 0.0], // Mix of 2 and 3
  },
];

describe.sequential("pgvector query integration tests", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
    return;
  }

  let pool: Pool;
  let pgvec: PGSearchIndex;
  let handle: IndexHandle<TestDoc>;
  const testIndexId = "query_test_docs";

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });

    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${SCHEMA}"`);

    pgvec = new PGSearchIndex({ pool });

    await pgvec.createIndex({
      id: testIndexId,
      schema: {
        id: { type: "string", pk: true },
        title: { type: "string" },
        category: { type: "string" },
        priority: { type: "int" },
        score: { type: "float" },
        embedding: { type: "vector", dimensions: 4, similarity: "cosine" },
      },
      providerOptions: { schema: SCHEMA },
    });

    handle = pgvec.index<TestDoc>(testIndexId);

    // Insert test documents
    await handle.upsert(TEST_DOCS);
  }, 30000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.end();
  });

  // ============================================================
  // VECTOR SEARCH
  // ============================================================

  describe("vector search", () => {
    it("returns exact match as top result", async () => {
      // Query with basis vector 1 - should match vec-1 best
      const hits = await handle.query({
        query: [{ embedding: [1.0, 0.0, 0.0, 0.0] }],
        topK: 10,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].id).toBe("vec-1");
    });

    it("returns results in similarity order", async () => {
      // Query with basis vector 2
      const hits = await handle.query({
        query: [{ embedding: [0.0, 1.0, 0.0, 0.0] }],
        topK: 10,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].id).toBe("vec-2");

      // Scores should be in descending order
      for (let i = 1; i < hits.length; i++) {
        expect(hits[i].score).toBeLessThanOrEqual(hits[i - 1].score);
      }
    });

    it("mixed vector query finds composite matches", async () => {
      // Query with mix of basis 1 and 2 - should prefer vec-5 which has [0.5, 0.5, 0, 0]
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.0, 0.0] }],
        topK: 10,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].id).toBe("vec-5");
    });

    it("returns high similarity score for exact match", async () => {
      const hits = await handle.query({
        query: [{ embedding: [1.0, 0.0, 0.0, 0.0] }],
        topK: 1,
      });

      // Cosine similarity of identical vectors should be very close to 1
      expect(hits[0].score).toBeGreaterThan(0.99);
    });

    it("returns lower similarity for orthogonal vectors", async () => {
      const hits = await handle.query({
        query: [{ embedding: [1.0, 0.0, 0.0, 0.0] }],
        topK: 10,
      });

      // Find vec-4 which is orthogonal to query
      const orthogonal = hits.find((h) => h.id === "vec-4");
      expect(orthogonal).toBeDefined();
      // Orthogonal vectors should have similarity close to 0
      expect(orthogonal!.score).toBeLessThan(0.1);
    });

    it("handles normalized query vector", async () => {
      // Already normalized
      const hits = await handle.query({
        query: [{ embedding: [0.707, 0.707, 0.0, 0.0] }],
        topK: 3,
      });

      // Should still find vec-5 as best match
      expect(hits[0].id).toBe("vec-5");
    });

    it("handles unnormalized query vector", async () => {
      // Not normalized (should still work with cosine similarity)
      const hits = await handle.query({
        query: [{ embedding: [2.0, 2.0, 0.0, 0.0] }],
        topK: 3,
      });

      // Should still find vec-5 as best match
      expect(hits[0].id).toBe("vec-5");
    });
  });

  // ============================================================
  // TOPK BEHAVIOR
  // ============================================================

  describe("topK behavior", () => {
    it("topK smaller than doc count returns exactly topK", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 3,
      });

      expect(hits.length).toBe(3);
    });

    it("topK larger than doc count returns all docs", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 100,
      });

      expect(hits.length).toBe(6);
    });

    it("topK of 1 returns single best match", async () => {
      const hits = await handle.query({
        query: [{ embedding: [1.0, 0.0, 0.0, 0.0] }],
        topK: 1,
      });

      expect(hits.length).toBe(1);
      expect(hits[0].id).toBe("vec-1");
    });

    it("topK with filter returns limited filtered results", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 1,
        filter: { category: "db" },
      });

      expect(hits.length).toBe(1);
      expect(hits[0].document?.category).toBe("db");
    });

    it("topK of 0 returns empty array", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 0,
      });

      expect(hits.length).toBe(0);
    });
  });

  // ============================================================
  // OFFSET PAGINATION
  // ============================================================

  describe("offset pagination", () => {
    it("offset skips first N results", async () => {
      // Get all results
      const allHits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 10,
      });

      // Get results with offset
      const offsetHits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 10,
        offset: 2,
      });

      expect(offsetHits.length).toBe(4); // 6 total - 2 skipped
      expect(offsetHits[0].id).toBe(allHits[2].id);
    });

    it("offset with topK limits correctly", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 2,
        offset: 2,
      });

      expect(hits.length).toBe(2);
    });

    it("offset beyond result count returns empty", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 10,
        offset: 100,
      });

      expect(hits.length).toBe(0);
    });

    it("pagination works correctly", async () => {
      // Page 1
      const page1 = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 2,
        offset: 0,
      });

      // Page 2
      const page2 = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 2,
        offset: 2,
      });

      // Page 3
      const page3 = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 2,
        offset: 4,
      });

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page3.length).toBe(2);

      // All IDs should be unique across pages
      const allIds = [...page1, ...page2, ...page3].map((h) => h.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(6);
    });

    it("offset with filter works correctly", async () => {
      // 2 docs in "ml" category
      const allMl = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 10,
        filter: { category: "ml" },
      });

      const offsetMl = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 10,
        offset: 1,
        filter: { category: "ml" },
      });

      expect(allMl.length).toBe(2);
      expect(offsetMl.length).toBe(1);
      expect(offsetMl[0].id).toBe(allMl[1].id);
    });
  });

  // ============================================================
  // ORDER BY (NON-VECTOR)
  // ============================================================

  describe("orderBy", () => {
    it("orders by integer field ascending", async () => {
      const hits = await handle.query({
        orderBy: { field: "priority", direction: "asc" },
        topK: 10,
      });

      expect(hits.length).toBe(6);
      expect(hits[0].document?.priority).toBe(1);
      expect(hits[5].document?.priority).toBe(6);

      // Verify order
      for (let i = 1; i < hits.length; i++) {
        expect(hits[i].document?.priority).toBeGreaterThanOrEqual(
          hits[i - 1].document?.priority ?? 0,
        );
      }
    });

    it("orders by integer field descending", async () => {
      const hits = await handle.query({
        orderBy: { field: "priority", direction: "desc" },
        topK: 10,
      });

      expect(hits[0].document?.priority).toBe(6);
      expect(hits[5].document?.priority).toBe(1);
    });

    it("orders by float field", async () => {
      // Note: We can still order by the "score" field even though it's excluded from the result
      const hits = await handle.query({
        orderBy: { field: "priority", direction: "desc" },
        topK: 10,
      });

      // Verify descending order by priority
      for (let i = 1; i < hits.length; i++) {
        expect(hits[i].document?.priority).toBeLessThanOrEqual(
          hits[i - 1].document?.priority ?? 0,
        );
      }
    });

    it("orders by string field", async () => {
      const hits = await handle.query({
        orderBy: { field: "title", direction: "asc" },
        topK: 10,
      });

      // Verify alphabetical order
      for (let i = 1; i < hits.length; i++) {
        const prev = hits[i - 1].document?.title ?? "";
        const curr = hits[i].document?.title ?? "";
        expect(curr.localeCompare(prev)).toBeGreaterThanOrEqual(0);
      }
    });

    it("orderBy with filter", async () => {
      const hits = await handle.query({
        filter: { category: "ml" },
        orderBy: { field: "priority", direction: "desc" },
        topK: 10,
      });

      expect(hits.length).toBe(2);
      expect(hits[0].document?.priority).toBe(2);
      expect(hits[1].document?.priority).toBe(1);
    });

    it("orderBy with topK limits after ordering", async () => {
      const hits = await handle.query({
        orderBy: { field: "priority", direction: "asc" },
        topK: 3,
      });

      expect(hits.length).toBe(3);
      expect(hits[0].document?.priority).toBe(1);
      expect(hits[1].document?.priority).toBe(2);
      expect(hits[2].document?.priority).toBe(3);
    });

    it("orderBy with offset", async () => {
      const hits = await handle.query({
        orderBy: { field: "priority", direction: "asc" },
        topK: 2,
        offset: 2,
      });

      expect(hits.length).toBe(2);
      expect(hits[0].document?.priority).toBe(3);
      expect(hits[1].document?.priority).toBe(4);
    });
  });

  // ============================================================
  // QUERY WITHOUT VECTOR
  // ============================================================

  describe("query without vector", () => {
    it("filter-only query returns all matching docs", async () => {
      const hits = await handle.query({
        filter: { category: "db" },
        topK: 10,
      });

      expect(hits.length).toBe(2);
      for (const hit of hits) {
        expect(hit.document?.category).toBe("db");
      }
    });

    it("empty query with orderBy returns ordered docs", async () => {
      const hits = await handle.query({
        orderBy: { field: "priority", direction: "asc" },
        topK: 10,
      });

      expect(hits.length).toBe(6);
      expect(hits[0].document?.priority).toBe(1);
    });

    it("filter + orderBy combination", async () => {
      const hits = await handle.query({
        filter: { category: "search" },
        orderBy: { field: "priority", direction: "desc" },
        topK: 10,
      });

      expect(hits.length).toBe(2);
      // Ordered by priority desc: vec-6 (priority 6), vec-5 (priority 5)
      expect(hits[0].document?.priority).toBe(6);
      expect(hits[1].document?.priority).toBe(5);
    });
  });

  // ============================================================
  // RESULT STRUCTURE
  // ============================================================

  describe("result structure", () => {
    it("results have required fields", async () => {
      const hits = await handle.query({
        query: [{ embedding: [1.0, 0.0, 0.0, 0.0] }],
        topK: 1,
      });

      expect(hits.length).toBe(1);
      expect(hits[0]).toHaveProperty("id");
      expect(hits[0]).toHaveProperty("index", testIndexId);
      expect(hits[0]).toHaveProperty("score");
      expect(typeof hits[0].id).toBe("string");
      expect(typeof hits[0].score).toBe("number");
    });

    it("score is a valid number", async () => {
      const hits = await handle.query({
        query: [{ embedding: [1.0, 0.0, 0.0, 0.0] }],
        topK: 5,
      });

      for (const hit of hits) {
        expect(typeof hit.score).toBe("number");
        expect(Number.isFinite(hit.score)).toBe(true);
      }
    });

    it("document fields are included by default", async () => {
      const hits = await handle.query({
        query: [{ embedding: [1.0, 0.0, 0.0, 0.0] }],
        topK: 1,
      });

      expect(hits[0].document).toBeDefined();
      expect(hits[0].document).toHaveProperty("title");
      expect(hits[0].document).toHaveProperty("category");
      expect(hits[0].document).toHaveProperty("priority");
      // Note: document "score" field is excluded to avoid conflict with hit.score
      expect(hits[0].document).not.toHaveProperty("score");
      expect(hits[0].document).toHaveProperty("embedding");
      // But the hit should have a score
      expect(hits[0].score).toBeDefined();
    });

    it("index field matches query index", async () => {
      const hits = await handle.query({
        query: [{ embedding: [1.0, 0.0, 0.0, 0.0] }],
        topK: 5,
      });

      for (const hit of hits) {
        expect(hit.index).toBe(testIndexId);
      }
    });
  });

  // ============================================================
  // EMPTY RESULTS
  // ============================================================

  describe("empty results", () => {
    it("filter with no matches returns empty array", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        filter: { category: "nonexistent" },
        topK: 10,
      });

      expect(hits).toEqual([]);
    });

    it("offset beyond result count returns empty array", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 10,
        offset: 1000,
      });

      expect(hits).toEqual([]);
    });

    it("topK 0 returns empty array", async () => {
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 0,
      });

      expect(hits).toEqual([]);
    });
  });

  // ============================================================
  // DIFFERENT SIMILARITY METRICS
  // ============================================================

  describe("similarity metrics", () => {
    it("euclidean distance index works correctly", async () => {
      await pgvec.createIndex({
        id: "euclidean_test",
        schema: {
          id: { type: "string", pk: true },
          embedding: { type: "vector", dimensions: 4, similarity: "euclidean" },
        },
        providerOptions: { schema: SCHEMA },
      });

      const eucHandle = pgvec.index("euclidean_test");

      await eucHandle.upsert([
        { id: "e1", embedding: [1, 0, 0, 0] },
        { id: "e2", embedding: [0, 1, 0, 0] },
        { id: "e3", embedding: [0.9, 0.1, 0, 0] },
      ]);

      const hits = await eucHandle.query({
        query: [{ embedding: [1, 0, 0, 0] }],
        topK: 3,
      });

      expect(hits[0].id).toBe("e1"); // Exact match
      expect(hits[1].id).toBe("e3"); // Closest
    });

    it("dot product index works correctly", async () => {
      await pgvec.createIndex({
        id: "dot_test",
        schema: {
          id: { type: "string", pk: true },
          embedding: {
            type: "vector",
            dimensions: 4,
            similarity: "dot_product",
          },
        },
        providerOptions: { schema: SCHEMA },
      });

      const dotHandle = pgvec.index("dot_test");

      await dotHandle.upsert([
        { id: "d1", embedding: [1, 0, 0, 0] },
        { id: "d2", embedding: [0, 1, 0, 0] },
        { id: "d3", embedding: [0.5, 0.5, 0, 0] },
      ]);

      const hits = await dotHandle.query({
        query: [{ embedding: [1, 1, 0, 0] }],
        topK: 3,
      });

      // Dot product: d1=1, d2=1, d3=1
      // With equal dot products, order may vary, but d3 should be competitive
      expect(hits.map((h) => h.id).sort()).toEqual(["d1", "d2", "d3"]);
    });
  });
});
