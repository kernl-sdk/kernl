/**
 * Index and handle lifecycle edge case integration tests.
 *
 * Tests edge cases for index lifecycle operations and document handling
 * against real Turbopuffer API.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { TurbopufferSearchIndex } from "../../search";

const TURBOPUFFER_API_KEY = process.env.TURBOPUFFER_API_KEY;
const TURBOPUFFER_REGION = process.env.TURBOPUFFER_REGION ?? "api";

/**
 * Helper to create a vector array.
 */
function vec(dim: number, fill = 0.1) {
  return new Array(dim).fill(fill);
}

describe("Lifecycle edge cases integration tests", () => {
  if (!TURBOPUFFER_API_KEY) {
    it.skip("requires TURBOPUFFER_API_KEY to be set", () => {});
    return;
  }

  let tpuf: TurbopufferSearchIndex;
  const testPrefix = `kernl-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(() => {
    tpuf = new TurbopufferSearchIndex({
      apiKey: TURBOPUFFER_API_KEY,
      region: TURBOPUFFER_REGION,
    });
  });

  afterAll(async () => {
    // Clean up any test indexes that might have been created
    try {
      const page = await tpuf.listIndexes({ prefix: testPrefix });
      for (const idx of page.items) {
        try {
          await tpuf.deleteIndex(idx.id);
        } catch {
          // Ignore individual cleanup errors
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  // ============================================================
  // INDEX LIFECYCLE EDGE CASES
  // ============================================================

  describe("index lifecycle edge cases", () => {
    it("describes index immediately after creation", async () => {
      const indexId = `${testPrefix}-describe-after-create`;

      await tpuf.createIndex({
        id: indexId,
        schema: {
          text: { type: "string" },
          vector: { type: "vector", dimensions: 4 },
        },
      });

      const stats = await tpuf.describeIndex(indexId);
      expect(stats.id).toBe(indexId);
      expect(stats.count).toBe(0);

      await tpuf.deleteIndex(indexId);
    });

    it("describe after delete throws", async () => {
      const indexId = `${testPrefix}-describe-after-delete`;

      await tpuf.createIndex({
        id: indexId,
        schema: { text: { type: "string" } },
      });

      await tpuf.deleteIndex(indexId);

      await expect(tpuf.describeIndex(indexId)).rejects.toThrow();
    });

    it("delete non-existent index throws", async () => {
      const indexId = `${testPrefix}-nonexistent-${Date.now()}`;

      await expect(tpuf.deleteIndex(indexId)).rejects.toThrow();
    });

    it("create index with same id twice is idempotent", async () => {
      const indexId = `${testPrefix}-duplicate`;

      await tpuf.createIndex({
        id: indexId,
        schema: { text: { type: "string" } },
      });

      // Second create should succeed (idempotent) - Turbopuffer creates indexes implicitly
      await tpuf.createIndex({
        id: indexId,
        schema: { text: { type: "string" } },
      });

      // Verify index still exists and is accessible
      const stats = await tpuf.describeIndex(indexId);
      expect(stats.id).toBe(indexId);

      await tpuf.deleteIndex(indexId);
    });

    it("listIndexes returns empty page for non-matching prefix", async () => {
      const page = await tpuf.listIndexes({
        prefix: `nonexistent-prefix-${Date.now()}`,
      });

      expect(page.items).toEqual([]);
    });
  });

  // ============================================================
  // DOCUMENT UPSERT EDGE CASES
  // ============================================================

  describe("document upsert edge cases", () => {
    const indexId = `${testPrefix}-upsert-edge`;

    beforeAll(async () => {
      await tpuf.createIndex({
        id: indexId,
        schema: {
          content: { type: "string" },
          count: { type: "int" },
          vector: { type: "vector", dimensions: 4 },
        },
      });
    });

    afterAll(async () => {
      try {
        await tpuf.deleteIndex(indexId);
      } catch {
        // Ignore
      }
    });

    it("multiple upserts same id keeps last write", async () => {
      const index = tpuf.index(indexId);

      // First write
      await index.upsert({
        id: "overwrite-test",
        content: "First version",
        count: 1,
        vector: vec(4, 0.1),
      });

      // Second write
      await index.upsert({
        id: "overwrite-test",
        content: "Second version",
        count: 2,
        vector: vec(4, 0.2),
      });

      // Third write
      await index.upsert({
        id: "overwrite-test",
        content: "Final version",
        count: 3,
        vector: vec(4, 0.3),
      });

      // Wait for indexing
      await new Promise((r) => setTimeout(r, 1000));

      // Query and verify final state
      const hits = await index.query({
        query: [{ vector: [0.3, 0.3, 0.3, 0.3] }],
        topK: 10,
        filter: { id: "overwrite-test" },
        include: ["content", "count"],
      });

      expect(hits.length).toBe(1);
      expect(hits[0].document?.content).toBe("Final version");
      expect(hits[0].document?.count).toBe(3);
    });

    it("upsert with empty fields object", async () => {
      const index = tpuf.index(indexId);

      // This should work - document with just id and vector
      await index.upsert({
        id: "minimal-doc",
        vector: vec(4),
      });

      await new Promise((r) => setTimeout(r, 500));

      const hits = await index.query({
        query: [{ vector: [0.1, 0.1, 0.1, 0.1] }],
        topK: 10,
        filter: { id: "minimal-doc" },
      });

      expect(hits.some((h) => h.id === "minimal-doc")).toBe(true);
    });

    it("batch upsert with same id in batch throws", async () => {
      const index = tpuf.index(indexId);

      // Turbopuffer rejects batches with duplicate IDs
      await expect(
        index.upsert([
          {
            id: "batch-dup",
            content: "First",
            count: 1,
            vector: vec(4, 0.1),
          },
          {
            id: "batch-dup",
            content: "Second",
            count: 2,
            vector: vec(4, 0.2),
          },
          {
            id: "batch-dup",
            content: "Third",
            count: 3,
            vector: vec(4, 0.3),
          },
        ]),
      ).rejects.toThrow(/duplicate document IDs/i);
    });
  });

  // ============================================================
  // DOCUMENT DELETE EDGE CASES
  // ============================================================

  describe("document delete edge cases", () => {
    const indexId = `${testPrefix}-delete-edge`;

    beforeAll(async () => {
      await tpuf.createIndex({
        id: indexId,
        schema: {
          content: { type: "string" },
          vector: { type: "vector", dimensions: 4 },
        },
      });
    });

    afterAll(async () => {
      try {
        await tpuf.deleteIndex(indexId);
      } catch {
        // Ignore
      }
    });

    it("delete non-existent id does not throw", async () => {
      const index = tpuf.index(indexId);

      // Should not throw - just a no-op
      const result = await index.delete("nonexistent-doc-id-12345");

      // count reflects input, not actual deletions
      expect(result.count).toBe(1);
    });

    it("batch delete with non-existent ids does not throw", async () => {
      const index = tpuf.index(indexId);

      const result = await index.delete([
        "nonexistent-1",
        "nonexistent-2",
        "nonexistent-3",
      ]);

      expect(result.count).toBe(3);
    });

    it("delete empty array returns count 0", async () => {
      const index = tpuf.index(indexId);

      const result = await index.delete([]);

      expect(result.count).toBe(0);
    });

    it("delete then query returns empty", async () => {
      const index = tpuf.index(indexId);

      // Insert
      await index.upsert({
        id: "to-delete",
        content: "Will be deleted",
        vector: vec(4, 0.9),
      });

      await new Promise((r) => setTimeout(r, 500));

      // Verify exists
      let hits = await index.query({
        query: [{ vector: [0.9, 0.9, 0.9, 0.9] }],
        topK: 10,
        filter: { id: "to-delete" },
      });
      expect(hits.length).toBe(1);

      // Delete
      await index.delete("to-delete");

      await new Promise((r) => setTimeout(r, 500));

      // Verify gone
      hits = await index.query({
        query: [{ vector: [0.9, 0.9, 0.9, 0.9] }],
        topK: 10,
        filter: { id: "to-delete" },
      });
      expect(hits.length).toBe(0);
    });
  });

  // ============================================================
  // QUERY EDGE CASES
  // ============================================================

  describe("query edge cases", () => {
    const indexId = `${testPrefix}-query-edge`;

    beforeAll(async () => {
      await tpuf.createIndex({
        id: indexId,
        schema: {
          content: { type: "string", fts: true },
          vector: { type: "vector", dimensions: 4 },
        },
      });
    });

    afterAll(async () => {
      try {
        await tpuf.deleteIndex(indexId);
      } catch {
        // Ignore
      }
    });

    it("query on empty index returns empty array", async () => {
      const index = tpuf.index(indexId);

      const hits = await index.query({
        query: [{ vector: [0.1, 0.2, 0.3, 0.4] }],
        topK: 10,
      });

      expect(hits).toEqual([]);
    });

    it("query with filter matching nothing returns empty", async () => {
      const index = tpuf.index(indexId);

      // Add a doc first
      await index.upsert({
        id: "query-edge-doc",
        content: "Test content",
        vector: vec(4),
      });

      await new Promise((r) => setTimeout(r, 500));

      // Query with filter that matches nothing
      const hits = await index.query({
        query: [{ vector: [0.1, 0.1, 0.1, 0.1] }],
        topK: 10,
        filter: { id: "nonexistent-id" },
      });

      expect(hits).toEqual([]);
    });

    it("topK of 0 throws", async () => {
      const index = tpuf.index(indexId);

      // Turbopuffer requires topK between 1 and 1200
      await expect(
        index.query({
          query: [{ vector: [0.1, 0.1, 0.1, 0.1] }],
          topK: 0,
        }),
      ).rejects.toThrow(/top_k must be between 1 and 1200/i);
    });
  });

  // ============================================================
  // VECTOR DIMENSION EDGE CASES
  // ============================================================

  describe("vector dimension edge cases", () => {
    it("upsert with wrong vector dimension throws", async () => {
      const indexId = `${testPrefix}-wrong-dim`;

      await tpuf.createIndex({
        id: indexId,
        schema: {
          vector: { type: "vector", dimensions: 4 },
        },
      });

      const index = tpuf.index(indexId);

      // Try to upsert with wrong dimension (8 instead of 4)
      await expect(
        index.upsert({
          id: "wrong-dim-doc",
          vector: vec(8), // Wrong dimension!
        }),
      ).rejects.toThrow();

      await tpuf.deleteIndex(indexId);
    });

    it("query with wrong vector dimension throws", async () => {
      const indexId = `${testPrefix}-wrong-query-dim`;

      await tpuf.createIndex({
        id: indexId,
        schema: {
          vector: { type: "vector", dimensions: 4 },
        },
      });

      const index = tpuf.index(indexId);

      // Insert valid doc
      await index.upsert({
        id: "valid-doc",
        vector: vec(4),
      });

      await new Promise((r) => setTimeout(r, 500));

      // Query with wrong dimension
      await expect(
        index.query({
          query: [{ vector: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] }], // 8 dims
          topK: 10,
        }),
      ).rejects.toThrow();

      await tpuf.deleteIndex(indexId);
    });
  });
});
