import { describe, it, expect } from "vitest";

import { DOCUMENT, PATCH } from "../convert/document";
import { FILTER } from "../convert/filter";
import { QUERY, SEARCH_HIT } from "../convert/query";
import { SCALAR_TYPE, SIMILARITY, INDEX_SCHEMA } from "../convert/schema";

describe("convert", () => {
  describe("SCALAR_TYPE", () => {
    it("encodes kernl types to turbopuffer types", () => {
      expect(SCALAR_TYPE.encode("string")).toBe("string");
      expect(SCALAR_TYPE.encode("int")).toBe("int");
      expect(SCALAR_TYPE.encode("float")).toBe("int"); // tpuf doesn't have float
      expect(SCALAR_TYPE.encode("boolean")).toBe("bool");
      expect(SCALAR_TYPE.encode("date")).toBe("datetime");
      expect(SCALAR_TYPE.encode("string[]")).toBe("[]string");
      expect(SCALAR_TYPE.encode("int[]")).toBe("[]int");
    });

    it("decodes turbopuffer types to kernl types", () => {
      expect(SCALAR_TYPE.decode("string")).toBe("string");
      expect(SCALAR_TYPE.decode("int")).toBe("int");
      expect(SCALAR_TYPE.decode("bool")).toBe("boolean");
      expect(SCALAR_TYPE.decode("datetime")).toBe("date");
      expect(SCALAR_TYPE.decode("[]string")).toBe("string[]");
    });
  });

  describe("SIMILARITY", () => {
    it("encodes similarity to distance metric", () => {
      expect(SIMILARITY.encode("cosine")).toBe("cosine_distance");
      expect(SIMILARITY.encode("euclidean")).toBe("euclidean_squared");
      expect(SIMILARITY.encode("dot_product")).toBe("cosine_distance");
      expect(SIMILARITY.encode(undefined)).toBe("cosine_distance");
    });

    it("decodes distance metric to similarity", () => {
      expect(SIMILARITY.decode("cosine_distance")).toBe("cosine");
      expect(SIMILARITY.decode("euclidean_squared")).toBe("euclidean");
    });
  });

  describe("INDEX_SCHEMA", () => {
    it("encodes a schema with scalar fields", () => {
      const result = INDEX_SCHEMA.encode({
        title: { type: "string", filterable: true },
        count: { type: "int" },
      });

      expect(result.title).toEqual({ type: "string", filterable: true });
      expect(result.count).toEqual({ type: "int" });
    });

    it("encodes a schema with vector field", () => {
      const result = INDEX_SCHEMA.encode({
        vector: { type: "vector", dimensions: 384 },
      });

      expect(result.vector).toEqual({ type: "[384]f32", ann: true });
    });

    it("throws if vector field is not named vector", () => {
      expect(() =>
        INDEX_SCHEMA.encode({
          embedding: { type: "vector", dimensions: 384 },
        }),
      ).toThrow(/requires vector fields to be named "vector"/);
    });

    it("encodes fts fields", () => {
      const result = INDEX_SCHEMA.encode({
        content: { type: "string", fts: true },
      });

      expect(result.content).toEqual({
        type: "string",
        full_text_search: true,
      });
    });
  });

  describe("DOCUMENT", () => {
    it("encodes flat document with scalar fields", () => {
      const result = DOCUMENT.encode({
        id: "doc-1",
        title: "Hello",
        count: 42,
        active: true,
      });

      expect(result).toEqual({
        id: "doc-1",
        title: "Hello",
        count: 42,
        active: true,
      });
    });

    it("encodes flat document with vector field", () => {
      const result = DOCUMENT.encode({
        id: "doc-2",
        vector: [0.1, 0.2, 0.3],
      });

      expect(result).toEqual({
        id: "doc-2",
        vector: [0.1, 0.2, 0.3],
      });
    });

    it("throws if id is missing", () => {
      expect(() => DOCUMENT.encode({ title: "No ID" })).toThrow(
        'Document must have a string "id" field',
      );
    });
  });

  describe("PATCH", () => {
    it("encodes flat patch with field updates", () => {
      const result = PATCH.encode({
        id: "doc-1",
        title: "Updated",
        count: 100,
      });

      expect(result).toEqual({
        id: "doc-1",
        title: "Updated",
        count: 100,
      });
    });

    it("encodes null values to unset fields", () => {
      const result = PATCH.encode({
        id: "doc-1",
        title: "Keep this",
        description: null,
      });

      expect(result).toEqual({
        id: "doc-1",
        title: "Keep this",
        description: null,
      });
    });

    it("encodes vector updates", () => {
      const result = PATCH.encode({
        id: "doc-1",
        vector: [0.5, 0.6],
      });

      expect(result).toEqual({
        id: "doc-1",
        vector: [0.5, 0.6],
      });
    });

    it("throws if id is missing", () => {
      expect(() => PATCH.encode({ title: "No ID" })).toThrow(
        'Patch must have a string "id" field',
      );
    });
  });

  describe("FILTER", () => {
    // Simple equality (shorthand)
    it("encodes simple equality filter", () => {
      expect(FILTER.encode({ f: "x" })).toEqual(["f", "Eq", "x"]);
      expect(FILTER.encode({ f: 42 })).toEqual(["f", "Eq", 42]);
      expect(FILTER.encode({ f: true })).toEqual(["f", "Eq", true]);
      expect(FILTER.encode({ f: null })).toEqual(["f", "Eq", null]);
    });

    // Field operators
    it("encodes $eq operator", () => {
      expect(FILTER.encode({ f: { $eq: "x" } })).toEqual(["f", "Eq", "x"]);
    });

    it("encodes $neq operator", () => {
      expect(FILTER.encode({ f: { $neq: "x" } })).toEqual(["f", "NotEq", "x"]);
    });

    it("encodes comparison operators", () => {
      expect(FILTER.encode({ f: { $gt: 10 } })).toEqual(["f", "Gt", 10]);
      expect(FILTER.encode({ f: { $gte: 10 } })).toEqual(["f", "Gte", 10]);
      expect(FILTER.encode({ f: { $lt: 10 } })).toEqual(["f", "Lt", 10]);
      expect(FILTER.encode({ f: { $lte: 10 } })).toEqual(["f", "Lte", 10]);
    });

    it("encodes set membership operators", () => {
      expect(FILTER.encode({ f: { $in: ["a", "b"] } })).toEqual(["f", "In", ["a", "b"]]);
      expect(FILTER.encode({ f: { $nin: ["a", "b"] } })).toEqual(["f", "NotIn", ["a", "b"]]);
    });

    it("encodes $contains operator", () => {
      expect(FILTER.encode({ f: { $contains: "x" } })).toEqual(["f", "Contains", "x"]);
    });

    it("encodes string pattern operators as Glob", () => {
      expect(FILTER.encode({ f: { $startsWith: "pre" } })).toEqual(["f", "Glob", "pre*"]);
      expect(FILTER.encode({ f: { $endsWith: "suf" } })).toEqual(["f", "Glob", "*suf"]);
    });

    it("encodes $exists operator", () => {
      expect(FILTER.encode({ f: { $exists: true } })).toEqual(["f", "NotEq", null]);
      expect(FILTER.encode({ f: { $exists: false } })).toEqual(["f", "Eq", null]);
    });

    // Logical operators
    it("encodes $and filter", () => {
      const result = FILTER.encode({
        $and: [{ a: 1 }, { b: 2 }],
      });

      expect(result).toEqual([
        "And",
        [
          ["a", "Eq", 1],
          ["b", "Eq", 2],
        ],
      ]);
    });

    it("encodes $or filter", () => {
      const result = FILTER.encode({
        $or: [{ status: "active" }, { status: "pending" }],
      });

      expect(result).toEqual([
        "Or",
        [
          ["status", "Eq", "active"],
          ["status", "Eq", "pending"],
        ],
      ]);
    });

    it("encodes $not filter", () => {
      const result = FILTER.encode({
        $not: { deleted: true },
      });

      expect(result).toEqual(["Not", ["deleted", "Eq", true]]);
    });

    it("encodes deeply nested filters", () => {
      const result = FILTER.encode({
        $and: [
          { active: true },
          {
            $or: [
              { role: "admin" },
              {
                $and: [{ role: "user" }, { verified: true }],
              },
            ],
          },
        ],
      });

      expect(result).toEqual([
        "And",
        [
          ["active", "Eq", true],
          [
            "Or",
            [
              ["role", "Eq", "admin"],
              [
                "And",
                [
                  ["role", "Eq", "user"],
                  ["verified", "Eq", true],
                ],
              ],
            ],
          ],
        ],
      ]);
    });

    it("encodes multiple fields as implicit AND", () => {
      const result = FILTER.encode({ a: 1, b: 2 });
      expect(result).toEqual([
        "And",
        [
          ["a", "Eq", 1],
          ["b", "Eq", 2],
        ],
      ]);
    });
  });

  describe("QUERY", () => {
    it("encodes vector search query", () => {
      const result = QUERY.encode({
        query: [{ vector: [0.1, 0.2, 0.3] }],
        limit: 10,
      });

      expect(result.rank_by).toEqual(["vector", "ANN", [0.1, 0.2, 0.3]]);
      expect(result.top_k).toBe(10);
    });

    it("encodes text search query", () => {
      const result = QUERY.encode({
        query: [{ content: "hello world" }],
        limit: 5,
      });

      expect(result.rank_by).toEqual(["content", "BM25", "hello world"]);
      expect(result.top_k).toBe(5);
    });

    it("encodes multi-field text search as Sum", () => {
      const result = QUERY.encode({
        query: [{ title: "search term" }, { body: "search term" }],
        limit: 10,
      });

      expect(result.rank_by).toEqual([
        "Sum",
        [
          ["title", "BM25", "search term"],
          ["body", "BM25", "search term"],
        ],
      ]);
    });

    it("encodes filter", () => {
      const result = QUERY.encode({
        query: [{ vector: [0.1] }],
        limit: 5,
        filter: { category: { $eq: "news" } },
      });

      expect(result.filters).toEqual(["category", "Eq", "news"]);
    });

    it("encodes include fields array", () => {
      const result = QUERY.encode({
        query: [{ vector: [0.1] }],
        limit: 5,
        include: ["title", "content"],
      });

      expect(result.include_attributes).toEqual(["title", "content"]);
    });

    it("encodes include as boolean", () => {
      const result = QUERY.encode({
        query: [{ vector: [0.1] }],
        limit: 5,
        include: true,
      });

      expect(result.include_attributes).toBe(true);
    });
  });

  describe("SEARCH_HIT", () => {
    it("decodes row to search hit", () => {
      const result = SEARCH_HIT.decode(
        {
          id: "doc-1",
          $dist: 0.5,
          title: "Test",
          category: "news",
        },
        "my-index",
      );

      expect(result).toEqual({
        id: "doc-1",
        index: "my-index",
        score: -0.5, // negated: distance → similarity
        document: {
          id: "doc-1",
          title: "Test",
          category: "news",
        },
      });
    });

    it("decodes row with vector", () => {
      const result = SEARCH_HIT.decode(
        {
          id: "doc-2",
          $dist: 0.1,
          vector: [0.1, 0.2, 0.3],
        },
        "my-index",
      );

      expect(result.document?.id).toBe("doc-2");
      expect(result.document?.vector).toEqual([0.1, 0.2, 0.3]);
    });

    it("handles missing score", () => {
      const result = SEARCH_HIT.decode(
        {
          id: "doc-3",
        },
        "my-index",
      );

      expect(result.score).toBe(0);
      expect(result.document).toEqual({ id: "doc-3" });
    });

    it("converts numeric id to string", () => {
      const result = SEARCH_HIT.decode(
        {
          id: 123,
          $dist: 0.1,
        },
        "my-index",
      );

      expect(result.id).toBe("123");
      expect(result.document?.id).toBe(123); // document keeps original type
    });
  });
});
