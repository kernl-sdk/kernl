/**
 * Edge case integration tests for pgvector.
 *
 * Tests boundary conditions, error handling, special values,
 * and security considerations.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";

import { PGSearchIndex } from "../../search";
import type { IndexHandle } from "@kernl-sdk/retrieval";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;
const SCHEMA = "kernl_edge_integration_test";

describe.sequential("pgvector edge cases integration tests", () => {
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
  // SPECIAL STRING VALUES
  // ============================================================

  describe("special string values", () => {
    let handle: IndexHandle<any>;

    beforeAll(async () => {
      await pgvec.createIndex({
        id: "string_edge",
        schema: {
          id: { type: "string", pk: true },
          title: { type: "string" },
          content: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });
      handle = pgvec.index("string_edge");
    });

    beforeEach(async () => {
      await pool.query(`DELETE FROM "${SCHEMA}"."string_edge"`);
    });

    it("handles SQL injection attempt in value", async () => {
      await handle.upsert({
        id: "injection-1",
        title: "'; DROP TABLE string_edge; --",
        content: "Content",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      // Table should still exist and be queryable
      const hits = await handle.query({
        filter: { id: "injection-1" },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.title).toBe("'; DROP TABLE string_edge; --");
    });

    it("handles SQL injection attempt in filter", async () => {
      await handle.upsert({
        id: "safe-doc",
        title: "Safe Title",
        content: "Content",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { title: "'; DROP TABLE string_edge; --" },
        topK: 10,
      });

      // Should return no results, not crash
      expect(hits).toHaveLength(0);
    });

    it("handles quotes in strings", async () => {
      await handle.upsert({
        id: "quotes",
        title: 'He said "Hello"',
        content: "It's a test",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "quotes" },
        topK: 1,
      });

      expect(hits[0].document?.title).toBe('He said "Hello"');
      expect(hits[0].document?.content).toBe("It's a test");
    });

    it("handles backslashes", async () => {
      await handle.upsert({
        id: "backslash",
        title: "Path\\to\\file",
        content: "C:\\Windows\\System32",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "backslash" },
        topK: 1,
      });

      expect(hits[0].document?.title).toBe("Path\\to\\file");
    });

    it("handles newlines and tabs", async () => {
      await handle.upsert({
        id: "whitespace",
        title: "Line1\nLine2",
        content: "Col1\tCol2\tCol3",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "whitespace" },
        topK: 1,
      });

      expect(hits[0].document?.title).toBe("Line1\nLine2");
      expect(hits[0].document?.content).toBe("Col1\tCol2\tCol3");
    });

    it("handles null byte attempt", async () => {
      // Postgres doesn't allow null bytes in text
      await expect(
        handle.upsert({
          id: "nullbyte",
          title: "Has\x00null",
          content: "Content",
          embedding: [0.1, 0.1, 0.1, 0.1],
        }),
      ).rejects.toThrow();
    });

    it("handles unicode edge cases", async () => {
      await handle.upsert({
        id: "unicode-edge",
        title: "\u0000\u0001\uFFFF", // Postgres will reject null byte
        content: "Normal",
        embedding: [0.1, 0.1, 0.1, 0.1],
      }).catch(() => {
        // Expected to fail with null byte
      });

      // Test without null byte
      await handle.upsert({
        id: "unicode-edge-2",
        title: "\u0001\uFFFE\uFFFF",
        content: "Unicode test",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "unicode-edge-2" },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
    });

    it("handles very long strings", async () => {
      const longString = "x".repeat(100000);

      await handle.upsert({
        id: "long",
        title: longString,
        content: "Short",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "long" },
        topK: 1,
      });

      expect(hits[0].document?.title).toHaveLength(100000);
    });

    it("handles LIKE pattern characters in $contains", async () => {
      await handle.upsert({
        id: "pattern-chars",
        title: "100% match_test",
        content: "Content",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      // Should not interpret % and _ as wildcards
      const hits = await handle.query({
        filter: { title: { $contains: "100%" } },
        topK: 10,
      });

      expect(hits).toHaveLength(1);
    });
  });

  // ============================================================
  // NUMERIC EDGE CASES
  // ============================================================

  describe("numeric edge cases", () => {
    let handle: IndexHandle<any>;

    beforeAll(async () => {
      await pgvec.createIndex({
        id: "numeric_edge",
        schema: {
          id: { type: "string", pk: true },
          int_val: { type: "int" },
          float_val: { type: "float" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });
      handle = pgvec.index("numeric_edge");
    });

    beforeEach(async () => {
      await pool.query(`DELETE FROM "${SCHEMA}"."numeric_edge"`);
    });

    it("handles integer zero", async () => {
      await handle.upsert({
        id: "zero",
        int_val: 0,
        float_val: 0.0,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { int_val: 0 },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.int_val).toBe(0);
    });

    it("handles negative numbers", async () => {
      await handle.upsert({
        id: "negative",
        int_val: -999,
        float_val: -123.456,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { int_val: { $lt: 0 } },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.int_val).toBe(-999);
    });

    it("handles large integers", async () => {
      // PostgreSQL integer max is 2147483647
      await handle.upsert({
        id: "large-int",
        int_val: 2147483647,
        float_val: 0,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { int_val: 2147483647 },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.int_val).toBe(2147483647);
    });

    it("handles float precision", async () => {
      await handle.upsert({
        id: "precise",
        int_val: 0,
        float_val: 0.123456789012345,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "precise" },
        topK: 1,
      });

      // Double precision maintains about 15 significant digits
      expect(hits[0].document?.float_val).toBeCloseTo(0.123456789012345, 10);
    });

    it("handles special float values", async () => {
      // Infinity and NaN are not valid JSON, so they shouldn't be used
      // But very small and very large floats should work
      await handle.upsert({
        id: "extreme-float",
        int_val: 0,
        float_val: 1e308, // Near max double
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "extreme-float" },
        topK: 1,
      });

      expect(hits[0].document?.float_val).toBe(1e308);
    });
  });

  // ============================================================
  // VECTOR EDGE CASES
  // ============================================================

  describe("vector edge cases", () => {
    let handle: IndexHandle<any>;

    beforeAll(async () => {
      await pgvec.createIndex({
        id: "vector_edge",
        schema: {
          id: { type: "string", pk: true },
          embedding: { type: "vector", dimensions: 4, similarity: "cosine" },
        },
        providerOptions: { schema: SCHEMA },
      });
      handle = pgvec.index("vector_edge");
    });

    beforeEach(async () => {
      await pool.query(`DELETE FROM "${SCHEMA}"."vector_edge"`);
    });

    it("handles zero vector", async () => {
      await handle.upsert({
        id: "zero-vec",
        embedding: [0, 0, 0, 0],
      });

      // Querying with zero vector - cosine similarity undefined
      // pgvector returns NaN for cosine of zero vectors
      const hits = await handle.query({
        filter: { id: "zero-vec" },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
    });

    it("handles negative vector components", async () => {
      await handle.upsert({
        id: "negative-vec",
        embedding: [-1, -0.5, 0.5, 1],
      });

      const hits = await handle.query({
        query: [{ embedding: [-1, -0.5, 0.5, 1] }],
        topK: 1,
      });

      expect(hits[0].id).toBe("negative-vec");
      expect(hits[0].score).toBeGreaterThan(0.99);
    });

    it("handles very small vector components", async () => {
      await handle.upsert({
        id: "small-vec",
        embedding: [1e-10, 1e-10, 1e-10, 1e-10],
      });

      const hits = await handle.query({
        filter: { id: "small-vec" },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
    });

    it("handles very large vector components", async () => {
      await handle.upsert({
        id: "large-vec",
        embedding: [1e10, 1e10, 1e10, 1e10],
      });

      const hits = await handle.query({
        query: [{ embedding: [1e10, 1e10, 1e10, 1e10] }],
        topK: 1,
      });

      expect(hits[0].id).toBe("large-vec");
    });

    it("rejects wrong dimension vector", async () => {
      await expect(
        handle.upsert({
          id: "wrong-dim",
          embedding: [1, 2, 3], // 3 dimensions instead of 4
        }),
      ).rejects.toThrow();
    });

    it("handles high-dimensional vectors (1536)", async () => {
      await pgvec.createIndex({
        id: "high_dim_edge",
        schema: {
          id: { type: "string", pk: true },
          embedding: { type: "vector", dimensions: 1536 },
        },
        providerOptions: { schema: SCHEMA },
      });

      const highHandle = pgvec.index("high_dim_edge");
      const vec = new Array(1536).fill(0).map((_, i) => Math.sin(i));

      await highHandle.upsert({ id: "high-1", embedding: vec });

      const hits = await highHandle.query({
        query: [{ embedding: vec }],
        topK: 1,
      });

      expect(hits[0].id).toBe("high-1");
      expect(hits[0].score).toBeGreaterThan(0.99);
    });
  });

  // ============================================================
  // NULL HANDLING
  // ============================================================

  describe("null handling", () => {
    let handle: IndexHandle<any>;

    beforeAll(async () => {
      await pgvec.createIndex({
        id: "null_edge",
        schema: {
          id: { type: "string", pk: true },
          required_field: { type: "string" },
          optional_field: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });
      handle = pgvec.index("null_edge");
    });

    beforeEach(async () => {
      await pool.query(`DELETE FROM "${SCHEMA}"."null_edge"`);
    });

    it("stores null in optional field", async () => {
      await handle.upsert({
        id: "null-test",
        required_field: "present",
        optional_field: null,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { optional_field: null },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0].document?.optional_field).toBeNull();
    });

    it("$exists works with null values", async () => {
      await handle.upsert([
        {
          id: "has-value",
          required_field: "yes",
          optional_field: "present",
          embedding: [0.1, 0.1, 0.1, 0.1],
        },
        {
          id: "has-null",
          required_field: "yes",
          optional_field: null,
          embedding: [0.2, 0.2, 0.2, 0.2],
        },
      ]);

      const existsTrue = await handle.query({
        filter: { optional_field: { $exists: true } },
        topK: 10,
      });

      const existsFalse = await handle.query({
        filter: { optional_field: { $exists: false } },
        topK: 10,
      });

      expect(existsTrue).toHaveLength(1);
      expect(existsTrue[0].id).toBe("has-value");

      expect(existsFalse).toHaveLength(1);
      expect(existsFalse[0].id).toBe("has-null");
    });

    it("patches field to null", async () => {
      await handle.upsert({
        id: "patch-null",
        required_field: "yes",
        optional_field: "will be nulled",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      await handle.patch({
        id: "patch-null",
        optional_field: null,
      });

      const hits = await handle.query({
        filter: { id: "patch-null" },
        topK: 1,
      });

      expect(hits[0].document?.optional_field).toBeNull();
    });
  });

  // ============================================================
  // ID EDGE CASES
  // ============================================================

  describe("id edge cases", () => {
    let handle: IndexHandle<any>;

    beforeAll(async () => {
      await pgvec.createIndex({
        id: "id_edge",
        schema: {
          id: { type: "string", pk: true },
          name: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });
      handle = pgvec.index("id_edge");
    });

    beforeEach(async () => {
      await pool.query(`DELETE FROM "${SCHEMA}"."id_edge"`);
    });

    it("handles UUID-style ids", async () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";

      await handle.upsert({
        id: uuid,
        name: "UUID Doc",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: uuid },
        topK: 1,
      });

      expect(hits[0].id).toBe(uuid);
    });

    it("handles very long ids", async () => {
      const longId = "x".repeat(255);

      await handle.upsert({
        id: longId,
        name: "Long ID Doc",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: longId },
        topK: 1,
      });

      expect(hits[0].id).toBe(longId);
    });

    it("handles ids with special characters", async () => {
      const specialId = "doc/with:special@chars#and?query=params";

      await handle.upsert({
        id: specialId,
        name: "Special ID Doc",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: specialId },
        topK: 1,
      });

      expect(hits[0].id).toBe(specialId);
    });

    it("handles numeric string ids", async () => {
      await handle.upsert({
        id: "12345",
        name: "Numeric ID",
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      const hits = await handle.query({
        filter: { id: "12345" },
        topK: 1,
      });

      expect(hits[0].id).toBe("12345");
    });
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  describe("error handling", () => {
    it("throws on non-existent table query", async () => {
      const badHandle = pgvec.index("nonexistent_table");

      await expect(
        badHandle.query({
          query: [{ embedding: [0.1, 0.1, 0.1, 0.1] }],
          topK: 10,
        }),
      ).rejects.toThrow();
    });

    it("throws on non-existent column in filter", async () => {
      await pgvec.createIndex({
        id: "error_test",
        schema: {
          id: { type: "string", pk: true },
          name: { type: "string" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });

      const handle = pgvec.index("error_test");

      await expect(
        handle.query({
          filter: { nonexistent_column: "value" } as any,
          topK: 10,
        }),
      ).rejects.toThrow();
    });

    it("throws on deleteIndex for non-bound index", async () => {
      await expect(pgvec.deleteIndex("not_bound")).rejects.toThrow(
        'Index "not_bound" not bound',
      );
    });

    it("throws on describeIndex for non-bound index", async () => {
      await expect(pgvec.describeIndex("not_bound")).rejects.toThrow(
        'Index "not_bound" not bound',
      );
    });

    it("throws on createIndex without primary key", async () => {
      await expect(
        pgvec.createIndex({
          id: "no_pk",
          schema: {
            name: { type: "string" },
            embedding: { type: "vector", dimensions: 4 },
          },
          providerOptions: { schema: SCHEMA },
        }),
      ).rejects.toThrow("schema must have a field with pk: true");
    });
  });

  // ============================================================
  // CONCURRENT OPERATIONS
  // ============================================================

  describe("concurrent operations", () => {
    let handle: IndexHandle<any>;

    beforeAll(async () => {
      await pgvec.createIndex({
        id: "concurrent_test",
        schema: {
          id: { type: "string", pk: true },
          counter: { type: "int" },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: SCHEMA },
      });
      handle = pgvec.index("concurrent_test");
    });

    beforeEach(async () => {
      await pool.query(`DELETE FROM "${SCHEMA}"."concurrent_test"`);
    });

    it("handles concurrent upserts to same document", async () => {
      // Insert initial doc
      await handle.upsert({
        id: "concurrent-1",
        counter: 0,
        embedding: [0.1, 0.1, 0.1, 0.1],
      });

      // Concurrent updates
      const updates = Array.from({ length: 10 }, (_, i) =>
        handle.upsert({
          id: "concurrent-1",
          counter: i + 1,
          embedding: [0.1, 0.1, 0.1, 0.1],
        }),
      );

      await Promise.all(updates);

      // Should have completed without errors
      const hits = await handle.query({
        filter: { id: "concurrent-1" },
        topK: 1,
      });

      expect(hits).toHaveLength(1);
      // Counter should be one of the values
      expect(hits[0].document?.counter).toBeGreaterThanOrEqual(1);
      expect(hits[0].document?.counter).toBeLessThanOrEqual(10);
    });

    it("handles concurrent upserts to different documents", async () => {
      const upserts = Array.from({ length: 50 }, (_, i) =>
        handle.upsert({
          id: `parallel-${i}`,
          counter: i,
          embedding: [i / 50, (50 - i) / 50, 0.5, 0.5],
        }),
      );

      await Promise.all(upserts);

      // Increase ef_search to allow HNSW to explore more candidates
      // Default is 40, which limits results to ~40 even with topK=100
      await pool.query("SET hnsw.ef_search = 200");

      const hits = await handle.query({
        query: [{ embedding: [0.5, 0.5, 0.5, 0.5] }],
        topK: 100,
      });

      expect(hits).toHaveLength(50);
    });

    it("handles query during upsert", async () => {
      // Start upserting
      const upsertPromise = handle.upsert(
        Array.from({ length: 100 }, (_, i) => ({
          id: `during-${i}`,
          counter: i,
          embedding: [0.1, 0.1, 0.1, 0.1],
        })),
      );

      // Query while upserting
      const queryPromise = handle.query({
        query: [{ embedding: [0.1, 0.1, 0.1, 0.1] }],
        topK: 1000,
      });

      const [, hits] = await Promise.all([upsertPromise, queryPromise]);

      // Query should succeed (may see partial or full results)
      expect(hits).toBeDefined();
    });
  });

  // ============================================================
  // SCHEMA NAME EDGE CASES
  // ============================================================

  describe("schema name handling", () => {
    it("creates index in custom schema", async () => {
      await pool.query(`CREATE SCHEMA IF NOT EXISTS "custom_schema"`);

      await pgvec.createIndex({
        id: "custom_schema_test",
        schema: {
          id: { type: "string", pk: true },
          embedding: { type: "vector", dimensions: 4 },
        },
        providerOptions: { schema: "custom_schema" },
      });

      // Verify table is in correct schema
      const result = await pool.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'custom_schema' AND table_name = 'custom_schema_test'`,
      );

      expect(result.rows).toHaveLength(1);

      await pgvec.deleteIndex("custom_schema_test");
      await pool.query(`DROP SCHEMA IF EXISTS "custom_schema" CASCADE`);
    });
  });
});
