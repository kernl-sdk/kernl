import { describe, it, expect } from "vitest";
import { SEARCH_HIT } from "../hit";

describe("SEARCH_HIT", () => {
  describe("decode", () => {
    it("converts basic row to SearchHit", () => {
      const row = {
        id: "doc-123",
        score: 0.95,
        title: "Hello World",
        content: "Some content",
      };

      const result = SEARCH_HIT.decode(row, "docs");

      expect(result).toEqual({
        id: "doc-123",
        index: "docs",
        score: 0.95,
        document: {
          title: "Hello World",
          content: "Some content",
        },
      });
    });

    it("converts id to string", () => {
      const row = { id: 123, score: 0.5 };
      const result = SEARCH_HIT.decode(row, "docs");
      expect(result.id).toBe("123");
    });

    it("defaults score to 0 when not a number", () => {
      const row = { id: "1", score: null };
      const result = SEARCH_HIT.decode(row, "docs");
      expect(result.score).toBe(0);
    });

    it("defaults score to 0 when undefined", () => {
      const row = { id: "1" };
      const result = SEARCH_HIT.decode(row, "docs");
      expect(result.score).toBe(0);
    });

    it("returns undefined document when no fields", () => {
      const row = { id: "1", score: 0.5 };
      const result = SEARCH_HIT.decode(row, "docs");
      expect(result.document).toBeUndefined();
    });

    describe("with binding", () => {
      const binding = {
        schema: "public",
        table: "documents",
        pkey: "id",
        fields: {
          title: { column: "doc_title", type: "string" as const },
          content: { column: "doc_content", type: "string" as const },
          embedding: {
            column: "vec",
            type: "vector" as const,
            dimensions: 3,
          },
        },
      };

      it("maps columns to logical field names", () => {
        const row = {
          id: "1",
          score: 0.9,
          doc_title: "Hello",
          doc_content: "World",
          vec: [0.1, 0.2, 0.3],
        };

        const result = SEARCH_HIT.decode(row, "docs", binding);

        expect(result.document).toEqual({
          title: "Hello",
          content: "World",
          embedding: [0.1, 0.2, 0.3],
        });
      });

      it("only includes fields defined in binding", () => {
        const row = {
          id: "1",
          score: 0.9,
          doc_title: "Hello",
          extra_col: "should be ignored",
          internal_field: "also ignored",
        };

        const result = SEARCH_HIT.decode(row, "docs", binding);

        expect(result.document).toEqual({
          title: "Hello",
        });
        expect((result.document as any)?.extra_col).toBeUndefined();
        expect((result.document as any)?.internal_field).toBeUndefined();
      });

      it("handles missing columns gracefully", () => {
        const row = {
          id: "1",
          score: 0.9,
          doc_title: "Hello",
          // doc_content and vec are missing
        };

        const result = SEARCH_HIT.decode(row, "docs", binding);

        expect(result.document).toEqual({
          title: "Hello",
        });
      });

      it("returns undefined document when no bound fields present", () => {
        const row = {
          id: "1",
          score: 0.9,
          unrelated_column: "value",
        };

        const result = SEARCH_HIT.decode(row, "docs", binding);

        expect(result.document).toBeUndefined();
      });
    });

    describe("with TDocument generic", () => {
      interface Document {
        title: string;
        views: number;
      }

      it("types document correctly", () => {
        const row = {
          id: "1",
          score: 0.9,
          title: "Hello",
          views: 100,
        };

        const result = SEARCH_HIT.decode<Document>(row, "docs");

        // TypeScript should allow accessing these fields
        expect(result.document?.title).toBe("Hello");
        expect(result.document?.views).toBe(100);
      });
    });
  });

  describe("encode", () => {
    it("throws not implemented", () => {
      expect(() => SEARCH_HIT.encode({} as any)).toThrow(
        "SEARCH_HIT.encode: not implemented",
      );
    });
  });
});
