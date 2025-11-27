import { describe, it, expect } from "vitest";
import { SQL_WHERE } from "../where";

describe("SQL_WHERE", () => {
  describe("encode", () => {
    it("returns empty sql when no filter", () => {
      const result = SQL_WHERE.encode({ startIdx: 1 });
      expect(result.sql).toBe("");
      expect(result.params).toEqual([]);
    });

    it("returns empty sql when filter is undefined", () => {
      const result = SQL_WHERE.encode({ filter: undefined, startIdx: 1 });
      expect(result.sql).toBe("");
      expect(result.params).toEqual([]);
    });

    describe("equality shorthand", () => {
      it("handles string equality", () => {
        const result = SQL_WHERE.encode({
          filter: { status: "active" },
          startIdx: 1,
        });
        expect(result.sql).toBe('"status" = $1');
        expect(result.params).toEqual(["active"]);
      });

      it("handles number equality", () => {
        const result = SQL_WHERE.encode({
          filter: { count: 42 },
          startIdx: 1,
        });
        expect(result.sql).toBe('"count" = $1');
        expect(result.params).toEqual([42]);
      });

      it("handles boolean equality", () => {
        const result = SQL_WHERE.encode({
          filter: { active: true },
          startIdx: 1,
        });
        expect(result.sql).toBe('"active" = $1');
        expect(result.params).toEqual([true]);
      });

      it("handles null as IS NULL", () => {
        const result = SQL_WHERE.encode({
          filter: { deleted_at: null },
          startIdx: 1,
        });
        expect(result.sql).toBe('"deleted_at" IS NULL');
        expect(result.params).toEqual([]);
      });

      it("combines multiple fields with AND", () => {
        const result = SQL_WHERE.encode({
          filter: { status: "active", type: "doc" },
          startIdx: 1,
        });
        expect(result.sql).toBe('"status" = $1 AND "type" = $2');
        expect(result.params).toEqual(["active", "doc"]);
      });

      it("respects startIdx for parameter numbering", () => {
        const result = SQL_WHERE.encode({
          filter: { status: "active" },
          startIdx: 5,
        });
        expect(result.sql).toBe('"status" = $5');
        expect(result.params).toEqual(["active"]);
      });
    });

    describe("comparison operators", () => {
      it("handles $eq", () => {
        const result = SQL_WHERE.encode({
          filter: { count: { $eq: 10 } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"count" = $1');
        expect(result.params).toEqual([10]);
      });

      it("handles $neq", () => {
        const result = SQL_WHERE.encode({
          filter: { status: { $neq: "deleted" } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"status" != $1');
        expect(result.params).toEqual(["deleted"]);
      });

      it("handles $gt", () => {
        const result = SQL_WHERE.encode({
          filter: { views: { $gt: 100 } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"views" > $1');
        expect(result.params).toEqual([100]);
      });

      it("handles $gte", () => {
        const result = SQL_WHERE.encode({
          filter: { views: { $gte: 100 } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"views" >= $1');
        expect(result.params).toEqual([100]);
      });

      it("handles $lt", () => {
        const result = SQL_WHERE.encode({
          filter: { price: { $lt: 50 } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"price" < $1');
        expect(result.params).toEqual([50]);
      });

      it("handles $lte", () => {
        const result = SQL_WHERE.encode({
          filter: { price: { $lte: 50 } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"price" <= $1');
        expect(result.params).toEqual([50]);
      });

      it("handles multiple operators on same field", () => {
        const result = SQL_WHERE.encode({
          filter: { price: { $gte: 10, $lte: 100 } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"price" >= $1 AND "price" <= $2');
        expect(result.params).toEqual([10, 100]);
      });
    });

    describe("set operators", () => {
      it("handles $in", () => {
        const result = SQL_WHERE.encode({
          filter: { status: { $in: ["active", "pending"] } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"status" = ANY($1)');
        expect(result.params).toEqual([["active", "pending"]]);
      });

      it("handles $nin", () => {
        const result = SQL_WHERE.encode({
          filter: { status: { $nin: ["deleted", "archived"] } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"status" != ALL($1)');
        expect(result.params).toEqual([["deleted", "archived"]]);
      });
    });

    describe("string operators", () => {
      it("handles $contains", () => {
        const result = SQL_WHERE.encode({
          filter: { title: { $contains: "hello" } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"title" ILIKE $1');
        expect(result.params).toEqual(["%hello%"]);
      });

      it("handles $startsWith", () => {
        const result = SQL_WHERE.encode({
          filter: { name: { $startsWith: "Dr." } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"name" ILIKE $1');
        expect(result.params).toEqual(["Dr.%"]);
      });

      it("handles $endsWith", () => {
        const result = SQL_WHERE.encode({
          filter: { email: { $endsWith: "@example.com" } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"email" ILIKE $1');
        expect(result.params).toEqual(["%@example.com"]);
      });
    });

    describe("existence operators", () => {
      it("handles $exists: true", () => {
        const result = SQL_WHERE.encode({
          filter: { avatar: { $exists: true } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"avatar" IS NOT NULL');
        expect(result.params).toEqual([]);
      });

      it("handles $exists: false", () => {
        const result = SQL_WHERE.encode({
          filter: { avatar: { $exists: false } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"avatar" IS NULL');
        expect(result.params).toEqual([]);
      });
    });

    describe("logical operators", () => {
      it("handles $and", () => {
        const result = SQL_WHERE.encode({
          filter: {
            $and: [{ status: "active" }, { views: { $gt: 100 } }],
          },
          startIdx: 1,
        });
        expect(result.sql).toBe('(("status" = $1) AND ("views" > $2))');
        expect(result.params).toEqual(["active", 100]);
      });

      it("handles $or", () => {
        const result = SQL_WHERE.encode({
          filter: {
            $or: [{ status: "draft" }, { status: "review" }],
          },
          startIdx: 1,
        });
        expect(result.sql).toBe('(("status" = $1) OR ("status" = $2))');
        expect(result.params).toEqual(["draft", "review"]);
      });

      it("handles $not", () => {
        const result = SQL_WHERE.encode({
          filter: {
            $not: { status: "deleted" },
          },
          startIdx: 1,
        });
        expect(result.sql).toBe('NOT ("status" = $1)');
        expect(result.params).toEqual(["deleted"]);
      });

      it("handles nested logical operators", () => {
        const result = SQL_WHERE.encode({
          filter: {
            $and: [
              { type: "article" },
              {
                $or: [{ status: "published" }, { featured: true }],
              },
            ],
          },
          startIdx: 1,
        });
        expect(result.sql).toBe(
          '(("type" = $1) AND ((("status" = $2) OR ("featured" = $3))))',
        );
        expect(result.params).toEqual(["article", "published", true]);
      });
    });

    describe("complex filters", () => {
      it("handles real-world filter", () => {
        const result = SQL_WHERE.encode({
          filter: {
            published: true,
            views: { $gte: 1000 },
            tags: { $in: ["ai", "ml"] },
            $or: [{ featured: true }, { category: "trending" }],
          },
          startIdx: 2, // simulate SELECT using $1
        });

        expect(result.sql).toBe(
          '"published" = $2 AND "views" >= $3 AND "tags" = ANY($4) AND (("featured" = $5) OR ("category" = $6))',
        );
        expect(result.params).toEqual([
          true,
          1000,
          ["ai", "ml"],
          true,
          "trending",
        ]);
      });

      it("skips undefined values", () => {
        const result = SQL_WHERE.encode({
          filter: { status: "active", deleted: undefined },
          startIdx: 1,
        });
        expect(result.sql).toBe('"status" = $1');
        expect(result.params).toEqual(["active"]);
      });
    });

    describe("empty and weird filters", () => {
      it("returns empty sql for empty filter object", () => {
        const result = SQL_WHERE.encode({
          filter: {},
          startIdx: 1,
        });
        expect(result.sql).toBe("");
        expect(result.params).toEqual([]);
      });

      it("skips field when value is undefined", () => {
        const result = SQL_WHERE.encode({
          filter: { field: undefined },
          startIdx: 1,
        });
        expect(result.sql).toBe("");
        expect(result.params).toEqual([]);
      });

      it("handles filter with all undefined values", () => {
        const result = SQL_WHERE.encode({
          filter: { a: undefined, b: undefined, c: undefined },
          startIdx: 1,
        });
        expect(result.sql).toBe("");
        expect(result.params).toEqual([]);
      });
    });

    describe("null semantics", () => {
      it("treats shorthand null as IS NULL", () => {
        const result = SQL_WHERE.encode({
          filter: { field: null },
          startIdx: 1,
        });
        expect(result.sql).toBe('"field" IS NULL');
        expect(result.params).toEqual([]);
      });

      it("treats $eq: null as parameterized equality", () => {
        const result = SQL_WHERE.encode({
          filter: { field: { $eq: null } },
          startIdx: 1,
        });
        // $eq: null uses parameterized query (different from shorthand)
        expect(result.sql).toBe('"field" = $1');
        expect(result.params).toEqual([null]);
      });

      it("treats $neq: null as parameterized inequality", () => {
        const result = SQL_WHERE.encode({
          filter: { field: { $neq: null } },
          startIdx: 1,
        });
        expect(result.sql).toBe('"field" != $1');
        expect(result.params).toEqual([null]);
      });
    });

    describe("empty $in/$nin arrays", () => {
      it("handles $in with empty array", () => {
        const result = SQL_WHERE.encode({
          filter: { status: { $in: [] } },
          startIdx: 1,
        });
        // Empty array is valid - will match no rows
        expect(result.sql).toBe('"status" = ANY($1)');
        expect(result.params).toEqual([[]]);
      });

      it("handles $nin with empty array", () => {
        const result = SQL_WHERE.encode({
          filter: { status: { $nin: [] } },
          startIdx: 1,
        });
        // Empty array is valid - will match all rows
        expect(result.sql).toBe('"status" != ALL($1)');
        expect(result.params).toEqual([[]]);
      });
    });

    describe("deep nesting and param indices", () => {
      it("handles deeply nested $and/$or/$not with high startIdx", () => {
        const result = SQL_WHERE.encode({
          filter: {
            $and: [
              { a: 1 },
              {
                $or: [
                  { b: 2 },
                  {
                    $and: [
                      { c: 3 },
                      { $not: { d: 4 } },
                    ],
                  },
                ],
              },
              { e: 5 },
            ],
          },
          startIdx: 10, // simulate many prior params
        });

        expect(result.sql).toBe(
          '(("a" = $10) AND ((("b" = $11) OR ((("c" = $12) AND (NOT ("d" = $13)))))) AND ("e" = $14))',
        );
        expect(result.params).toEqual([1, 2, 3, 4, 5]);
      });

      it("handles very large startIdx", () => {
        const result = SQL_WHERE.encode({
          filter: { field: "value" },
          startIdx: 50,
        });
        expect(result.sql).toBe('"field" = $50');
        expect(result.params).toEqual(["value"]);
      });
    });

    describe("mixed logical + field ops", () => {
      it("handles top-level field with $or", () => {
        const result = SQL_WHERE.encode({
          filter: {
            type: "article",
            $or: [{ status: "draft" }, { status: "review" }],
          },
          startIdx: 1,
        });
        expect(result.sql).toBe(
          '"type" = $1 AND (("status" = $2) OR ("status" = $3))',
        );
        expect(result.params).toEqual(["article", "draft", "review"]);
      });

      it("handles $and and $or at same level", () => {
        const result = SQL_WHERE.encode({
          filter: {
            $and: [{ a: 1 }, { b: 2 }],
            $or: [{ c: 3 }, { d: 4 }],
          },
          startIdx: 1,
        });
        // Both are processed, joined by implicit AND
        expect(result.sql).toBe(
          '(("a" = $1) AND ("b" = $2)) AND (("c" = $3) OR ("d" = $4))',
        );
        expect(result.params).toEqual([1, 2, 3, 4]);
      });

      it("handles multiple fields with multiple $or clauses", () => {
        const result = SQL_WHERE.encode({
          filter: {
            published: true,
            category: "tech",
            $or: [
              { featured: true },
              { views: { $gt: 1000 } },
            ],
          },
          startIdx: 1,
        });
        expect(result.sql).toBe(
          '"published" = $1 AND "category" = $2 AND (("featured" = $3) OR ("views" > $4))',
        );
        expect(result.params).toEqual([true, "tech", true, 1000]);
      });
    });

    describe("operator edge cases", () => {
      it("handles multiple operators with some undefined", () => {
        const result = SQL_WHERE.encode({
          filter: { field: { $eq: undefined, $gt: 10, $lt: undefined } },
          startIdx: 1,
        });
        // Only $gt should generate SQL (others are undefined)
        expect(result.sql).toBe('"field" > $1');
        expect(result.params).toEqual([10]);
      });

      it("handles all operators undefined", () => {
        const result = SQL_WHERE.encode({
          filter: { field: { $eq: undefined, $gt: undefined } },
          startIdx: 1,
        });
        // No conditions generated
        expect(result.sql).toBe("");
        expect(result.params).toEqual([]);
      });
    });

    describe("field name handling", () => {
      it("quotes field names with spaces", () => {
        const result = SQL_WHERE.encode({
          filter: { "my field": "value" },
          startIdx: 1,
        });
        expect(result.sql).toBe('"my field" = $1');
        expect(result.params).toEqual(["value"]);
      });

      it("quotes field names with special characters", () => {
        const result = SQL_WHERE.encode({
          filter: { "field-name": "value", field_name: "value2" },
          startIdx: 1,
        });
        expect(result.sql).toBe('"field-name" = $1 AND "field_name" = $2');
        expect(result.params).toEqual(["value", "value2"]);
      });

      it("handles values with SQL special characters (parameterized)", () => {
        const result = SQL_WHERE.encode({
          filter: { name: "'; DROP TABLE users; --" },
          startIdx: 1,
        });
        // Value is parameterized, not interpolated - safe from injection
        expect(result.sql).toBe('"name" = $1');
        expect(result.params).toEqual(["'; DROP TABLE users; --"]);
      });
    });

    describe("empty logical operators", () => {
      it("handles empty $and array", () => {
        const result = SQL_WHERE.encode({
          filter: { $and: [] },
          startIdx: 1,
        });
        expect(result.sql).toBe("");
        expect(result.params).toEqual([]);
      });

      it("handles empty $or array", () => {
        const result = SQL_WHERE.encode({
          filter: { $or: [] },
          startIdx: 1,
        });
        expect(result.sql).toBe("");
        expect(result.params).toEqual([]);
      });

      it("handles $and with empty filter objects", () => {
        const result = SQL_WHERE.encode({
          filter: { $and: [{}, { status: "active" }, {}] },
          startIdx: 1,
        });
        // Empty objects produce no SQL, only non-empty ones contribute
        expect(result.sql).toBe('(("status" = $1))');
        expect(result.params).toEqual(["active"]);
      });
    });
  });

  describe("decode", () => {
    it("throws not implemented", () => {
      expect(() => SQL_WHERE.decode({} as any)).toThrow(
        "SQL_WHERE.decode not implemented",
      );
    });
  });
});
