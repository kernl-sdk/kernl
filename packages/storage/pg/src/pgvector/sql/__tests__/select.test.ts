import { describe, it, expect } from "vitest";
import { SQL_SELECT } from "../select";

describe("SQL_SELECT", () => {
  describe("encode", () => {
    it("returns id and constant score when no signals", () => {
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [],
      });

      expect(result.sql).toBe('"id" as id, 1 as score');
      expect(result.params).toEqual([]);
    });

    it("uses custom pkey column", () => {
      const result = SQL_SELECT.encode({
        pkey: "doc_id",
        signals: [],
      });

      expect(result.sql).toBe('"doc_id" as id, 1 as score');
    });

    it("builds cosine similarity score for vector signal", () => {
      const vector = [0.1, 0.2, 0.3];
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [{ embedding: vector }],
      });

      expect(result.sql).toBe(
        '"id" as id, 1 - ("embedding" <=> $1::vector) as score',
      );
      expect(result.params).toEqual([JSON.stringify(vector)]);
    });

    it("uses binding to map field to column", () => {
      const vector = [0.1, 0.2, 0.3];
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [{ embedding: vector }],
        binding: {
          schema: "public",
          table: "docs",
          pkey: "id",
          fields: {
            embedding: {
              column: "vec_col",
              type: "vector",
              dimensions: 3,
              similarity: "cosine",
            },
          },
        },
      });

      expect(result.sql).toBe(
        '"id" as id, 1 - ("vec_col" <=> $1::vector) as score, "vec_col"',
      );
    });

    it("builds euclidean distance score", () => {
      const vector = [0.1, 0.2, 0.3];
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [{ embedding: vector }],
        binding: {
          schema: "public",
          table: "docs",
          pkey: "id",
          fields: {
            embedding: {
              column: "embedding",
              type: "vector",
              dimensions: 3,
              similarity: "euclidean",
            },
          },
        },
      });

      expect(result.sql).toBe(
        '"id" as id, 1 / (1 + ("embedding" <-> $1::vector)) as score, "embedding"',
      );
    });

    it("builds dot product score", () => {
      const vector = [0.1, 0.2, 0.3];
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [{ embedding: vector }],
        binding: {
          schema: "public",
          table: "docs",
          pkey: "id",
          fields: {
            embedding: {
              column: "embedding",
              type: "vector",
              dimensions: 3,
              similarity: "dot_product",
            },
          },
        },
      });

      expect(result.sql).toBe(
        '"id" as id, -("embedding" <#> $1::vector) as score, "embedding"',
      );
    });

    it("ignores non-vector signals", () => {
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [{ content: "search text" }],
      });

      // String signals are not vectors, so no vector scoring
      expect(result.sql).toBe('"id" as id, 1 as score');
      expect(result.params).toEqual([]);
    });

    it("finds vector signal among mixed signals", () => {
      const vector = [0.1, 0.2, 0.3];
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [
          { content: "search text", weight: 0.3 },
          { embedding: vector, weight: 0.7 },
        ],
      });

      expect(result.sql).toBe(
        '"id" as id, 1 - ("embedding" <=> $1::vector) as score',
      );
      expect(result.params).toEqual([JSON.stringify(vector)]);
    });

    it("ignores weight field when detecting vector", () => {
      const vector = [0.1, 0.2, 0.3];
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [{ embedding: vector, weight: 0.5 }],
      });

      expect(result.sql).toBe(
        '"id" as id, 1 - ("embedding" <=> $1::vector) as score',
      );
    });

    describe("binding edge cases", () => {
      it("falls back to field name when binding exists but field not in fields", () => {
        const vector = [0.1, 0.2, 0.3];
        const result = SQL_SELECT.encode({
          pkey: "id",
          signals: [{ embedding: vector }],
          binding: {
            schema: "public",
            table: "docs",
            pkey: "id",
            fields: {
              other_field: {
                column: "other_col",
                type: "vector",
                dimensions: 3,
                similarity: "cosine",
              },
            },
          },
        });

        // embedding not in binding.fields, so uses "embedding" as column name
        // but other_field column is still selected
        expect(result.sql).toBe(
          '"id" as id, 1 - ("embedding" <=> $1::vector) as score, "other_col"',
        );
      });

      it("defaults to cosine when binding field has no similarity", () => {
        const vector = [0.1, 0.2, 0.3];
        const result = SQL_SELECT.encode({
          pkey: "id",
          signals: [{ embedding: vector }],
          binding: {
            schema: "public",
            table: "docs",
            fields: {
              embedding: {
                column: "vec_col",
                type: "vector",
                dimensions: 3,
                // similarity intentionally omitted
              },
            },
          } as any, // cast to bypass type check for test
        });

        expect(result.sql).toBe(
          '"id" as id, 1 - ("vec_col" <=> $1::vector) as score, "vec_col"',
        );
      });
    });

    describe("multiple vector signals", () => {
      it("uses only the first vector signal", () => {
        const vec1 = [0.1, 0.2, 0.3];
        const vec2 = [0.4, 0.5, 0.6];
        const result = SQL_SELECT.encode({
          pkey: "id",
          signals: [{ embedding1: vec1 }, { embedding2: vec2 }],
        });

        // Should use embedding1, not embedding2
        expect(result.sql).toBe(
          '"id" as id, 1 - ("embedding1" <=> $1::vector) as score',
        );
        expect(result.params).toEqual([JSON.stringify(vec1)]);
      });

      it("uses first vector field within a single signal object", () => {
        const vec1 = [0.1, 0.2, 0.3];
        const vec2 = [0.4, 0.5, 0.6];
        const result = SQL_SELECT.encode({
          pkey: "id",
          signals: [{ embedding1: vec1, embedding2: vec2 }],
        });

        // Object iteration order - first encountered wins
        expect(result.params).toHaveLength(1);
      });
    });

    describe("malformed signals", () => {
      it("treats empty signal object as no vector signal", () => {
        const result = SQL_SELECT.encode({
          pkey: "id",
          signals: [{}],
        });

        expect(result.sql).toBe('"id" as id, 1 as score');
        expect(result.params).toEqual([]);
      });

      it("treats signal with only weight as no vector signal", () => {
        const result = SQL_SELECT.encode({
          pkey: "id",
          signals: [{ weight: 0.5 }],
        });

        expect(result.sql).toBe('"id" as id, 1 as score');
        expect(result.params).toEqual([]);
      });

      it("handles empty vector array", () => {
        const result = SQL_SELECT.encode({
          pkey: "id",
          signals: [{ embedding: [] }],
        });

        // Empty array is still detected as vector, generates SQL with empty array
        expect(result.sql).toBe(
          '"id" as id, 1 - ("embedding" <=> $1::vector) as score',
        );
        expect(result.params).toEqual(["[]"]);
      });

      it("handles vector with extra non-vector props", () => {
        const vector = [0.1, 0.2, 0.3];
        const result = SQL_SELECT.encode({
          pkey: "id",
          signals: [{ embedding: vector, metadata: "ignored", count: 42 }],
        });

        // Only the array field is used for vector scoring
        expect(result.sql).toBe(
          '"id" as id, 1 - ("embedding" <=> $1::vector) as score',
        );
        expect(result.params).toEqual([JSON.stringify(vector)]);
      });
    });
  });

  describe("include", () => {
    const binding = {
      schema: "public",
      table: "docs",
      pkey: "id",
      fields: {
        title: { column: "title", type: "string" as const },
        content: { column: "content", type: "string" as const },
        embedding: {
          column: "vec",
          type: "vector" as const,
          dimensions: 3,
          similarity: "cosine" as const,
        },
      },
    };

    it("selects all columns when include is undefined", () => {
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [],
        binding,
      });

      expect(result.sql).toBe(
        '"id" as id, 1 as score, "title", "content", "vec"',
      );
    });

    it("selects all columns when include is true", () => {
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [],
        binding,
        include: true,
      });

      expect(result.sql).toBe(
        '"id" as id, 1 as score, "title", "content", "vec"',
      );
    });

    it("selects no columns when include is false", () => {
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [],
        binding,
        include: false,
      });

      expect(result.sql).toBe('"id" as id, 1 as score');
    });

    it("selects only specified columns when include is array", () => {
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [],
        binding,
        include: ["title"],
      });

      expect(result.sql).toBe('"id" as id, 1 as score, "title"');
    });

    it("ignores fields not in binding", () => {
      const result = SQL_SELECT.encode({
        pkey: "id",
        signals: [],
        binding,
        include: ["title", "nonexistent"],
      });

      expect(result.sql).toBe('"id" as id, 1 as score, "title"');
    });
  });

  describe("decode", () => {
    it("throws not implemented", () => {
      expect(() => SQL_SELECT.decode({} as any)).toThrow(
        "SQL_SELECT.decode not implemented",
      );
    });
  });
});
