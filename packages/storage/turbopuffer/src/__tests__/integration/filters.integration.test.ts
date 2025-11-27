/**
 * Comprehensive filter integration tests.
 *
 * Tests all filter operators against real Turbopuffer API with a
 * deterministic dataset.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { TurbopufferSearchIndex } from "../../search";
import type { IndexHandle } from "@kernl-sdk/retrieval";
import type { Filter } from "@kernl-sdk/retrieval";

const TURBOPUFFER_API_KEY = process.env.TURBOPUFFER_API_KEY;
const TURBOPUFFER_REGION = process.env.TURBOPUFFER_REGION ?? "api";

/**
 * Test document type for results.
 */
interface TestDoc {
  id: string;
  num: number;
  flag: boolean;
  status: string;
  tags: string[];
  name: string;
  optionalField?: string | null;
  vector: number[];
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
    tags: ["important", "urgent"],
    name: "alice_smith",
    optionalField: "present",
    vector: [0.1, 0.0, 0.0, 0.0],
  },
  {
    id: "doc-02",
    num: 20,
    flag: false,
    status: "active",
    tags: ["normal"],
    name: "bob_jones",
    optionalField: null,
    vector: [0.0, 0.1, 0.0, 0.0],
  },
  {
    id: "doc-03",
    num: 30,
    flag: true,
    status: "pending",
    tags: ["important"],
    name: "charlie_smith",
    optionalField: "also_present",
    vector: [0.0, 0.0, 0.1, 0.0],
  },
  {
    id: "doc-04",
    num: 40,
    flag: false,
    status: "pending",
    tags: ["normal", "review"],
    name: "diana_brown",
    optionalField: null,
    vector: [0.0, 0.0, 0.0, 0.1],
  },
  {
    id: "doc-05",
    num: 50,
    flag: true,
    status: "deleted",
    tags: ["archived"],
    name: "eve_johnson",
    optionalField: "value",
    vector: [0.1, 0.1, 0.0, 0.0],
  },
  {
    id: "doc-06",
    num: 0,
    flag: false,
    status: "active",
    tags: [],
    name: "frank_miller",
    optionalField: null,
    vector: [0.0, 0.1, 0.1, 0.0],
  },
  {
    id: "doc-07",
    num: -10,
    flag: true,
    status: "active",
    tags: ["urgent", "critical"],
    name: "grace_wilson",
    optionalField: "exists",
    vector: [0.0, 0.0, 0.1, 0.1],
  },
  {
    id: "doc-08",
    num: 100,
    flag: false,
    status: "deleted",
    tags: ["archived", "old"],
    name: "henry_davis",
    vector: [0.1, 0.0, 0.1, 0.0],
  },
  {
    id: "doc-09",
    num: 25,
    flag: true,
    status: "pending",
    tags: ["important", "review"],
    name: "ivy_taylor",
    optionalField: "set",
    vector: [0.0, 0.1, 0.0, 0.1],
  },
  {
    id: "doc-10",
    num: 35,
    flag: false,
    status: "active",
    tags: ["normal"],
    name: "jack_anderson",
    optionalField: null,
    vector: [0.1, 0.0, 0.0, 0.1],
  },
];

// Standard query vector for all filter tests
const QUERY_VECTOR = [0.1, 0.1, 0.1, 0.1];

describe("Filter integration tests", () => {
  if (!TURBOPUFFER_API_KEY) {
    it.skip("requires TURBOPUFFER_API_KEY to be set", () => {});
    return;
  }

  let tpuf: TurbopufferSearchIndex;
  let ns: IndexHandle<TestDoc>;
  const testIndexId = `kernl-filter-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    tpuf = new TurbopufferSearchIndex({
      apiKey: TURBOPUFFER_API_KEY,
      region: TURBOPUFFER_REGION,
    });

    // Create index with schema
    await tpuf.createIndex({
      id: testIndexId,
      schema: {
        num: { type: "int", filterable: true },
        flag: { type: "boolean", filterable: true },
        status: { type: "string", filterable: true },
        tags: { type: "string[]", filterable: true },
        name: { type: "string", filterable: true },
        optionalField: { type: "string", filterable: true },
        vector: { type: "vector", dimensions: 4 },
      },
    });

    ns = tpuf.index<TestDoc>(testIndexId);

    // Insert test documents
    await ns.upsert(TEST_DOCS);

    // Wait for indexing
    await new Promise((r) => setTimeout(r, 1000));
  }, 30000);

  afterAll(async () => {
    try {
      await tpuf.deleteIndex(testIndexId);
    } catch {
      // Ignore cleanup errors
    }
  });

  /**
   * Helper to query and return sorted IDs.
   */
  async function queryIds(filter: Filter): Promise<string[]> {
    const hits = await ns.query({
      query: [{ vector: QUERY_VECTOR }],
      topK: 100,
      filter,
    });
    return hits.map((h) => h.id).sort();
  }

  // ============================================================
  // EQUALITY OPERATORS
  // ============================================================

  describe("equality operators", () => {
    it("$eq on string field", async () => {
      const ids = await queryIds({ status: "active" });
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

    it("range filter (gt + lt)", async () => {
      const ids = await queryIds({ num: { $gt: 20, $lt: 40 } });
      expect(ids).toEqual(["doc-03", "doc-09", "doc-10"]);
    });

    it("inclusive range (gte + lte)", async () => {
      const ids = await queryIds({ num: { $gte: 20, $lte: 40 } });
      expect(ids).toEqual(["doc-02", "doc-03", "doc-04", "doc-09", "doc-10"]);
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
  });

  // ============================================================
  // ARRAY OPERATORS
  // ============================================================

  describe("array operators", () => {
    it("$contains on array field", async () => {
      const ids = await queryIds({ tags: { $contains: "important" } });
      expect(ids).toEqual(["doc-01", "doc-03", "doc-09"]);
    });

    it("$contains with different value", async () => {
      const ids = await queryIds({ tags: { $contains: "urgent" } });
      expect(ids).toEqual(["doc-01", "doc-07"]);
    });

    it("$contains with value not in any doc", async () => {
      const ids = await queryIds({ tags: { $contains: "nonexistent" } });
      expect(ids).toEqual([]);
    });
  });

  // ============================================================
  // STRING PATTERN OPERATORS
  // ============================================================

  describe("string pattern operators", () => {
    it("$startsWith matches prefix", async () => {
      const ids = await queryIds({ name: { $startsWith: "alice" } });
      expect(ids).toEqual(["doc-01"]);
    });

    it("$startsWith with common prefix", async () => {
      // All names ending with _smith or starting with common letters
      const ids = await queryIds({ name: { $startsWith: "j" } });
      expect(ids).toEqual(["doc-10"]); // jack_anderson
    });

    it("$endsWith matches suffix", async () => {
      const ids = await queryIds({ name: { $endsWith: "_smith" } });
      expect(ids).toEqual(["doc-01", "doc-03"]); // alice_smith, charlie_smith
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
      // docs with optionalField set to a string value (not null, not missing)
      expect(ids).toEqual(["doc-01", "doc-03", "doc-05", "doc-07", "doc-09"]);
    });

    it("$exists: false finds docs with null or missing field", async () => {
      const ids = await queryIds({ optionalField: { $exists: false } });
      // docs where optionalField is null or missing
      expect(ids).toEqual(["doc-02", "doc-04", "doc-06", "doc-08", "doc-10"]);
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
                $and: [
                  { status: "pending" },
                  { tags: { $contains: "review" } },
                ],
              },
            ],
          },
        ],
      });
      // doc-01: active + flag=true
      // doc-04: pending + tags contains "review"
      // doc-09: pending + tags contains "review"
      expect(ids).toEqual(["doc-01", "doc-04", "doc-09"]);
    });
  });

  // ============================================================
  // COMBINED FILTER + FIELD ASSERTIONS
  // ============================================================

  describe("filter result validation", () => {
    it("filtered results have correct field values", async () => {
      const hits = await ns.query({
        query: [{ vector: QUERY_VECTOR }],
        topK: 100,
        filter: { status: "pending" },
        include: ["status", "flag", "num"],
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
      const hits = await ns.query({
        query: [{ vector: QUERY_VECTOR }],
        topK: 100,
        filter: {
          $and: [{ num: { $gte: 20, $lte: 50 } }, { flag: true }],
        },
        include: ["num", "flag", "name"],
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
  });
});
