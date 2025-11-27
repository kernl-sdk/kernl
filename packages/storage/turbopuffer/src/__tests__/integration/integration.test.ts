import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { TurbopufferSearchIndex } from "../../search";

const TURBOPUFFER_API_KEY = process.env.TURBOPUFFER_API_KEY;
const TURBOPUFFER_REGION = process.env.TURBOPUFFER_REGION ?? "api";

describe("TurbopufferSearchIndex integration", () => {
  if (!TURBOPUFFER_API_KEY) {
    it.skip("requires TURBOPUFFER_API_KEY to be set", () => {});
    return;
  }

  let tpuf: TurbopufferSearchIndex;
  const testIndexId = `kernl-test-${Date.now()}`;

  beforeAll(() => {
    tpuf = new TurbopufferSearchIndex({
      apiKey: TURBOPUFFER_API_KEY,
      region: TURBOPUFFER_REGION,
    });
  });

  afterAll(async () => {
    // Clean up test index
    try {
      await tpuf.deleteIndex(testIndexId);
    } catch {
      // Ignore errors if index doesn't exist
    }
  });

  describe("createIndex", () => {
    it("creates a new index with schema", async () => {
      await tpuf.createIndex({
        id: testIndexId,
        schema: {
          content: { type: "string", fts: true },
          vector: { type: "vector", dimensions: 384 },
          category: { type: "string", filterable: true },
        },
      });

      // Verify the index was created by describing it
      const stats = await tpuf.describeIndex(testIndexId);
      expect(stats.id).toBe(testIndexId);
      expect(stats.status).toBe("ready");
    });

    it("throws if vector field is not named 'vector'", async () => {
      await expect(
        tpuf.createIndex({
          id: `${testIndexId}-invalid`,
          schema: {
            embedding: { type: "vector", dimensions: 384 },
          },
        }),
      ).rejects.toThrow(/requires vector fields to be named "vector"/);
    });
  });

  describe("listIndexes", () => {
    it("returns a CursorPage of indexes", async () => {
      const page = await tpuf.listIndexes();

      expect(page).toBeDefined();
      expect(page.items).toBeDefined();
      expect(Array.isArray(page.items)).toBe(true);

      // Each item should have an id
      for (const idx of page.items) {
        expect(typeof idx.id).toBe("string");
      }
    });

    it("supports pagination with limit", async () => {
      const page = await tpuf.listIndexes({ limit: 2 });

      expect(page.items.length).toBeLessThanOrEqual(2);
    });

    it("supports prefix filtering", async () => {
      const page = await tpuf.listIndexes({ prefix: "kernl-test-" });

      expect(page).toBeDefined();
      expect(Array.isArray(page.items)).toBe(true);

      // Should find our test index
      const found = page.items.some((idx) => idx.id === testIndexId);
      expect(found).toBe(true);

      // All results should match prefix
      for (const idx of page.items) {
        expect(idx.id.startsWith("kernl-test-")).toBe(true);
      }
    });

    it("supports async iteration via collect()", async () => {
      const page = await tpuf.listIndexes({ limit: 5 });
      const all = await page.collect();

      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThanOrEqual(page.items.length);
    });

    it("supports for-await iteration", async () => {
      const page = await tpuf.listIndexes({ limit: 3 });
      const collected: string[] = [];

      for await (const idx of page) {
        collected.push(idx.id);
        if (collected.length >= 3) break;
      }

      expect(collected.length).toBeLessThanOrEqual(3);
    });
  });

  describe("describeIndex", () => {
    it("returns stats for the test index", async () => {
      const stats = await tpuf.describeIndex(testIndexId);

      expect(stats.id).toBe(testIndexId);
      expect(typeof stats.count).toBe("number");
      expect(stats.count).toBeGreaterThanOrEqual(0);
      expect(stats.status).toBe("ready");

      if (stats.sizeb !== undefined) {
        expect(typeof stats.sizeb).toBe("number");
      }
    });

    it("throws for non-existent index", async () => {
      await expect(
        tpuf.describeIndex("non-existent-index-12345"),
      ).rejects.toThrow();
    });
  });

  describe("deleteIndex", () => {
    it("deletes an existing index", async () => {
      // Create a temporary index to delete
      const tempId = `kernl-test-delete-${Date.now()}`;

      await tpuf.createIndex({
        id: tempId,
        schema: {
          text: { type: "string" },
        },
      });

      // Verify it exists
      const stats = await tpuf.describeIndex(tempId);
      expect(stats.id).toBe(tempId);

      // Delete it
      await tpuf.deleteIndex(tempId);

      // Verify it's gone
      await expect(tpuf.describeIndex(tempId)).rejects.toThrow();
    });
  });

  describe("upsert", () => {
    it("inserts a document with vector", async () => {
      const vec = new Array(384).fill(0.1);
      const index = tpuf.index(testIndexId);

      await index.upsert({
        id: "doc-1",
        content: "Hello world",
        vector: vec,
        category: "greeting",
      });

      // Verify via query
      const hits = await index.query({
        query: [{ vector: vec }],
        topK: 10,
        include: ["category"],
      });

      expect(hits.length).toBeGreaterThanOrEqual(1);
      const doc = hits.find((h) => h.id === "doc-1");
      expect(doc).toBeDefined();
      expect(doc?.document?.category).toBe("greeting");
    });

    it("updates an existing document", async () => {
      const vec = new Array(384).fill(0.2);
      const index = tpuf.index(testIndexId);

      // Upsert same id with different content
      await index.upsert({
        id: "doc-1",
        content: "Updated content",
        vector: vec,
        category: "updated",
      });

      // Verify via query
      const hits = await index.query({
        query: [{ vector: vec }],
        topK: 10,
        include: ["category"],
      });

      const doc = hits.find((h) => h.id === "doc-1");
      expect(doc).toBeDefined();
      expect(doc?.document?.category).toBe("updated");
    });
  });

  describe("upsert (multiple)", () => {
    it("inserts multiple documents", async () => {
      const index = tpuf.index(testIndexId);

      await index.upsert([
        {
          id: "doc-2",
          content: "Second document",
          vector: new Array(384).fill(0.3),
          category: "test",
        },
        {
          id: "doc-3",
          content: "Third document",
          vector: new Array(384).fill(0.4),
          category: "test",
        },
      ]);

      // Verify via query with filter
      const hits = await index.query({
        query: [{ vector: new Array(384).fill(0.3) }],
        topK: 10,
        filter: { category: "test" },
        include: true,
      });

      expect(hits.length).toBeGreaterThanOrEqual(2);
      const ids = hits.map((h) => h.id);
      expect(ids).toContain("doc-2");
      expect(ids).toContain("doc-3");
    });

    it("handles empty array", async () => {
      const index = tpuf.index(testIndexId);
      // Should not throw
      await index.upsert([]);
    });
  });

  describe("query", () => {
    it("performs vector search", async () => {
      const index = tpuf.index(testIndexId);

      const hits = await index.query({
        query: [{ vector: new Array(384).fill(0.1) }],
        topK: 5,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0]).toHaveProperty("id");
      expect(hits[0]).toHaveProperty("score");
      expect(hits[0]).toHaveProperty("index", testIndexId);
    });

    it("returns requested fields", async () => {
      const index = tpuf.index(testIndexId);

      const hits = await index.query({
        query: [{ vector: new Array(384).fill(0.1) }],
        topK: 5,
        include: ["content", "category"],
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].document).toBeDefined();
      expect(hits[0].document).toHaveProperty("content");
      expect(hits[0].document).toHaveProperty("category");
    });

    it("filters results", async () => {
      const index = tpuf.index(testIndexId);

      const hits = await index.query({
        query: [{ vector: new Array(384).fill(0.3) }],
        topK: 10,
        filter: { category: "test" },
        include: ["category"],
      });

      expect(hits.length).toBeGreaterThan(0);
      for (const hit of hits) {
        expect(hit.document?.category).toBe("test");
      }
    });

    it("supports AND filters", async () => {
      const index = tpuf.index(testIndexId);

      const hits = await index.query({
        query: [{ vector: new Array(384).fill(0.3) }],
        topK: 10,
        filter: {
          $and: [
            { category: "test" },
            { id: { $in: ["doc-2", "doc-3"] } },
          ],
        },
        include: ["category"],
      });

      expect(hits.length).toBeGreaterThanOrEqual(0);
      for (const hit of hits) {
        expect(hit.document?.category).toBe("test");
      }
    });
  });

  describe("delete", () => {
    it("deletes a document by id", async () => {
      const vec = new Array(384).fill(0.5);
      const index = tpuf.index(testIndexId);

      // Insert a document to delete
      await index.upsert({
        id: "doc-to-delete",
        content: "Delete me",
        vector: vec,
        category: "deletable",
      });

      // Verify it exists
      let hits = await index.query({
        query: [{ vector: vec }],
        topK: 10,
        filter: { id: "doc-to-delete" },
      });
      expect(hits.some((h) => h.id === "doc-to-delete")).toBe(true);

      // Delete it
      await index.delete("doc-to-delete");

      // Verify it's gone
      hits = await index.query({
        query: [{ vector: vec }],
        topK: 10,
        filter: { id: "doc-to-delete" },
      });
      expect(hits.some((h) => h.id === "doc-to-delete")).toBe(false);
    });
  });

  describe("delete (multiple)", () => {
    it("deletes multiple documents by ids", async () => {
      const vec = new Array(384).fill(0.6);
      const index = tpuf.index(testIndexId);

      // Insert documents to delete
      await index.upsert([
        {
          id: "bulk-del-1",
          content: "Bulk delete 1",
          vector: vec,
          category: "bulk-delete",
        },
        {
          id: "bulk-del-2",
          content: "Bulk delete 2",
          vector: vec,
          category: "bulk-delete",
        },
      ]);

      // Verify they exist
      let hits = await index.query({
        query: [{ vector: vec }],
        topK: 10,
        filter: { category: "bulk-delete" },
      });
      expect(hits.length).toBeGreaterThanOrEqual(2);

      // Delete by ids
      await index.delete(["bulk-del-1", "bulk-del-2"]);

      // Verify they're gone
      hits = await index.query({
        query: [{ vector: vec }],
        topK: 10,
        filter: { category: "bulk-delete" },
      });
      expect(hits.some((h) => h.id === "bulk-del-1")).toBe(false);
      expect(hits.some((h) => h.id === "bulk-del-2")).toBe(false);
    });
  });

});
