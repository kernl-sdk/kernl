/**
 * Document operations integration tests for pgvector.
 *
 * Tests upsert, patch, and delete operations against real PostgreSQL.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";

import { PGSearchIndex } from "../../search";
import type { IndexHandle } from "@kernl-sdk/retrieval";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;
const SCHEMA = "kernl_document_integration_test";

/**
 * Test document type.
 */
interface TestDoc {
  id: string;
  title: string;
  content: string;
  views: number;
  published: boolean;
  embedding: number[];
}

describe.sequential("pgvector document operations integration tests", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
    return;
  }

  let pool: Pool;
  let pgvec: PGSearchIndex;
  let handle: IndexHandle<TestDoc>;
  const testIndexId = "document_test_docs";

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
        content: { type: "string" },
        views: { type: "int" },
        published: { type: "boolean" },
        embedding: { type: "vector", dimensions: 4, similarity: "cosine" },
      },
      providerOptions: { schema: SCHEMA },
    });

    handle = pgvec.index<TestDoc>(testIndexId);
  }, 30000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    // Clear table between tests
    await pool.query(`DELETE FROM "${SCHEMA}"."${testIndexId}"`);
  });

  // ============================================================
  // UPSERT OPERATIONS
  // ============================================================

  describe("upsert", () => {
    it("inserts a single document", async () => {
      const result = await handle.upsert({
        id: "doc-1",
        title: "Hello World",
        content: "First document",
        views: 100,
        published: true,
        embedding: [0.1, 0.2, 0.3, 0.4],
      });

      expect(result.count).toBe(1);
      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(0);

      // Verify document was inserted
      const hits = await handle.query({
        query: [{ embedding: [0.1, 0.2, 0.3, 0.4] }],
        limit: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].id).toBe("doc-1");
      expect(hits[0].document?.title).toBe("Hello World");
    });

    it("inserts multiple documents", async () => {
      const result = await handle.upsert([
        {
          id: "doc-1",
          title: "First",
          content: "Content 1",
          views: 10,
          published: true,
          embedding: [1, 0, 0, 0],
        },
        {
          id: "doc-2",
          title: "Second",
          content: "Content 2",
          views: 20,
          published: false,
          embedding: [0, 1, 0, 0],
        },
        {
          id: "doc-3",
          title: "Third",
          content: "Content 3",
          views: 30,
          published: true,
          embedding: [0, 0, 1, 0],
        },
      ]);

      expect(result.count).toBe(3);
      expect(result.inserted).toBe(3);
      expect(result.updated).toBe(0);
    });

    it("updates existing document on conflict", async () => {
      // Insert
      await handle.upsert({
        id: "doc-1",
        title: "Original Title",
        content: "Original content",
        views: 50,
        published: false,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      // Upsert (update)
      const result = await handle.upsert({
        id: "doc-1",
        title: "Updated Title",
        content: "Updated content",
        views: 100,
        published: true,
        embedding: [0.2, 0.2, 0.2, 0.2],
      });

      expect(result.count).toBe(1);
      expect(result.inserted).toBe(0);
      expect(result.updated).toBe(1);

      // Verify update
      const hits = await handle.query({
        filter: { id: "doc-1" },
        limit: 1,
      });

      expect(hits[0].document?.title).toBe("Updated Title");
      expect(hits[0].document?.views).toBe(100);
      expect(hits[0].document?.published).toBe(true);
    });

    it("handles mixed insert and update", async () => {
      // Insert first doc
      await handle.upsert({
        id: "doc-1",
        title: "Existing",
        content: "Content",
        views: 10,
        published: true,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      // Upsert batch with existing and new docs
      const result = await handle.upsert([
        {
          id: "doc-1",
          title: "Updated",
          content: "Updated content",
          views: 20,
          published: false,
          embedding: [0.2, 0.2, 0.2, 0.2],
        },
        {
          id: "doc-2",
          title: "New Doc",
          content: "New content",
          views: 30,
          published: true,
          embedding: [0.3, 0.3, 0.3, 0.3],
        },
      ]);

      expect(result.count).toBe(2);
      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(1);
    });

    it("handles empty array", async () => {
      const result = await handle.upsert([]);

      expect(result.count).toBe(0);
      expect(result.inserted).toBe(0);
      expect(result.updated).toBe(0);
    });

    it("throws on missing primary key", async () => {
      await expect(
        handle.upsert({
          title: "No ID",
          content: "Content",
          views: 0,
          published: false,
          embedding: [0, 0, 0, 0],
        } as any),
      ).rejects.toThrow();
    });

    it("handles large batch upsert", async () => {
      const docs = Array.from({ length: 100 }, (_, i) => ({
        id: `batch-doc-${i}`,
        title: `Document ${i}`,
        content: `Content for document ${i}`,
        views: i * 10,
        published: i % 2 === 0,
        embedding: [i / 100, (100 - i) / 100, 0.5, 0.5],
      }));

      const result = await handle.upsert(docs);

      expect(result.count).toBe(100);
      expect(result.inserted).toBe(100);

      // Verify count
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        limit: 1000,
      });

      expect(hits).toHaveLength(100);
    });

    it("preserves vector embeddings correctly", async () => {
      const embedding = [0.123456789, -0.987654321, 0.5, -0.5];

      await handle.upsert({
        id: "vec-test",
        title: "Vector Test",
        content: "Content",
        views: 0,
        published: true,
        embedding,
      });

      const hits = await handle.query({
        filter: { id: "vec-test" },
        limit: 1,
      });

      // Vector values should be preserved (within floating point precision)
      const stored = hits[0].document?.embedding;
      expect(stored).toHaveLength(4);
      expect(stored?.[0]).toBeCloseTo(0.123456789, 5);
      expect(stored?.[1]).toBeCloseTo(-0.987654321, 5);
    });

    it("handles null values in optional fields", async () => {
      // Create index with nullable field
      await pgvec.createIndex({
        id: "nullable_test",
        schema: {
          id: { type: "string", pk: true },
          title: { type: "string" },
          subtitle: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });

      const nullHandle = pgvec.index("nullable_test");

      await nullHandle.upsert({
        id: "doc-null",
        title: "Has Title",
        subtitle: null,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await nullHandle.query({
        filter: { id: "doc-null" },
        limit: 1,
      });

      expect(hits[0].document?.title).toBe("Has Title");
      expect(hits[0].document?.subtitle).toBeNull();
    });
  });

  // ============================================================
  // PATCH OPERATIONS
  // ============================================================

  describe("patch", () => {
    beforeEach(async () => {
      // Insert test documents
      await handle.upsert([
        {
          id: "patch-1",
          title: "Original Title 1",
          content: "Original Content 1",
          views: 100,
          published: true,
          embedding: [0.1, 0.1, 0.1, 0.1],
        },
        {
          id: "patch-2",
          title: "Original Title 2",
          content: "Original Content 2",
          views: 200,
          published: false,
          embedding: [0.2, 0.2, 0.2, 0.2],
        },
      ]);
    });

    it("patches single field", async () => {
      const result = await handle.patch({
        id: "patch-1",
        title: "Updated Title",
      });

      expect(result.count).toBe(1);

      const hits = await handle.query({
        filter: { id: "patch-1" },
        limit: 1,
      });

      expect(hits[0].document?.title).toBe("Updated Title");
      expect(hits[0].document?.content).toBe("Original Content 1"); // unchanged
      expect(hits[0].document?.views).toBe(100); // unchanged
    });

    it("patches multiple fields", async () => {
      const result = await handle.patch({
        id: "patch-1",
        title: "New Title",
        views: 999,
        published: false,
      });

      expect(result.count).toBe(1);

      const hits = await handle.query({
        filter: { id: "patch-1" },
        limit: 1,
      });

      expect(hits[0].document?.title).toBe("New Title");
      expect(hits[0].document?.views).toBe(999);
      expect(hits[0].document?.published).toBe(false);
      expect(hits[0].document?.content).toBe("Original Content 1"); // unchanged
    });

    it("patches vector embedding", async () => {
      const newEmbedding = [0.9, 0.9, 0.9, 0.9];

      await handle.patch({
        id: "patch-1",
        embedding: newEmbedding,
      });

      const hits = await handle.query({
        filter: { id: "patch-1" },
        limit: 1,
      });

      const stored = hits[0].document?.embedding;
      expect(stored?.[0]).toBeCloseTo(0.9, 5);
    });

    it("patches multiple documents", async () => {
      const result = await handle.patch([
        { id: "patch-1", views: 1000 },
        { id: "patch-2", views: 2000 },
      ]);

      expect(result.count).toBe(2);

      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        limit: 10,
      });

      const doc1 = hits.find((h) => h.id === "patch-1");
      const doc2 = hits.find((h) => h.id === "patch-2");

      expect(doc1?.document?.views).toBe(1000);
      expect(doc2?.document?.views).toBe(2000);
    });

    it("sets field to null", async () => {
      // First, create an index with nullable field and insert
      await pgvec.createIndex({
        id: "patch_null_test",
        schema: {
          id: { type: "string", pk: true },
          title: { type: "string" },
          subtitle: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });

      const nullHandle = pgvec.index("patch_null_test");

      await nullHandle.upsert({
        id: "doc-1",
        title: "Title",
        subtitle: "Has Subtitle",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      await nullHandle.patch({
        id: "doc-1",
        subtitle: null,
      });

      const hits = await nullHandle.query({
        filter: { id: "doc-1" },
        limit: 1,
      });

      expect(hits[0].document?.subtitle).toBeNull();
    });

    it("handles empty patch array", async () => {
      const result = await handle.patch([]);
      expect(result.count).toBe(0);
    });

    it("returns count 0 for non-existent document", async () => {
      const result = await handle.patch({
        id: "nonexistent",
        title: "Won't Work",
      });

      expect(result.count).toBe(0);
    });

    it("ignores undefined fields", async () => {
      await handle.patch({
        id: "patch-1",
        title: "Updated",
        content: undefined,
      } as any);

      const hits = await handle.query({
        filter: { id: "patch-1" },
        limit: 1,
      });

      expect(hits[0].document?.title).toBe("Updated");
      expect(hits[0].document?.content).toBe("Original Content 1"); // unchanged
    });

    it("skips patch with no fields to update", async () => {
      const result = await handle.patch({
        id: "patch-1",
      });

      // No fields to update, so count should be 0
      expect(result.count).toBe(0);
    });
  });

  // ============================================================
  // DELETE OPERATIONS
  // ============================================================

  describe("delete", () => {
    beforeEach(async () => {
      // Insert test documents
      await handle.upsert([
        {
          id: "del-1",
          title: "Delete Me 1",
          content: "Content",
          views: 10,
          published: true,
          embedding: [0.1, 0.1, 0.1, 0.1],
        },
        {
          id: "del-2",
          title: "Delete Me 2",
          content: "Content",
          views: 20,
          published: false,
          embedding: [0.2, 0.2, 0.2, 0.2],
        },
        {
          id: "del-3",
          title: "Delete Me 3",
          content: "Content",
          views: 30,
          published: true,
          embedding: [0.3, 0.3, 0.3, 0.3],
        },
      ]);
    });

    it("deletes single document by id", async () => {
      const result = await handle.delete("del-1");

      expect(result.count).toBe(1);

      // Verify deletion
      const hits = await handle.query({
        filter: { id: "del-1" },
        limit: 1,
      });

      expect(hits).toHaveLength(0);
    });

    it("deletes multiple documents by id array", async () => {
      const result = await handle.delete(["del-1", "del-2"]);

      expect(result.count).toBe(2);

      // Verify only del-3 remains
      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        limit: 10,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].id).toBe("del-3");
    });

    it("returns count 0 for non-existent id", async () => {
      const result = await handle.delete("nonexistent");
      expect(result.count).toBe(0);
    });

    it("handles mixed existing and non-existent ids", async () => {
      const result = await handle.delete(["del-1", "nonexistent", "del-2"]);

      // Should only count the ones that existed
      expect(result.count).toBe(2);
    });

    it("handles empty array", async () => {
      const result = await handle.delete([]);
      expect(result.count).toBe(0);
    });

    it("deletes all documents", async () => {
      await handle.delete(["del-1", "del-2", "del-3"]);

      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        limit: 10,
      });

      expect(hits).toHaveLength(0);
    });
  });

  // ============================================================
  // DATA TYPE HANDLING
  // ============================================================

  describe("data type handling", () => {
    it("handles integer zero correctly", async () => {
      await handle.upsert({
        id: "zero-test",
        title: "Zero Views",
        content: "Content",
        views: 0,
        published: false,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { views: 0 },
        limit: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.views).toBe(0);
    });

    it("handles negative integers", async () => {
      await handle.upsert({
        id: "negative-test",
        title: "Negative Views",
        content: "Content",
        views: -50,
        published: false,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { views: -50 },
        limit: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.views).toBe(-50);
    });

    it("handles boolean true and false", async () => {
      await handle.upsert([
        {
          id: "bool-true",
          title: "Published",
          content: "Content",
          views: 0,
          published: true,
          embedding: [0.1, 0.1, 0.1, 0.1],
        },
        {
          id: "bool-false",
          title: "Draft",
          content: "Content",
          views: 0,
          published: false,
          embedding: [0.2, 0.2, 0.2, 0.2],
        },
      ]);

      const trueHits = await handle.query({
        filter: { published: true },
        limit: 10,
      });

      const falseHits = await handle.query({
        filter: { published: false },
        limit: 10,
      });

      expect(trueHits).toHaveLength(1);
      expect(trueHits[0].id).toBe("bool-true");
      expect(falseHits).toHaveLength(1);
      expect(falseHits[0].id).toBe("bool-false");
    });

    it("handles empty string", async () => {
      await handle.upsert({
        id: "empty-string",
        title: "",
        content: "Has content",
        views: 0,
        published: false,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { title: "" },
        limit: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.title).toBe("");
    });

    it("handles unicode strings", async () => {
      await handle.upsert({
        id: "unicode-test",
        title: "Hello 世界 🌍",
        content: "Привет мир",
        views: 0,
        published: false,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "unicode-test" },
        limit: 1,
      });

      expect(hits[0].document?.title).toBe("Hello 世界 🌍");
      expect(hits[0].document?.content).toBe("Привет мир");
    });

    it("handles very long strings", async () => {
      const longString = "a".repeat(10000);

      await handle.upsert({
        id: "long-string",
        title: "Short",
        content: longString,
        views: 0,
        published: false,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "long-string" },
        limit: 1,
      });

      expect(hits[0].document?.content).toBe(longString);
    });
  });
});
