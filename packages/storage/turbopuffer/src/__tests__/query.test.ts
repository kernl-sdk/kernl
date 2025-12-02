/**
 * Comprehensive unit tests for query conversion.
 *
 * Tests vector, text, hybrid queries, fusion modes, query options,
 * and SearchHit decoding.
 */

import { describe, it, expect } from "vitest";

import { QUERY, SEARCH_HIT } from "../convert/query";

describe("QUERY", () => {
  // ============================================================
  // VECTOR-ONLY QUERIES
  // ============================================================

  describe("vector-only queries", () => {
    it("encodes single vector signal", () => {
      const result = QUERY.encode({
        query: [{ vector: [0.1, 0.2, 0.3] }],
      });

      expect(result.rank_by).toEqual(["vector", "ANN", [0.1, 0.2, 0.3]]);
    });

    it("encodes vector with many dimensions", () => {
      const vec = new Array(384).fill(0.5);
      const result = QUERY.encode({
        query: [{ vector: vec }],
      });

      expect(result.rank_by).toEqual(["vector", "ANN", vec]);
    });

    it("encodes vector with zeros", () => {
      const result = QUERY.encode({
        query: [{ vector: [0, 0, 0] }],
      });

      expect(result.rank_by).toEqual(["vector", "ANN", [0, 0, 0]]);
    });

    it("encodes vector with negative values", () => {
      const result = QUERY.encode({
        query: [{ vector: [-0.5, 0.5, -1.0] }],
      });

      expect(result.rank_by).toEqual(["vector", "ANN", [-0.5, 0.5, -1.0]]);
    });

    it("throws error for multiple vector signals", () => {
      expect(() =>
        QUERY.encode({
          query: [{ vector: [0.1, 0.2] }, { vector: [0.3, 0.4] }],
        }),
      ).toThrow(/does not support multi-vector/);
    });

    it("encodes vector query with max fusion", () => {
      const result = QUERY.encode({
        max: [{ vector: [0.1, 0.2] }],
      });

      // Single signal, no fusion wrapper needed
      expect(result.rank_by).toEqual(["vector", "ANN", [0.1, 0.2]]);
    });

    it("throws error for multiple vector signals with max fusion", () => {
      expect(() =>
        QUERY.encode({
          max: [{ vector: [0.1, 0.2] }, { vector: [0.3, 0.4] }],
        }),
      ).toThrow(/does not support multi-vector/);
    });
  });

  // ============================================================
  // TEXT-ONLY QUERIES (BM25)
  // ============================================================

  describe("text-only queries (BM25)", () => {
    it("encodes single text field query", () => {
      const result = QUERY.encode({
        query: [{ content: "hello world" }],
      });

      expect(result.rank_by).toEqual(["content", "BM25", "hello world"]);
    });

    it("encodes text query on different field", () => {
      const result = QUERY.encode({
        query: [{ title: "search terms" }],
      });

      expect(result.rank_by).toEqual(["title", "BM25", "search terms"]);
    });

    it("encodes empty string text query", () => {
      const result = QUERY.encode({
        query: [{ content: "" }],
      });

      expect(result.rank_by).toEqual(["content", "BM25", ""]);
    });

    it("encodes text query with special characters", () => {
      const result = QUERY.encode({
        query: [{ content: "hello \"world\" & foo | bar" }],
      });

      expect(result.rank_by).toEqual([
        "content",
        "BM25",
        "hello \"world\" & foo | bar",
      ]);
    });

    it("encodes multi-field text query as Sum fusion", () => {
      const result = QUERY.encode({
        query: [{ title: "search" }, { body: "search" }],
      });

      expect(result.rank_by).toEqual([
        "Sum",
        [
          ["title", "BM25", "search"],
          ["body", "BM25", "search"],
        ],
      ]);
    });

    it("encodes three-field text query as Sum fusion", () => {
      const result = QUERY.encode({
        query: [
          { title: "query" },
          { description: "query" },
          { content: "query" },
        ],
      });

      expect(result.rank_by).toEqual([
        "Sum",
        [
          ["title", "BM25", "query"],
          ["description", "BM25", "query"],
          ["content", "BM25", "query"],
        ],
      ]);
    });

    it("encodes multi-field text query with max fusion", () => {
      const result = QUERY.encode({
        max: [{ title: "search" }, { body: "search" }],
      });

      expect(result.rank_by).toEqual([
        "Max",
        [
          ["title", "BM25", "search"],
          ["body", "BM25", "search"],
        ],
      ]);
    });
  });

  // ============================================================
  // HYBRID QUERIES (VECTOR + TEXT) - NOT SUPPORTED
  // ============================================================

  describe("hybrid queries (vector + text)", () => {
    it("throws error for vector + text fusion", () => {
      expect(() =>
        QUERY.encode({
          query: [{ vector: [0.1, 0.2, 0.3] }, { content: "search terms" }],
        }),
      ).toThrow(/does not support hybrid/);
    });

    it("throws error for vector + text max fusion", () => {
      expect(() =>
        QUERY.encode({
          max: [{ vector: [0.1, 0.2, 0.3] }, { content: "search terms" }],
        }),
      ).toThrow(/does not support hybrid/);
    });

    it("throws error for vector + multi-field text", () => {
      expect(() =>
        QUERY.encode({
          query: [
            { vector: [0.1, 0.2] },
            { title: "query" },
            { body: "query" },
          ],
        }),
      ).toThrow(/does not support hybrid/);
    });

    it("throws error for multi-vector fusion", () => {
      expect(() =>
        QUERY.encode({
          query: [{ vector: [0.1, 0.2] }, { vector: [0.3, 0.4] }],
        }),
      ).toThrow(/does not support multi-vector/);
    });
  });

  // ============================================================
  // QUERY OPTIONS
  // ============================================================

  describe("query options", () => {
    describe("topK", () => {
      it("encodes topK as top_k", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          topK: 10,
        });

        expect(result.top_k).toBe(10);
      });

      it("encodes topK of 1", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          topK: 1,
        });

        expect(result.top_k).toBe(1);
      });

      it("encodes large topK", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          topK: 10000,
        });

        expect(result.top_k).toBe(10000);
      });

      it("does not include top_k when undefined", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
        });

        expect(result.top_k).toBeUndefined();
      });
    });

    describe("filter", () => {
      it("encodes simple filter", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          filter: { status: "active" },
        });

        expect(result.filters).toEqual(["status", "Eq", "active"]);
      });

      it("encodes complex filter", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          filter: {
            $and: [{ status: "active" }, { views: { $gte: 100 } }],
          },
        });

        expect(result.filters).toEqual([
          "And",
          [
            ["status", "Eq", "active"],
            ["views", "Gte", 100],
          ],
        ]);
      });

      it("does not include filters when undefined", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
        });

        expect(result.filters).toBeUndefined();
      });
    });

    describe("include", () => {
      it("encodes include as boolean true", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          include: true,
        });

        expect(result.include_attributes).toBe(true);
      });

      it("encodes include as boolean false", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          include: false,
        });

        expect(result.include_attributes).toBe(false);
      });

      it("encodes include as string array", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          include: ["title", "content"],
        });

        expect(result.include_attributes).toEqual(["title", "content"]);
      });

      it("encodes include as single-element array", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          include: ["id"],
        });

        expect(result.include_attributes).toEqual(["id"]);
      });

      it("encodes include as empty array", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
          include: [],
        });

        expect(result.include_attributes).toEqual([]);
      });

      it("does not include include_attributes when undefined", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1] }],
        });

        expect(result.include_attributes).toBeUndefined();
      });
    });

    describe("combined options", () => {
      it("encodes all options together", () => {
        const result = QUERY.encode({
          query: [{ vector: [0.1, 0.2] }],
          topK: 20,
          filter: { category: "news" },
          include: ["title", "summary"],
        });

        expect(result.rank_by).toEqual(["vector", "ANN", [0.1, 0.2]]);
        expect(result.top_k).toBe(20);
        expect(result.filters).toEqual(["category", "Eq", "news"]);
        expect(result.include_attributes).toEqual(["title", "summary"]);
      });
    });
  });

  // ============================================================
  // FUSION MODE SELECTION
  // ============================================================

  describe("fusion mode selection", () => {
    it("throws error when query has both vector and text", () => {
      expect(() =>
        QUERY.encode({
          query: [{ vector: [0.1] }, { content: "search" }],
        }),
      ).toThrow(/does not support hybrid/);
    });

    it("throws error when max has both vector and text", () => {
      expect(() =>
        QUERY.encode({
          max: [{ vector: [0.1] }, { content: "search" }],
        }),
      ).toThrow(/does not support hybrid/);
    });

    it("prefers query over max when both present", () => {
      const result = QUERY.encode({
        query: [{ vector: [0.1] }],
        max: [{ content: "search" }],
      });

      // query takes precedence
      expect(result.rank_by).toEqual(["vector", "ANN", [0.1]]);
    });
  });

  // ============================================================
  // ERROR CASES
  // ============================================================

  describe("error cases", () => {
    it("throws when query array has only undefined values", () => {
      expect(() =>
        QUERY.encode({
          query: [{ field: undefined }],
        }),
      ).toThrow("No ranking signals provided");
    });

    it("returns params without rank_by when query is empty array", () => {
      // Note: In practice, empty arrays are caught during normalization.
      // Direct codec call with empty array returns params without rank_by.
      const result = QUERY.encode({
        query: [],
        topK: 10,
      });

      expect(result.rank_by).toBeUndefined();
      expect(result.top_k).toBe(10);
    });

    it("returns params without rank_by when no query or max", () => {
      const result = QUERY.encode({
        topK: 10,
        filter: { status: "active" },
      });

      expect(result.rank_by).toBeUndefined();
      expect(result.top_k).toBe(10);
      expect(result.filters).toEqual(["status", "Eq", "active"]);
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("edge cases", () => {
    it("handles signal with multiple fields in one object", () => {
      // A signal object could technically have multiple fields
      const result = QUERY.encode({
        query: [{ title: "hello", body: "world" }],
      });

      // Both should be extracted as separate BM25 signals
      expect(result.rank_by).toEqual([
        "Sum",
        [
          ["title", "BM25", "hello"],
          ["body", "BM25", "world"],
        ],
      ]);
    });

    it("throws error for mixed signal types in one object", () => {
      // Vector and text in same signal object
      expect(() =>
        QUERY.encode({
          query: [{ vector: [0.1], content: "search" }],
        }),
      ).toThrow(/does not support hybrid/);
    });
  });
});

// ============================================================
// SEARCH_HIT CODEC
// ============================================================

describe("SEARCH_HIT", () => {
  describe("decode", () => {
    it("decodes basic row with id and score", () => {
      const result = SEARCH_HIT.decode(
        { id: "doc-1", $dist: 0.5 },
        "my-index",
      );

      expect(result).toEqual({
        id: "doc-1",
        index: "my-index",
        score: -0.5, // negated: distance → similarity
        document: { id: "doc-1" },
      });
    });

    it("decodes row with additional attributes", () => {
      const result = SEARCH_HIT.decode(
        {
          id: "doc-1",
          $dist: 0.25,
          title: "Hello World",
          category: "greeting",
        },
        "my-index",
      );

      expect(result).toEqual({
        id: "doc-1",
        index: "my-index",
        score: -0.25, // negated: distance → similarity
        document: {
          id: "doc-1",
          title: "Hello World",
          category: "greeting",
        },
      });
    });

    it("decodes row with vector attribute", () => {
      const result = SEARCH_HIT.decode(
        {
          id: "doc-1",
          $dist: 0.1,
          vector: [0.1, 0.2, 0.3],
        },
        "my-index",
      );

      expect(result.document?.id).toBe("doc-1");
      expect(result.document?.vector).toEqual([0.1, 0.2, 0.3]);
    });

    it("converts numeric id to string", () => {
      const result = SEARCH_HIT.decode(
        { id: 12345, $dist: 0.5 },
        "my-index",
      );

      expect(result.id).toBe("12345");
      expect(typeof result.id).toBe("string");
      expect(result.document?.id).toBe(12345); // document keeps original type
    });

    it("handles missing $dist (defaults to 0)", () => {
      const result = SEARCH_HIT.decode({ id: "doc-1" }, "my-index");

      expect(result.score).toBe(0);
      expect(result.document).toEqual({ id: "doc-1" });
    });

    it("handles $dist of 0", () => {
      const result = SEARCH_HIT.decode(
        { id: "doc-1", $dist: 0 },
        "my-index",
      );

      expect(result.score).toBe(0);
    });

    it("handles negative $dist", () => {
      const result = SEARCH_HIT.decode(
        { id: "doc-1", $dist: -0.5 },
        "my-index",
      );

      expect(result.score).toBe(0.5); // negated: distance → similarity
    });

    it("handles large $dist values", () => {
      const result = SEARCH_HIT.decode(
        { id: "doc-1", $dist: 999999.99 },
        "my-index",
      );

      expect(result.score).toBe(-999999.99); // negated: distance → similarity
    });

    it("includes id in document even when no extra attributes", () => {
      const result = SEARCH_HIT.decode(
        { id: "doc-1", $dist: 0.5 },
        "my-index",
      );

      expect(result.document).toEqual({ id: "doc-1" });
    });

    it("preserves attribute types", () => {
      const result = SEARCH_HIT.decode(
        {
          id: "doc-1",
          $dist: 0.5,
          count: 42,
          enabled: true,
          rating: 4.5,
          tags: ["a", "b"],
          meta: null,
        },
        "my-index",
      );

      expect(result.document).toEqual({
        id: "doc-1",
        count: 42,
        enabled: true,
        rating: 4.5,
        tags: ["a", "b"],
        meta: null,
      });
    });

    it("handles empty string id", () => {
      const result = SEARCH_HIT.decode({ id: "", $dist: 0.5 }, "my-index");

      expect(result.id).toBe("");
    });

    it("handles special characters in attribute values", () => {
      const result = SEARCH_HIT.decode(
        {
          id: "doc-1",
          $dist: 0.5,
          content: "Hello \"world\" & <script>",
        },
        "my-index",
      );

      expect(result.document?.content).toBe("Hello \"world\" & <script>");
    });
  });

  describe("decode with typed document", () => {
    interface MyDoc {
      title: string;
      views: number;
    }

    it("returns typed document", () => {
      const result = SEARCH_HIT.decode<MyDoc>(
        {
          id: "doc-1",
          $dist: 0.5,
          title: "Test",
          views: 100,
        },
        "my-index",
      );

      // TypeScript should recognize these as MyDoc fields
      expect(result.document?.title).toBe("Test");
      expect(result.document?.views).toBe(100);
    });
  });
});
