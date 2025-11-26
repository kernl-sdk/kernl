import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { TurbopufferSearchIndex } from "../search";

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
      await tpuf.deleteIndex({ id: testIndexId });
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
      const stats = await tpuf.describeIndex({ id: testIndexId });
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
      const stats = await tpuf.describeIndex({ id: testIndexId });

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
        tpuf.describeIndex({ id: "non-existent-index-12345" }),
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
      const stats = await tpuf.describeIndex({ id: tempId });
      expect(stats.id).toBe(tempId);

      // Delete it
      await tpuf.deleteIndex({ id: tempId });

      // Verify it's gone
      await expect(tpuf.describeIndex({ id: tempId })).rejects.toThrow();
    });
  });

  describe("upsert", () => {
    it("inserts a document with vector", async () => {
      const vec = new Array(384).fill(0.1);

      await tpuf.upsert({
        id: "doc-1",
        index: testIndexId,
        fields: {
          content: "Hello world",
          vector: { kind: "vector", values: vec },
          category: "greeting",
        },
      });

      // Verify via query
      const hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        include: ["category"],
      });

      expect(hits.length).toBeGreaterThanOrEqual(1);
      const doc = hits.find((h) => h.id === "doc-1");
      expect(doc).toBeDefined();
      expect(doc?.fields?.category).toBe("greeting");
    });

    it("updates an existing document", async () => {
      const vec = new Array(384).fill(0.2);

      // Upsert same id with different content
      await tpuf.upsert({
        id: "doc-1",
        index: testIndexId,
        fields: {
          content: "Updated content",
          vector: { kind: "vector", values: vec },
          category: "updated",
        },
      });

      // Verify via query
      const hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        include: ["category"],
      });

      const doc = hits.find((h) => h.id === "doc-1");
      expect(doc).toBeDefined();
      expect(doc?.fields?.category).toBe("updated");
    });
  });

  describe("mupsert", () => {
    it("inserts multiple documents", async () => {
      await tpuf.mupsert([
        {
          id: "doc-2",
          index: testIndexId,
          fields: {
            content: "Second document",
            vector: { kind: "vector", values: new Array(384).fill(0.3) },
            category: "test",
          },
        },
        {
          id: "doc-3",
          index: testIndexId,
          fields: {
            content: "Third document",
            vector: { kind: "vector", values: new Array(384).fill(0.4) },
            category: "test",
          },
        },
      ]);

      // Verify via query with filter
      const hits = await tpuf.query({
        index: testIndexId,
        vector: new Array(384).fill(0.3),
        topK: 10,
        filter: { field: "category", op: "eq", value: "test" },
        include: true,
      });

      expect(hits.length).toBeGreaterThanOrEqual(2);
      const ids = hits.map((h) => h.id);
      expect(ids).toContain("doc-2");
      expect(ids).toContain("doc-3");
    });

    it("handles empty array", async () => {
      // Should not throw
      await tpuf.mupsert([]);
    });
  });

  describe("query", () => {
    it("performs vector search", async () => {
      const hits = await tpuf.query({
        index: testIndexId,
        vector: new Array(384).fill(0.1),
        topK: 5,
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0]).toHaveProperty("id");
      expect(hits[0]).toHaveProperty("score");
      expect(hits[0]).toHaveProperty("index", testIndexId);
    });

    it("returns requested fields", async () => {
      const hits = await tpuf.query({
        index: testIndexId,
        vector: new Array(384).fill(0.1),
        topK: 5,
        include: ["content", "category"],
      });

      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].fields).toBeDefined();
      expect(hits[0].fields).toHaveProperty("content");
      expect(hits[0].fields).toHaveProperty("category");
    });

    it("filters results", async () => {
      const hits = await tpuf.query({
        index: testIndexId,
        vector: new Array(384).fill(0.3),
        topK: 10,
        filter: { field: "category", op: "eq", value: "test" },
        include: ["category"],
      });

      expect(hits.length).toBeGreaterThan(0);
      for (const hit of hits) {
        expect(hit.fields?.category).toBe("test");
      }
    });

    it("supports AND filters", async () => {
      const hits = await tpuf.query({
        index: testIndexId,
        vector: new Array(384).fill(0.3),
        topK: 10,
        filter: {
          and: [
            { field: "category", op: "eq", value: "test" },
            { field: "id", op: "in", value: ["doc-2", "doc-3"] },
          ],
        },
        include: ["category"],
      });

      expect(hits.length).toBeGreaterThanOrEqual(0);
      for (const hit of hits) {
        expect(hit.fields?.category).toBe("test");
      }
    });
  });

  describe("delete", () => {
    it("deletes a document by id", async () => {
      const vec = new Array(384).fill(0.5);

      // Insert a document to delete
      await tpuf.upsert({
        id: "doc-to-delete",
        index: testIndexId,
        fields: {
          content: "Delete me",
          vector: { kind: "vector", values: vec },
          category: "deletable",
        },
      });

      // Verify it exists
      let hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        filter: { field: "id", op: "eq", value: "doc-to-delete" },
      });
      expect(hits.some((h) => h.id === "doc-to-delete")).toBe(true);

      // Delete it
      await tpuf.delete({ id: "doc-to-delete", index: testIndexId });

      // Verify it's gone
      hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        filter: { field: "id", op: "eq", value: "doc-to-delete" },
      });
      expect(hits.some((h) => h.id === "doc-to-delete")).toBe(false);
    });
  });

  describe("mdelete", () => {
    it("deletes multiple documents by ids", async () => {
      const vec = new Array(384).fill(0.6);

      // Insert documents to delete
      await tpuf.mupsert([
        {
          id: "bulk-del-1",
          index: testIndexId,
          fields: {
            content: "Bulk delete 1",
            vector: { kind: "vector", values: vec },
            category: "bulk-delete",
          },
        },
        {
          id: "bulk-del-2",
          index: testIndexId,
          fields: {
            content: "Bulk delete 2",
            vector: { kind: "vector", values: vec },
            category: "bulk-delete",
          },
        },
      ]);

      // Verify they exist
      let hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        filter: { field: "category", op: "eq", value: "bulk-delete" },
      });
      expect(hits.length).toBeGreaterThanOrEqual(2);

      // Delete by ids
      await tpuf.mdelete({
        index: testIndexId,
        ids: ["bulk-del-1", "bulk-del-2"],
      });

      // Verify they're gone
      hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        filter: { field: "category", op: "eq", value: "bulk-delete" },
      });
      expect(hits.some((h) => h.id === "bulk-del-1")).toBe(false);
      expect(hits.some((h) => h.id === "bulk-del-2")).toBe(false);
    });

    it("deletes documents by filter", async () => {
      const vec = new Array(384).fill(0.7);

      // Insert documents to delete
      await tpuf.mupsert([
        {
          id: "filter-del-1",
          index: testIndexId,
          fields: {
            content: "Filter delete 1",
            vector: { kind: "vector", values: vec },
            category: "filter-delete",
          },
        },
        {
          id: "filter-del-2",
          index: testIndexId,
          fields: {
            content: "Filter delete 2",
            vector: { kind: "vector", values: vec },
            category: "filter-delete",
          },
        },
      ]);

      // Verify they exist
      let hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        filter: { field: "category", op: "eq", value: "filter-delete" },
      });
      expect(hits.length).toBeGreaterThanOrEqual(2);

      // Delete by filter
      await tpuf.mdelete({
        index: testIndexId,
        filter: { field: "category", op: "eq", value: "filter-delete" },
      });

      // Verify they're gone
      hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        filter: { field: "category", op: "eq", value: "filter-delete" },
      });
      expect(hits.length).toBe(0);
    });
  });

  describe("update", () => {
    it("updates a document field", async () => {
      const vec = new Array(384).fill(0.8);

      // Insert a document
      await tpuf.upsert({
        id: "doc-to-update",
        index: testIndexId,
        fields: {
          content: "Original content",
          vector: { kind: "vector", values: vec },
          category: "original",
        },
      });

      // Update just the category
      await tpuf.update({
        id: "doc-to-update",
        index: testIndexId,
        fields: {
          category: "updated",
        },
      });

      // Verify the update
      const hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        filter: { field: "id", op: "eq", value: "doc-to-update" },
        include: ["category", "content"],
      });

      const doc = hits.find((h) => h.id === "doc-to-update");
      expect(doc).toBeDefined();
      expect(doc?.fields?.category).toBe("updated");
      expect(doc?.fields?.content).toBe("Original content"); // unchanged
    });
  });

  describe("mupdate", () => {
    it("updates multiple documents", async () => {
      const vec = new Array(384).fill(0.9);

      // Insert documents
      await tpuf.mupsert([
        {
          id: "mup-1",
          index: testIndexId,
          fields: {
            content: "Doc 1",
            vector: { kind: "vector", values: vec },
            category: "before",
          },
        },
        {
          id: "mup-2",
          index: testIndexId,
          fields: {
            content: "Doc 2",
            vector: { kind: "vector", values: vec },
            category: "before",
          },
        },
      ]);

      // Update both
      await tpuf.mupdate([
        {
          id: "mup-1",
          index: testIndexId,
          fields: { category: "after" },
        },
        {
          id: "mup-2",
          index: testIndexId,
          fields: { category: "after" },
        },
      ]);

      // Verify updates
      const hits = await tpuf.query({
        index: testIndexId,
        vector: vec,
        topK: 10,
        filter: { field: "category", op: "eq", value: "after" },
        include: ["category"],
      });

      expect(hits.length).toBeGreaterThanOrEqual(2);
      expect(hits.some((h) => h.id === "mup-1")).toBe(true);
      expect(hits.some((h) => h.id === "mup-2")).toBe(true);
    });

    it("handles empty array", async () => {
      await tpuf.mupdate([]);
    });
  });
});
