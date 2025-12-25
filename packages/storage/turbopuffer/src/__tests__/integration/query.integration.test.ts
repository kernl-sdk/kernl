/**
 * Comprehensive query modes integration tests.
 *
 * Tests vector search, BM25 text search, hybrid queries, fusion modes,
 * limit behavior, include semantics, and rank ordering against real Turbopuffer API.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { TurbopufferSearchIndex } from "../../search";
import type { IndexHandle } from "@kernl-sdk/retrieval";

const TURBOPUFFER_API_KEY = process.env.TURBOPUFFER_API_KEY;
const TURBOPUFFER_REGION = process.env.TURBOPUFFER_REGION ?? "api";

/**
 * Test document type.
 */
interface TestDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  vector: number[];
}

/**
 * Deterministic test dataset for query testing.
 *
 * Documents are designed to have predictable vector similarity and text relevance:
 * - Vectors are orthogonal basis vectors for predictable ANN results
 * - Text content has specific keywords for BM25 testing
 */
const TEST_DOCS: TestDoc[] = [
  {
    id: "vec-1",
    title: "Machine Learning Basics",
    content: "Introduction to neural networks and deep learning fundamentals",
    category: "ml",
    priority: 1,
    vector: [1.0, 0.0, 0.0, 0.0], // Basis vector 1
  },
  {
    id: "vec-2",
    title: "Advanced Neural Networks",
    content:
      "Deep dive into transformer architectures and attention mechanisms",
    category: "ml",
    priority: 2,
    vector: [0.0, 1.0, 0.0, 0.0], // Basis vector 2
  },
  {
    id: "vec-3",
    title: "Database Fundamentals",
    content: "SQL queries and relational database design patterns",
    category: "db",
    priority: 3,
    vector: [0.0, 0.0, 1.0, 0.0], // Basis vector 3
  },
  {
    id: "vec-4",
    title: "Vector Databases",
    content: "Introduction to vector search and similarity matching",
    category: "db",
    priority: 4,
    vector: [0.0, 0.0, 0.0, 1.0], // Basis vector 4
  },
  {
    id: "vec-5",
    title: "Search Engine Optimization",
    content: "BM25 ranking and full text search algorithms",
    category: "search",
    priority: 5,
    vector: [0.5, 0.5, 0.0, 0.0], // Mix of 1 and 2
  },
  {
    id: "vec-6",
    title: "Hybrid Search Systems",
    content: "Combining vector and keyword search for better results",
    category: "search",
    priority: 6,
    vector: [0.0, 0.5, 0.5, 0.0], // Mix of 2 and 3
  },
];

describe("Query modes integration tests", () => {
  if (!TURBOPUFFER_API_KEY) {
    it.skip("requires TURBOPUFFER_API_KEY to be set", () => {});
    return;
  }

  let tpuf: TurbopufferSearchIndex;
  let index: IndexHandle<TestDoc>;
  const testIndexId = `kernl-query-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    tpuf = new TurbopufferSearchIndex({
      apiKey: TURBOPUFFER_API_KEY,
      region: TURBOPUFFER_REGION,
    });

    // Create index with FTS-enabled fields
    await tpuf.createIndex({
      id: testIndexId,
      schema: {
        title: { type: "string", fts: true, filterable: true },
        content: { type: "string", fts: true },
        category: { type: "string", filterable: true },
        priority: { type: "int", filterable: true },
        vector: { type: "vector", dimensions: 4 },
      },
    });

    index = tpuf.index<TestDoc>(testIndexId);

    // insert test documents
    await index.upsert(TEST_DOCS);

    // Wait for indexing
    await new Promise((r) => setTimeout(r, 2000));
  }, 30000);

  afterAll(async () => {
    try {
      await tpuf.deleteIndex(testIndexId);
    } catch {
      // Ignore cleanup errors
    }
  });

  // ============================================================
  // VECTOR SEARCH
  // ============================================================

  describe("vector search", () => {
    it("returns exact match as top result", async () => {
      // Query with basis vector 1 - should match vec-1 best
      const hits = await index.query({
        query: [{ vector: [1.0, 0.0, 0.0, 0.0] }],
        limit: 10,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].id).toBe("vec-1");
    });

    it("returns results in similarity order", async () => {
      // Query with basis vector 2
      const hits = await index.query({
        query: [{ vector: [0.0, 1.0, 0.0, 0.0] }],
        limit: 10,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].id).toBe("vec-2");

      // Scores should be in descending order (or ascending distance)
      for (let i = 1; i < hits.length; i++) {
        expect(hits[i].score).toBeLessThanOrEqual(hits[i - 1].score);
      }
    });

    it("mixed vector query finds composite matches", async () => {
      // Query with mix of basis 1 and 2 - should prefer vec-5 which has [0.5, 0.5, 0, 0]
      const hits = await index.query({
        query: [{ vector: [0.5, 0.5, 0.0, 0.0] }],
        limit: 10,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].id).toBe("vec-5");
    });
  });

  // ============================================================
  // LIMIT BEHAVIOR
  // ============================================================

  describe("limit behavior", () => {
    it("limit smaller than doc count returns exactly limit", async () => {
      const hits = await index.query({
        query: [{ vector: [0.5, 0.5, 0.5, 0.5] }],
        limit: 3,
      });

      expect(hits.length).toBe(3);
    });

    it("limit larger than doc count returns all docs", async () => {
      const hits = await index.query({
        query: [{ vector: [0.5, 0.5, 0.5, 0.5] }],
        limit: 100,
      });

      // We have 6 docs
      expect(hits.length).toBe(6);
    });

    it("limit of 1 returns single best match", async () => {
      const hits = await index.query({
        query: [{ vector: [1.0, 0.0, 0.0, 0.0] }],
        limit: 1,
      });

      expect(hits.length).toBe(1);
      expect(hits[0].id).toBe("vec-1");
    });
  });

  // ============================================================
  // TEXT SEARCH (BM25)
  // ============================================================

  describe("text search (BM25)", () => {
    it("single field text query finds matching docs", async () => {
      const hits = await index.query({
        query: [{ title: "neural" }],
        limit: 10,
        include: ["title"],
      });

      expect(hits.length).toBeGreaterThan(0);
      // Should find docs with "neural" in title
      const titles = hits.map((h) => h.document?.title);
      expect(titles.some((t) => t?.toLowerCase().includes("neural"))).toBe(
        true,
      );
    });

    it("content field text query finds matching docs", async () => {
      const hits = await index.query({
        query: [{ content: "transformer" }],
        limit: 10,
        include: ["content"],
      });

      expect(hits.length).toBeGreaterThan(0);
      // vec-2 has "transformer" in content
      expect(hits.some((h) => h.id === "vec-2")).toBe(true);
    });

    it("multi-field text query searches both fields", async () => {
      const hits = await index.query({
        query: [{ title: "database" }, { content: "database" }],
        limit: 10,
        include: ["title", "content"],
      });

      expect(hits.length).toBeGreaterThan(0);
      // vec-3 and vec-4 have "database" related content
      const ids = hits.map((h) => h.id);
      expect(ids.some((id) => id === "vec-3" || id === "vec-4")).toBe(true);
    });

    it("text query with no matches returns empty", async () => {
      const hits = await index.query({
        query: [{ content: "xyznonexistentkeyword123" }],
        limit: 10,
      });

      expect(hits.length).toBe(0);
    });
  });

  // ============================================================
  // HYBRID QUERIES - NOT SUPPORTED BY TURBOPUFFER
  // ============================================================

  describe("hybrid queries", () => {
    it("throws error for vector + text hybrid fusion", async () => {
      await expect(
        index.query({
          query: [{ vector: [1.0, 0.0, 0.0, 0.0] }, { content: "search" }],
          limit: 10,
        }),
      ).rejects.toThrow(/does not support hybrid/);
    });

    it("throws error for multi-vector fusion", async () => {
      await expect(
        index.query({
          query: [
            { vector: [1.0, 0.0, 0.0, 0.0] },
            { vector: [0.0, 1.0, 0.0, 0.0] },
          ],
          limit: 10,
        }),
      ).rejects.toThrow(/does not support multi-vector/);
    });
  });

  // ============================================================
  // FUSION MODES (TEXT ONLY)
  // ============================================================

  describe("fusion modes", () => {
    it("Sum fusion combines multiple BM25 signals", async () => {
      const hits = await index.query({
        query: [{ title: "database" }, { content: "database" }],
        limit: 10,
        include: ["title", "content"],
      });

      expect(hits.length).toBeGreaterThan(0);
      // Should find docs with "database" in title or content
      const ids = hits.map((h) => h.id);
      expect(ids.some((id) => id === "vec-3" || id === "vec-4")).toBe(true);
    });

    it("Max fusion takes best BM25 signal per doc", async () => {
      const hits = await index.query({
        max: [{ title: "neural" }, { content: "neural" }],
        limit: 10,
        include: ["title", "content"],
      });

      expect(hits.length).toBeGreaterThan(0);
      // Should find docs with "neural" in title or content
      const ids = hits.map((h) => h.id);
      expect(ids.some((id) => id === "vec-1" || id === "vec-2")).toBe(true);
    });
  });

  // ============================================================
  // INCLUDE SEMANTICS
  // ============================================================

  describe("include semantics", () => {
    it("include: true returns all attributes", async () => {
      const hits = await index.query({
        query: [{ vector: [1.0, 0.0, 0.0, 0.0] }],
        limit: 1,
        include: true,
      });

      expect(hits.length).toBe(1);
      expect(hits[0].document).toBeDefined();
      expect(hits[0].document).toHaveProperty("title");
      expect(hits[0].document).toHaveProperty("content");
      expect(hits[0].document).toHaveProperty("category");
      expect(hits[0].document).toHaveProperty("priority");
    });

    it("include: false returns only id", async () => {
      const hits = await index.query({
        query: [{ vector: [1.0, 0.0, 0.0, 0.0] }],
        limit: 1,
        include: false,
      });

      expect(hits.length).toBe(1);
      // Turbopuffer always returns id, but no other attributes
      const { id, ...rest } = hits[0].document ?? {};
      expect(Object.keys(rest).length).toBe(0);
    });

    it("include: [fields] returns only specified fields", async () => {
      const hits = await index.query({
        query: [{ vector: [1.0, 0.0, 0.0, 0.0] }],
        limit: 1,
        include: ["title", "category"],
      });

      expect(hits.length).toBe(1);
      expect(hits[0].document).toBeDefined();
      expect(hits[0].document).toHaveProperty("title");
      expect(hits[0].document).toHaveProperty("category");
      // Should NOT have content or priority
      expect(hits[0].document).not.toHaveProperty("content");
      expect(hits[0].document).not.toHaveProperty("priority");
    });

    it("include: [] returns only id", async () => {
      const hits = await index.query({
        query: [{ vector: [1.0, 0.0, 0.0, 0.0] }],
        limit: 1,
        include: [],
      });

      expect(hits.length).toBe(1);
      // Turbopuffer always returns id, but no other attributes
      const { id, ...rest } = hits[0].document ?? {};
      expect(Object.keys(rest).length).toBe(0);
    });
  });

  // ============================================================
  // QUERY WITH FILTERS
  // ============================================================

  describe("query with filters", () => {
    it("filter by category", async () => {
      const hits = await index.query({
        query: [{ vector: [0.5, 0.5, 0.5, 0.5] }],
        limit: 10,
        filter: { category: "ml" },
        include: ["category"],
      });

      expect(hits.length).toBe(2); // vec-1, vec-2
      for (const hit of hits) {
        expect(hit.document?.category).toBe("ml");
      }
    });

    it("filter by priority range", async () => {
      const hits = await index.query({
        query: [{ vector: [0.5, 0.5, 0.5, 0.5] }],
        limit: 10,
        filter: { priority: { $gte: 3, $lte: 5 } },
        include: ["priority"],
      });

      expect(hits.length).toBe(3); // priority 3, 4, 5
      for (const hit of hits) {
        expect(hit.document?.priority).toBeGreaterThanOrEqual(3);
        expect(hit.document?.priority).toBeLessThanOrEqual(5);
      }
    });

    it("filter with $or", async () => {
      const hits = await index.query({
        query: [{ vector: [0.5, 0.5, 0.5, 0.5] }],
        limit: 10,
        filter: {
          $or: [{ category: "ml" }, { category: "search" }],
        },
        include: ["category"],
      });

      expect(hits.length).toBe(4); // ml: 2, search: 2
      for (const hit of hits) {
        expect(["ml", "search"]).toContain(hit.document?.category);
      }
    });
  });

  // ============================================================
  // RESULT STRUCTURE
  // ============================================================

  describe("result structure", () => {
    it("results have required fields", async () => {
      const hits = await index.query({
        query: [{ vector: [1.0, 0.0, 0.0, 0.0] }],
        limit: 1,
      });

      expect(hits.length).toBe(1);
      expect(hits[0]).toHaveProperty("id");
      expect(hits[0]).toHaveProperty("index", testIndexId);
      expect(hits[0]).toHaveProperty("score");
      expect(typeof hits[0].id).toBe("string");
      expect(typeof hits[0].score).toBe("number");
    });

    it("score is a valid number", async () => {
      const hits = await index.query({
        query: [{ vector: [1.0, 0.0, 0.0, 0.0] }],
        limit: 5,
      });

      for (const hit of hits) {
        expect(typeof hit.score).toBe("number");
        expect(Number.isFinite(hit.score)).toBe(true);
      }
    });
  });
});
