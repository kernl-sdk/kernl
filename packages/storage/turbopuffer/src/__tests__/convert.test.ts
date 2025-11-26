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
    it("encodes document with scalar fields", () => {
      const result = DOCUMENT.encode({
        id: "doc-1",
        index: "my-index",
        fields: {
          title: "Hello",
          count: 42,
          active: true,
        },
      });

      expect(result).toEqual({
        id: "doc-1",
        title: "Hello",
        count: 42,
        active: true,
      });
    });

    it("encodes document with vector field", () => {
      const result = DOCUMENT.encode({
        id: "doc-2",
        index: "my-index",
        fields: {
          vector: { kind: "vector", values: [0.1, 0.2, 0.3] },
        },
      });

      expect(result).toEqual({
        id: "doc-2",
        vector: [0.1, 0.2, 0.3],
      });
    });
  });

  describe("PATCH", () => {
    it("encodes patch with field updates", () => {
      const result = PATCH.encode({
        id: "doc-1",
        index: "my-index",
        fields: {
          title: "Updated",
          count: 100,
        },
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
        index: "my-index",
        fields: {
          title: "Keep this",
          description: null,
        },
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
        index: "my-index",
        fields: {
          vector: { kind: "vector", values: [0.5, 0.6] },
        },
      });

      expect(result).toEqual({
        id: "doc-1",
        vector: [0.5, 0.6],
      });
    });
  });

  describe("FILTER", () => {
    // Table-driven tests for all field operators
    const fieldOpCases: Array<{
      name: string;
      input: { field: string; op: string; value: unknown };
      expected: unknown[];
    }> = [
      // Equality
      { name: "eq string", input: { field: "f", op: "eq", value: "x" }, expected: ["f", "Eq", "x"] },
      { name: "eq number", input: { field: "f", op: "eq", value: 42 }, expected: ["f", "Eq", 42] },
      { name: "eq boolean", input: { field: "f", op: "eq", value: true }, expected: ["f", "Eq", true] },
      { name: "eq null", input: { field: "f", op: "eq", value: null }, expected: ["f", "Eq", null] },
      { name: "neq", input: { field: "f", op: "neq", value: "x" }, expected: ["f", "NotEq", "x"] },

      // Comparison
      { name: "gt", input: { field: "f", op: "gt", value: 10 }, expected: ["f", "Gt", 10] },
      { name: "gte", input: { field: "f", op: "gte", value: 10 }, expected: ["f", "Gte", 10] },
      { name: "lt", input: { field: "f", op: "lt", value: 10 }, expected: ["f", "Lt", 10] },
      { name: "lte", input: { field: "f", op: "lte", value: 10 }, expected: ["f", "Lte", 10] },

      // Set membership
      { name: "in", input: { field: "f", op: "in", value: ["a", "b"] }, expected: ["f", "In", ["a", "b"]] },
      { name: "nin", input: { field: "f", op: "nin", value: ["a", "b"] }, expected: ["f", "NotIn", ["a", "b"]] },

      // Array operations
      { name: "contains", input: { field: "f", op: "contains", value: "x" }, expected: ["f", "Contains", "x"] },
      { name: "contains_any", input: { field: "f", op: "contains_any", value: ["a", "b"] }, expected: ["f", "ContainsAny", ["a", "b"]] },
      { name: "contains_all", input: { field: "f", op: "contains_all", value: ["a", "b"] }, expected: ["f", "ContainsAny", ["a", "b"]] },

      // String patterns (converted to Glob)
      { name: "starts_with", input: { field: "f", op: "starts_with", value: "pre" }, expected: ["f", "Glob", "pre*"] },
      { name: "ends_with", input: { field: "f", op: "ends_with", value: "suf" }, expected: ["f", "Glob", "*suf"] },
    ];

    it.each(fieldOpCases)("encodes $name filter", ({ input, expected }) => {
      const result = FILTER.encode(input as never);
      expect(result).toEqual(expected);
    });

    // Existence filters
    const existsCases = [
      { name: "exists", op: "exists", expected: ["f", "NotEq", null] },
      { name: "not_exists", op: "not_exists", expected: ["f", "Eq", null] },
    ];

    it.each(existsCases)("encodes $name filter", ({ op, expected }) => {
      const result = FILTER.encode({ field: "f", op } as never);
      expect(result).toEqual(expected);
    });

    // Logical operators
    it("encodes AND filter", () => {
      const result = FILTER.encode({
        and: [
          { field: "a", op: "eq", value: 1 },
          { field: "b", op: "eq", value: 2 },
        ],
      });

      expect(result).toEqual([
        "And",
        [
          ["a", "Eq", 1],
          ["b", "Eq", 2],
        ],
      ]);
    });

    it("encodes OR filter", () => {
      const result = FILTER.encode({
        or: [
          { field: "status", op: "eq", value: "active" },
          { field: "status", op: "eq", value: "pending" },
        ],
      });

      expect(result).toEqual([
        "Or",
        [
          ["status", "Eq", "active"],
          ["status", "Eq", "pending"],
        ],
      ]);
    });

    it("encodes NOT filter", () => {
      const result = FILTER.encode({
        not: { field: "deleted", op: "eq", value: true },
      });

      expect(result).toEqual(["Not", ["deleted", "Eq", true]]);
    });

    it("encodes deeply nested filters", () => {
      const result = FILTER.encode({
        and: [
          { field: "active", op: "eq", value: true },
          {
            or: [
              { field: "role", op: "eq", value: "admin" },
              {
                and: [
                  { field: "role", op: "eq", value: "user" },
                  { field: "verified", op: "eq", value: true },
                ],
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

    it("encodes empty AND filter", () => {
      const result = FILTER.encode({ and: [] });
      expect(result).toEqual(["And", []]);
    });

    it("encodes empty OR filter", () => {
      const result = FILTER.encode({ or: [] });
      expect(result).toEqual(["Or", []]);
    });
  });

  describe("QUERY", () => {
    it("encodes vector search query", () => {
      const result = QUERY.encode({
        index: "test",
        vector: [0.1, 0.2, 0.3],
        topK: 10,
      });

      expect(result.rank_by).toEqual(["vector", "ANN", [0.1, 0.2, 0.3]]);
      expect(result.top_k).toBe(10);
    });

    it("encodes text search query", () => {
      const result = QUERY.encode({
        index: "test",
        text: "hello world",
        textFields: ["content"],
        topK: 5,
      });

      expect(result.rank_by).toEqual(["content", "BM25", "hello world"]);
      expect(result.top_k).toBe(5);
    });

    it("encodes multi-field text search as Sum", () => {
      const result = QUERY.encode({
        index: "test",
        text: "search term",
        textFields: ["title", "body"],
        topK: 10,
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
        index: "test",
        vector: [0.1],
        topK: 5,
        filter: { field: "category", op: "eq", value: "news" },
      });

      expect(result.filters).toEqual(["category", "Eq", "news"]);
    });

    it("encodes include fields array", () => {
      const result = QUERY.encode({
        index: "test",
        vector: [0.1],
        topK: 5,
        include: ["title", "content"],
      });

      expect(result.include_attributes).toEqual(["title", "content"]);
    });

    it("encodes include as boolean", () => {
      const result = QUERY.encode({
        index: "test",
        vector: [0.1],
        topK: 5,
        include: true,
      });

      expect(result.include_attributes).toBe(true);
    });

    it("adds vector to include when includeVectors is true", () => {
      const result = QUERY.encode({
        index: "test",
        vector: [0.1],
        topK: 5,
        include: ["title"],
        includeVectors: true,
      });

      expect(result.include_attributes).toEqual(["title", "vector"]);
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
        score: 0.5,
        fields: {
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

      expect(result.vector).toEqual([0.1, 0.2, 0.3]);
    });

    it("handles missing score", () => {
      const result = SEARCH_HIT.decode(
        {
          id: "doc-3",
        },
        "my-index",
      );

      expect(result.score).toBe(0);
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
    });
  });
});
