import { describe, it, expect } from "vitest";
import { SQL_ORDER } from "../order";

describe("SQL_ORDER", () => {
  describe("encode", () => {
    it("returns score DESC when no signals or orderBy", () => {
      const result = SQL_ORDER.encode({
        signals: [],
      });
      expect(result.sql).toBe("score DESC");
    });

    describe("explicit orderBy", () => {
      it("handles orderBy with default direction (desc)", () => {
        const result = SQL_ORDER.encode({
          signals: [],
          orderBy: { field: "created_at" },
        });
        expect(result.sql).toBe('"created_at" DESC');
      });

      it("handles orderBy with asc direction", () => {
        const result = SQL_ORDER.encode({
          signals: [],
          orderBy: { field: "name", direction: "asc" },
        });
        expect(result.sql).toBe('"name" ASC');
      });

      it("handles orderBy with desc direction", () => {
        const result = SQL_ORDER.encode({
          signals: [],
          orderBy: { field: "views", direction: "desc" },
        });
        expect(result.sql).toBe('"views" DESC');
      });

      it("orderBy takes precedence over vector signals", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [0.1, 0.2, 0.3] }],
          orderBy: { field: "created_at", direction: "desc" },
        });
        expect(result.sql).toBe('"created_at" DESC');
      });
    });

    describe("vector ordering", () => {
      it("orders by cosine distance (default)", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [0.1, 0.2, 0.3] }],
        });
        expect(result.sql).toBe('"embedding" <=> $1::vector');
      });

      it("uses binding to map field to column", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [0.1, 0.2, 0.3] }],
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
        expect(result.sql).toBe('"vec_col" <=> $1::vector');
      });

      it("orders by euclidean distance", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [0.1, 0.2, 0.3] }],
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
        expect(result.sql).toBe('"embedding" <-> $1::vector');
      });

      it("orders by dot product distance", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [0.1, 0.2, 0.3] }],
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
        expect(result.sql).toBe('"embedding" <#> $1::vector');
      });

      it("ignores non-vector signals", () => {
        const result = SQL_ORDER.encode({
          signals: [{ content: "search text" }],
        });
        expect(result.sql).toBe("score DESC");
      });

      it("finds vector signal among mixed signals", () => {
        const result = SQL_ORDER.encode({
          signals: [
            { content: "search text", weight: 0.3 },
            { embedding: [0.1, 0.2, 0.3], weight: 0.7 },
          ],
        });
        expect(result.sql).toBe('"embedding" <=> $1::vector');
      });
    });

    describe("binding edge cases", () => {
      it("falls back to field name when binding exists but field not in fields", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [0.1, 0.2, 0.3] }],
          binding: {
            schema: "public",
            table: "docs",
            pkey: "id",
            fields: {
              other_field: {
                column: "other_col",
                type: "vector",
                dimensions: 3,
                similarity: "euclidean",
              },
            },
          },
        });

        // embedding not in binding.fields, uses field name and defaults to cosine
        expect(result.sql).toBe('"embedding" <=> $1::vector');
      });

      it("defaults to cosine when binding field has no similarity", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [0.1, 0.2, 0.3] }],
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

        expect(result.sql).toBe('"vec_col" <=> $1::vector');
      });
    });

    describe("multiple vector signals", () => {
      it("uses only the first vector signal for ordering", () => {
        const result = SQL_ORDER.encode({
          signals: [
            { embedding1: [0.1, 0.2, 0.3] },
            { embedding2: [0.4, 0.5, 0.6] },
          ],
        });

        // Should use embedding1, not embedding2
        expect(result.sql).toBe('"embedding1" <=> $1::vector');
      });

      it("uses first vector field within a single signal object", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding1: [0.1, 0.2], embedding2: [0.3, 0.4] }],
        });

        // Object iteration order - first encountered wins
        expect(result.sql).toMatch(/\$1::vector/);
      });
    });

    describe("consistency with SELECT", () => {
      it("uses same $1 placeholder as SELECT for vector param", () => {
        // ORDER BY always references $1::vector when there's a vector signal
        // This must stay in sync with SELECT which puts vector at $1
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [0.1, 0.2, 0.3] }],
        });

        expect(result.sql).toBe('"embedding" <=> $1::vector');
        // No params returned - ORDER BY reuses SELECT's $1
      });
    });

    describe("malformed signals", () => {
      it("treats empty signal object as no vector signal", () => {
        const result = SQL_ORDER.encode({
          signals: [{}],
        });

        expect(result.sql).toBe("score DESC");
      });

      it("treats signal with only weight as no vector signal", () => {
        const result = SQL_ORDER.encode({
          signals: [{ weight: 0.5 }],
        });

        expect(result.sql).toBe("score DESC");
      });

      it("handles empty vector array", () => {
        const result = SQL_ORDER.encode({
          signals: [{ embedding: [] }],
        });

        // Empty array is still detected as vector
        expect(result.sql).toBe('"embedding" <=> $1::vector');
      });
    });
  });

  describe("decode", () => {
    it("throws not implemented", () => {
      expect(() => SQL_ORDER.decode({} as any)).toThrow(
        "SQL_ORDER.decode not implemented",
      );
    });
  });
});
