/**
 * Comprehensive filter integration tests for pgvector.
 *
 * Tests all filter operators against real PostgreSQL with a
 * deterministic dataset.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";

import { PGSearchIndex } from "../../search";
import type { IndexHandle, Filter } from "@kernl-sdk/retrieval";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;
const SCHEMA = "kernl_filter_integration_test";

/**
 * Test document type.
 */
interface TestDoc {
  id: string;
  num: number;
  flag: boolean;
  status: string;
  name: string;
  optionalField?: string | null;
  embedding: number[];
}

/**
 * Deterministic test dataset.
 *
 * 10 documents with varied field values for comprehensive filter testing.
 */
const TEST_DOCS: TestDoc[] = [
  {
    id: "doc-01",
    num: 10,
    flag: true,
    status: "active",
    name: "alice_smith",
    optionalField: "present",
    embedding: [0.1, 0.0, 0.0, 0.0],
  },
  {
    id: "doc-02",
    num: 20,
    flag: false,
    status: "active",
    name: "bob_jones",
    optionalField: null,
    embedding: [0.0, 0.1, 0.0, 0.0],
  },
  {
    id: "doc-03",
    num: 30,
    flag: true,
    status: "pending",
    name: "charlie_smith",
    optionalField: "also_present",
    embedding: [0.0, 0.0, 0.1, 0.0],
  },
  {
    id: "doc-04",
    num: 40,
    flag: false,
    status: "pending",
    name: "diana_brown",
    optionalField: null,
    embedding: [0.0, 0.0, 0.0, 0.1],
  },
  {
    id: "doc-05",
    num: 50,
    flag: true,
    status: "deleted",
    name: "eve_johnson",
    optionalField: "value",
    embedding: [0.1, 0.1, 0.0, 0.0],
  },
  {
    id: "doc-06",
    num: 0,
    flag: false,
    status: "active",
    name: "frank_miller",
    optionalField: null,
    embedding: [0.0, 0.1, 0.1, 0.0],
  },
  {
    id: "doc-07",
    num: -10,
    flag: true,
    status: "active",
    name: "grace_wilson",
    optionalField: "exists",
    embedding: [0.0, 0.0, 0.1, 0.1],
  },
  {
    id: "doc-08",
    num: 100,
    flag: false,
    status: "deleted",
    name: "henry_davis",
    optionalField: null,
    embedding: [0.1, 0.0, 0.1, 0.0],
  },
  {
    id: "doc-09",
    num: 25,
    flag: true,
    status: "pending",
    name: "ivy_taylor",
    optionalField: "set",
    embedding: [0.0, 0.1, 0.0, 0.1],
  },
  {
    id: "doc-10",
    num: 35,
    flag: false,
    status: "active",
    name: "jack_anderson",
    optionalField: null,
    embedding: [0.1, 0.0, 0.0, 0.1],
  },
];

// Standard query vector for all filter tests
const QUERY_VECTOR = [0.1, 0.1, 0.1, 0.1];

describe.sequential("pgvector filter integration tests", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
    return;
  }

  let pool: Pool;
  let pgvec: PGSearchIndex;
  let handle: IndexHandle<TestDoc>;
  const testIndexId = "filter_test_docs";

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });

    // Ensure pgvector extension exists
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Clean slate
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${SCHEMA}"`);

    pgvec = new PGSearchIndex({ pool });

    // Create index with schema
    await pgvec.createIndex({
      id: testIndexId,
      schema: {
        id: { type: "string", pk: true },
        num: { type: "int" },
        flag: { type: "boolean" },
        status: { type: "string" },
        name: { type: "string" },
        optionalField: { type: "string" },
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

  /**
   * Helper to query and return sorted IDs.
   */
  async function queryIds(filter: Filter): Promise<string[]> {
    const hits = await handle.query({
      query: [{ embedding: QUERY_VECTOR }],
      limit: 100,
      filter,
    });
    return hits.map((h) => h.id).sort();
  }

  // ============================================================
  // EQUALITY OPERATORS
  // ============================================================

  describe("equality operators", () => {
    it("$eq on string field (shorthand)", async () => {
      const ids = await queryIds({ status: "active" });
      expect(ids).toEqual(["doc-01", "doc-02", "doc-06", "doc-07", "doc-10"]);
    });

    it("$eq on string field (explicit)", async () => {
      const ids = await queryIds({ status: { $eq: "active" } });
      expect(ids).toEqual(["doc-01", "doc-02", "doc-06", "doc-07", "doc-10"]);
    });

    it("$eq on number field", async () => {
      const ids = await queryIds({ num: 30 });
      expect(ids).toEqual(["doc-03"]);
    });

    it("$eq on boolean true", async () => {
      const ids = await queryIds({ flag: true });
      expect(ids).toEqual(["doc-01", "doc-03", "doc-05", "doc-07", "doc-09"]);
    });

    it("$eq on boolean false", async () => {
      const ids = await queryIds({ flag: false });
      expect(ids).toEqual(["doc-02", "doc-04", "doc-06", "doc-08", "doc-10"]);
    });

    it("$eq on zero", async () => {
      const ids = await queryIds({ num: 0 });
      expect(ids).toEqual(["doc-06"]);
    });

    it("$eq on negative number", async () => {
      const ids = await queryIds({ num: -10 });
      expect(ids).toEqual(["doc-07"]);
    });

    it("$neq on string field", async () => {
      const ids = await queryIds({ status: { $neq: "active" } });
      expect(ids).toEqual(["doc-03", "doc-04", "doc-05", "doc-08", "doc-09"]);
    });

    it("$neq on boolean", async () => {
      const ids = await queryIds({ flag: { $neq: true } });
      expect(ids).toEqual(["doc-02", "doc-04", "doc-06", "doc-08", "doc-10"]);
    });

    it("$neq on number", async () => {
      const ids = await queryIds({ num: { $neq: 10 } });
      // All except doc-01
      expect(ids).toEqual([
        "doc-02",
        "doc-03",
        "doc-04",
        "doc-05",
        "doc-06",
        "doc-07",
        "doc-08",
        "doc-09",
        "doc-10",
      ]);
    });
  });

  // ============================================================
  // COMPARISON OPERATORS
  // ============================================================

  describe("comparison operators", () => {
    it("$gt on number", async () => {
      const ids = await queryIds({ num: { $gt: 30 } });
      expect(ids).toEqual(["doc-04", "doc-05", "doc-08", "doc-10"]);
    });

    it("$gte on number", async () => {
      const ids = await queryIds({ num: { $gte: 30 } });
      expect(ids).toEqual(["doc-03", "doc-04", "doc-05", "doc-08", "doc-10"]);
    });

    it("$lt on number", async () => {
      const ids = await queryIds({ num: { $lt: 20 } });
      expect(ids).toEqual(["doc-01", "doc-06", "doc-07"]);
    });

    it("$lte on number", async () => {
      const ids = await queryIds({ num: { $lte: 20 } });
      expect(ids).toEqual(["doc-01", "doc-02", "doc-06", "doc-07"]);
    });

    it("$gt with negative number", async () => {
      const ids = await queryIds({ num: { $gt: -10 } });
      expect(ids).toEqual([
        "doc-01",
        "doc-02",
        "doc-03",
        "doc-04",
        "doc-05",
        "doc-06",
        "doc-08",
        "doc-09",
        "doc-10",
      ]);
    });

    it("$lt with zero", async () => {
      const ids = await queryIds({ num: { $lt: 0 } });
      expect(ids).toEqual(["doc-07"]);
    });

    it("$lte with zero includes zero", async () => {
      const ids = await queryIds({ num: { $lte: 0 } });
      expect(ids).toEqual(["doc-06", "doc-07"]);
    });

    it("$gte with zero includes zero", async () => {
      const ids = await queryIds({ num: { $gte: 0 } });
      expect(ids).toEqual([
        "doc-01",
        "doc-02",
        "doc-03",
        "doc-04",
        "doc-05",
        "doc-06",
        "doc-08",
        "doc-09",
        "doc-10",
      ]);
    });

    it("range filter (gt + lt)", async () => {
      const ids = await queryIds({ num: { $gt: 20, $lt: 40 } });
      expect(ids).toEqual(["doc-03", "doc-09", "doc-10"]);
    });

    it("inclusive range (gte + lte)", async () => {
      const ids = await queryIds({ num: { $gte: 20, $lte: 40 } });
      expect(ids).toEqual(["doc-02", "doc-03", "doc-04", "doc-09", "doc-10"]);
    });

    it("empty range returns no results", async () => {
      const ids = await queryIds({ num: { $gt: 100, $lt: 50 } });
      expect(ids).toEqual([]);
    });

    it("single value range (gte = lte)", async () => {
      const ids = await queryIds({ num: { $gte: 30, $lte: 30 } });
      expect(ids).toEqual(["doc-03"]);
    });
  });

  // ============================================================
  // SET MEMBERSHIP OPERATORS
  // ============================================================

  describe("set membership operators", () => {
    it("$in with string values", async () => {
      const ids = await queryIds({ status: { $in: ["active", "pending"] } });
      expect(ids).toEqual([
        "doc-01",
        "doc-02",
        "doc-03",
        "doc-04",
        "doc-06",
        "doc-07",
        "doc-09",
        "doc-10",
      ]);
    });

    it("$in with single value", async () => {
      const ids = await queryIds({ status: { $in: ["deleted"] } });
      expect(ids).toEqual(["doc-05", "doc-08"]);
    });

    it("$in with number values", async () => {
      const ids = await queryIds({ num: { $in: [10, 20, 30] } });
      expect(ids).toEqual(["doc-01", "doc-02", "doc-03"]);
    });

    it("$in with empty array returns no results", async () => {
      const ids = await queryIds({ status: { $in: [] } });
      expect(ids).toEqual([]);
    });

    it("$in with non-matching values returns no results", async () => {
      const ids = await queryIds({ status: { $in: ["nonexistent"] } });
      expect(ids).toEqual([]);
    });

    it("$nin with string values", async () => {
      const ids = await queryIds({ status: { $nin: ["deleted"] } });
      expect(ids).toEqual([
        "doc-01",
        "doc-02",
        "doc-03",
        "doc-04",
        "doc-06",
        "doc-07",
        "doc-09",
        "doc-10",
      ]);
    });

    it("$nin excludes multiple values", async () => {
      const ids = await queryIds({ status: { $nin: ["active", "deleted"] } });
      expect(ids).toEqual(["doc-03", "doc-04", "doc-09"]);
    });

    it("$nin with empty array returns all results", async () => {
      const ids = await queryIds({ status: { $nin: [] } });
      expect(ids).toHaveLength(10);
    });

    it("$nin with all values returns no results", async () => {
      const ids = await queryIds({
        status: { $nin: ["active", "pending", "deleted"] },
      });
      expect(ids).toEqual([]);
    });
  });

  // ============================================================
  // STRING PATTERN OPERATORS
  // ============================================================

  describe("string pattern operators", () => {
    it("$contains matches substring", async () => {
      const ids = await queryIds({ name: { $contains: "smith" } });
      expect(ids).toEqual(["doc-01", "doc-03"]); // alice_smith, charlie_smith
    });

    it("$contains is case-insensitive", async () => {
      const ids = await queryIds({ name: { $contains: "SMITH" } });
      expect(ids).toEqual(["doc-01", "doc-03"]);
    });

    it("$contains with no matches returns empty", async () => {
      const ids = await queryIds({ name: { $contains: "xyz" } });
      expect(ids).toEqual([]);
    });

    it("$startsWith matches prefix", async () => {
      const ids = await queryIds({ name: { $startsWith: "alice" } });
      expect(ids).toEqual(["doc-01"]);
    });

    it("$startsWith is case-insensitive", async () => {
      const ids = await queryIds({ name: { $startsWith: "ALICE" } });
      expect(ids).toEqual(["doc-01"]);
    });

    it("$startsWith with common prefix", async () => {
      const ids = await queryIds({ name: { $startsWith: "j" } });
      expect(ids).toEqual(["doc-10"]); // jack_anderson
    });

    it("$endsWith matches suffix", async () => {
      const ids = await queryIds({ name: { $endsWith: "_smith" } });
      expect(ids).toEqual(["doc-01", "doc-03"]); // alice_smith, charlie_smith
    });

    it("$endsWith is case-insensitive", async () => {
      const ids = await queryIds({ name: { $endsWith: "_SMITH" } });
      expect(ids).toEqual(["doc-01", "doc-03"]);
    });

    it("$endsWith with different suffix", async () => {
      const ids = await queryIds({ name: { $endsWith: "_jones" } });
      expect(ids).toEqual(["doc-02"]); // bob_jones
    });
  });

  // ============================================================
  // EXISTENCE OPERATORS
  // ============================================================

  describe("existence operators", () => {
    it("$exists: true finds docs with non-null field", async () => {
      const ids = await queryIds({ optionalField: { $exists: true } });
      // docs with optionalField set to a string value (not null)
      expect(ids).toEqual(["doc-01", "doc-03", "doc-05", "doc-07", "doc-09"]);
    });

    it("$exists: false finds docs with null field", async () => {
      const ids = await queryIds({ optionalField: { $exists: false } });
      // docs where optionalField is null
      expect(ids).toEqual(["doc-02", "doc-04", "doc-06", "doc-08", "doc-10"]);
    });

    it("$exists: true on always-present field returns all", async () => {
      const ids = await queryIds({ status: { $exists: true } });
      expect(ids).toHaveLength(10);
    });
  });

  // ============================================================
  // LOGICAL OPERATORS
  // ============================================================

  describe("logical operators", () => {
    it("implicit AND with multiple fields", async () => {
      const ids = await queryIds({ status: "active", flag: true });
      expect(ids).toEqual(["doc-01", "doc-07"]);
    });

    it("$and with two conditions", async () => {
      const ids = await queryIds({
        $and: [{ status: "active" }, { num: { $gte: 0 } }],
      });
      expect(ids).toEqual(["doc-01", "doc-02", "doc-06", "doc-10"]);
    });

    it("$and with three conditions", async () => {
      const ids = await queryIds({
        $and: [{ status: "active" }, { flag: true }, { num: { $gt: 0 } }],
      });
      expect(ids).toEqual(["doc-01"]);
    });

    it("$or with two conditions", async () => {
      const ids = await queryIds({
        $or: [{ status: "deleted" }, { num: { $lt: 0 } }],
      });
      expect(ids).toEqual(["doc-05", "doc-07", "doc-08"]);
    });

    it("$or with equality on same field", async () => {
      const ids = await queryIds({
        $or: [{ num: 10 }, { num: 20 }, { num: 30 }],
      });
      expect(ids).toEqual(["doc-01", "doc-02", "doc-03"]);
    });

    it("$not with simple condition", async () => {
      const ids = await queryIds({
        $not: { status: "active" },
      });
      expect(ids).toEqual(["doc-03", "doc-04", "doc-05", "doc-08", "doc-09"]);
    });

    it("$not with comparison", async () => {
      const ids = await queryIds({
        $not: { num: { $gte: 30 } },
      });
      expect(ids).toEqual(["doc-01", "doc-02", "doc-06", "doc-07", "doc-09"]);
    });

    it("$not with boolean", async () => {
      const ids = await queryIds({
        $not: { flag: true },
      });
      expect(ids).toEqual(["doc-02", "doc-04", "doc-06", "doc-08", "doc-10"]);
    });

    it("AND of ORs", async () => {
      const ids = await queryIds({
        $and: [
          { $or: [{ status: "active" }, { status: "pending" }] },
          { $or: [{ flag: true }] },
        ],
      });
      expect(ids).toEqual(["doc-01", "doc-03", "doc-07", "doc-09"]);
    });

    it("OR of ANDs", async () => {
      const ids = await queryIds({
        $or: [
          { status: "active", flag: true },
          { status: "deleted", flag: false },
        ],
      });
      expect(ids).toEqual(["doc-01", "doc-07", "doc-08"]);
    });

    it("deeply nested filter", async () => {
      const ids = await queryIds({
        $and: [
          { num: { $gte: 0 } },
          {
            $or: [
              { status: "active", flag: true },
              {
                $and: [{ status: "pending" }, { num: { $gte: 25 } }],
              },
            ],
          },
        ],
      });
      // doc-01: active + flag=true + num >= 0
      // doc-03: pending + num 30 >= 25
      // doc-04: pending + num 40 >= 25
      // doc-09: pending + num 25 >= 25
      expect(ids).toEqual(["doc-01", "doc-03", "doc-04", "doc-09"]);
    });

    it("empty $and returns all results", async () => {
      const ids = await queryIds({ $and: [] });
      expect(ids).toHaveLength(10);
    });

    it("empty $or returns all results", async () => {
      const ids = await queryIds({ $or: [] });
      expect(ids).toHaveLength(10);
    });

    it("$and with single condition", async () => {
      const ids = await queryIds({ $and: [{ status: "deleted" }] });
      expect(ids).toEqual(["doc-05", "doc-08"]);
    });

    it("$or with single condition", async () => {
      const ids = await queryIds({ $or: [{ status: "deleted" }] });
      expect(ids).toEqual(["doc-05", "doc-08"]);
    });
  });

  // ============================================================
  // COMBINED FILTER + FIELD ASSERTIONS
  // ============================================================

  describe("filter result validation", () => {
    it("filtered results have correct field values", async () => {
      const hits = await handle.query({
        query: [{ embedding: QUERY_VECTOR }],
        limit: 100,
        filter: { status: "pending" },
      });

      expect(hits.length).toBe(3);
      for (const hit of hits) {
        expect(hit.document?.status).toBe("pending");
      }

      const nums = hits
        .map((h) => h.document?.num)
        .sort((a, b) => (a ?? 0) - (b ?? 0));
      expect(nums).toEqual([25, 30, 40]);
    });

    it("complex filter returns expected documents with correct data", async () => {
      const hits = await handle.query({
        query: [{ embedding: QUERY_VECTOR }],
        limit: 100,
        filter: {
          $and: [{ num: { $gte: 20, $lte: 50 } }, { flag: true }],
        },
      });

      expect(hits.length).toBe(3);
      const names = hits.map((h) => h.document?.name).sort();
      expect(names).toEqual(["charlie_smith", "eve_johnson", "ivy_taylor"]);

      for (const hit of hits) {
        expect(hit.document?.flag).toBe(true);
        expect(hit.document?.num).toBeGreaterThanOrEqual(20);
        expect(hit.document?.num).toBeLessThanOrEqual(50);
      }
    });

    it("combining filter + limit limits correctly", async () => {
      const hits = await handle.query({
        query: [{ embedding: QUERY_VECTOR }],
        limit: 2,
        filter: { status: "active" },
      });

      expect(hits.length).toBe(2);
      for (const hit of hits) {
        expect(hit.document?.status).toBe("active");
      }
    });
  });

  // ============================================================
  // NULL HANDLING
  // ============================================================

  describe("null handling", () => {
    it("equality shorthand with null matches null values", async () => {
      const ids = await queryIds({ optionalField: null });
      expect(ids).toEqual(["doc-02", "doc-04", "doc-06", "doc-08", "doc-10"]);
    });

    it("$neq: null excludes null values", async () => {
      const ids = await queryIds({ optionalField: { $neq: null } });
      // This returns docs where optionalField IS NOT NULL
      // Note: In SQL, `col != NULL` is always false, but our impl uses IS NOT NULL
      // Actually looking at the code, $neq: null uses != $N with null param
      // which in Postgres returns no rows. Let's see what behavior we get.
      // If this fails, it reveals a semantic issue we should address.
      expect(ids).toEqual([]);
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("edge cases", () => {
    it("empty filter returns all results", async () => {
      const ids = await queryIds({});
      expect(ids).toHaveLength(10);
    });

    it("filter with undefined values is ignored", async () => {
      const ids = await queryIds({ status: "active", bogus: undefined } as any);
      expect(ids).toEqual(["doc-01", "doc-02", "doc-06", "doc-07", "doc-10"]);
    });

    it("multiple operators on same field all apply", async () => {
      // num >= 10 AND num <= 30 AND num != 20
      const ids = await queryIds({ num: { $gte: 10, $lte: 30, $neq: 20 } });
      expect(ids).toEqual(["doc-01", "doc-03", "doc-09"]);
    });

    it("filter with special characters in value", async () => {
      // No docs match this, but it shouldn't error
      const ids = await queryIds({ name: "'; DROP TABLE users; --" });
      expect(ids).toEqual([]);
    });

    it("filter on non-existent field returns empty", async () => {
      // Postgres will error on non-existent column
      await expect(queryIds({ nonexistent: "value" } as any)).rejects.toThrow();
    });
  });
});
