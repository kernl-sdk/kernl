/**
 * Comprehensive unit tests for filter conversion.
 *
 * Tests all filter operators across scalar types, logical composition,
 * edge cases, and error conditions.
 */

import { describe, it, expect } from "vitest";

import { FILTER } from "../convert/filter";

describe("FILTER", () => {
  // ============================================================
  // EQUALITY OPERATORS
  // ============================================================

  describe("equality operators", () => {
    describe("$eq / shorthand equality", () => {
      it("encodes string equality (shorthand)", () => {
        expect(FILTER.encode({ status: "active" })).toEqual([
          "status",
          "Eq",
          "active",
        ]);
      });

      it("encodes string equality (explicit $eq)", () => {
        expect(FILTER.encode({ status: { $eq: "active" } })).toEqual([
          "status",
          "Eq",
          "active",
        ]);
      });

      it("encodes number equality", () => {
        expect(FILTER.encode({ count: 42 })).toEqual(["count", "Eq", 42]);
        expect(FILTER.encode({ count: { $eq: 42 } })).toEqual([
          "count",
          "Eq",
          42,
        ]);
      });

      it("encodes zero", () => {
        expect(FILTER.encode({ count: 0 })).toEqual(["count", "Eq", 0]);
      });

      it("encodes negative numbers", () => {
        expect(FILTER.encode({ temp: -10 })).toEqual(["temp", "Eq", -10]);
      });

      it("encodes floating point numbers", () => {
        expect(FILTER.encode({ score: 3.14 })).toEqual(["score", "Eq", 3.14]);
      });

      it("encodes boolean true", () => {
        expect(FILTER.encode({ enabled: true })).toEqual([
          "enabled",
          "Eq",
          true,
        ]);
      });

      it("encodes boolean false", () => {
        expect(FILTER.encode({ enabled: false })).toEqual([
          "enabled",
          "Eq",
          false,
        ]);
      });

      it("encodes null", () => {
        expect(FILTER.encode({ deletedAt: null })).toEqual([
          "deletedAt",
          "Eq",
          null,
        ]);
      });

      it("encodes empty string", () => {
        expect(FILTER.encode({ name: "" })).toEqual(["name", "Eq", ""]);
      });
    });

    describe("$neq", () => {
      it("encodes string not-equal", () => {
        expect(FILTER.encode({ status: { $neq: "deleted" } })).toEqual([
          "status",
          "NotEq",
          "deleted",
        ]);
      });

      it("encodes number not-equal", () => {
        expect(FILTER.encode({ count: { $neq: 0 } })).toEqual([
          "count",
          "NotEq",
          0,
        ]);
      });

      it("encodes boolean not-equal", () => {
        expect(FILTER.encode({ active: { $neq: false } })).toEqual([
          "active",
          "NotEq",
          false,
        ]);
      });

      it("encodes null not-equal (field exists)", () => {
        expect(FILTER.encode({ field: { $neq: null } })).toEqual([
          "field",
          "NotEq",
          null,
        ]);
      });
    });
  });

  // ============================================================
  // COMPARISON OPERATORS
  // ============================================================

  describe("comparison operators", () => {
    describe("$gt (greater than)", () => {
      it("encodes $gt with positive number", () => {
        expect(FILTER.encode({ views: { $gt: 1000 } })).toEqual([
          "views",
          "Gt",
          1000,
        ]);
      });

      it("encodes $gt with zero", () => {
        expect(FILTER.encode({ count: { $gt: 0 } })).toEqual([
          "count",
          "Gt",
          0,
        ]);
      });

      it("encodes $gt with negative number", () => {
        expect(FILTER.encode({ temp: { $gt: -10 } })).toEqual([
          "temp",
          "Gt",
          -10,
        ]);
      });

      it("encodes $gt with float", () => {
        expect(FILTER.encode({ rating: { $gt: 4.5 } })).toEqual([
          "rating",
          "Gt",
          4.5,
        ]);
      });
    });

    describe("$gte (greater than or equal)", () => {
      it("encodes $gte with number", () => {
        expect(FILTER.encode({ views: { $gte: 100 } })).toEqual([
          "views",
          "Gte",
          100,
        ]);
      });

      it("encodes $gte with zero", () => {
        expect(FILTER.encode({ count: { $gte: 0 } })).toEqual([
          "count",
          "Gte",
          0,
        ]);
      });
    });

    describe("$lt (less than)", () => {
      it("encodes $lt with number", () => {
        expect(FILTER.encode({ age: { $lt: 18 } })).toEqual(["age", "Lt", 18]);
      });

      it("encodes $lt with negative number", () => {
        expect(FILTER.encode({ balance: { $lt: -100 } })).toEqual([
          "balance",
          "Lt",
          -100,
        ]);
      });
    });

    describe("$lte (less than or equal)", () => {
      it("encodes $lte with number", () => {
        expect(FILTER.encode({ priority: { $lte: 5 } })).toEqual([
          "priority",
          "Lte",
          5,
        ]);
      });
    });

    describe("combined comparisons", () => {
      it("encodes range filter (gt + lt on same field)", () => {
        const result = FILTER.encode({
          price: { $gt: 10, $lt: 100 },
        });
        expect(result).toEqual([
          "And",
          [
            ["price", "Gt", 10],
            ["price", "Lt", 100],
          ],
        ]);
      });

      it("encodes inclusive range filter (gte + lte)", () => {
        const result = FILTER.encode({
          rating: { $gte: 1, $lte: 5 },
        });
        expect(result).toEqual([
          "And",
          [
            ["rating", "Gte", 1],
            ["rating", "Lte", 5],
          ],
        ]);
      });
    });
  });

  // ============================================================
  // SET MEMBERSHIP OPERATORS
  // ============================================================

  describe("set membership operators", () => {
    describe("$in", () => {
      it("encodes $in with string array", () => {
        expect(
          FILTER.encode({ status: { $in: ["active", "pending"] } }),
        ).toEqual(["status", "In", ["active", "pending"]]);
      });

      it("encodes $in with number array", () => {
        expect(FILTER.encode({ priority: { $in: [1, 2, 3] } })).toEqual([
          "priority",
          "In",
          [1, 2, 3],
        ]);
      });

      it("encodes $in with single element", () => {
        expect(FILTER.encode({ status: { $in: ["active"] } })).toEqual([
          "status",
          "In",
          ["active"],
        ]);
      });

      it("encodes $in with empty array", () => {
        expect(FILTER.encode({ status: { $in: [] } })).toEqual([
          "status",
          "In",
          [],
        ]);
      });

      it("encodes $in with mixed types", () => {
        expect(FILTER.encode({ value: { $in: [1, "two", true] } })).toEqual([
          "value",
          "In",
          [1, "two", true],
        ]);
      });
    });

    describe("$nin", () => {
      it("encodes $nin with string array", () => {
        expect(
          FILTER.encode({ status: { $nin: ["deleted", "archived"] } }),
        ).toEqual(["status", "NotIn", ["deleted", "archived"]]);
      });

      it("encodes $nin with number array", () => {
        expect(FILTER.encode({ code: { $nin: [0, -1] } })).toEqual([
          "code",
          "NotIn",
          [0, -1],
        ]);
      });

      it("encodes $nin with empty array", () => {
        expect(FILTER.encode({ status: { $nin: [] } })).toEqual([
          "status",
          "NotIn",
          [],
        ]);
      });
    });
  });

  // ============================================================
  // STRING PATTERN OPERATORS
  // ============================================================

  describe("string pattern operators", () => {
    describe("$startsWith", () => {
      it("encodes $startsWith as Glob prefix", () => {
        expect(FILTER.encode({ name: { $startsWith: "john" } })).toEqual([
          "name",
          "Glob",
          "john*",
        ]);
      });

      it("encodes $startsWith with empty string", () => {
        expect(FILTER.encode({ name: { $startsWith: "" } })).toEqual([
          "name",
          "Glob",
          "*",
        ]);
      });

      it("encodes $startsWith with special characters", () => {
        expect(FILTER.encode({ path: { $startsWith: "/api/v1" } })).toEqual([
          "path",
          "Glob",
          "/api/v1*",
        ]);
      });
    });

    describe("$endsWith", () => {
      it("encodes $endsWith as Glob suffix", () => {
        expect(FILTER.encode({ email: { $endsWith: "@example.com" } })).toEqual([
          "email",
          "Glob",
          "*@example.com",
        ]);
      });

      it("encodes $endsWith with empty string", () => {
        expect(FILTER.encode({ name: { $endsWith: "" } })).toEqual([
          "name",
          "Glob",
          "*",
        ]);
      });
    });

    describe("$contains", () => {
      it("encodes $contains for array membership", () => {
        expect(FILTER.encode({ tags: { $contains: "important" } })).toEqual([
          "tags",
          "Contains",
          "important",
        ]);
      });

      it("encodes $contains with number", () => {
        expect(FILTER.encode({ ids: { $contains: 42 } })).toEqual([
          "ids",
          "Contains",
          42,
        ]);
      });
    });
  });

  // ============================================================
  // EXISTENCE OPERATORS
  // ============================================================

  describe("existence operators", () => {
    describe("$exists: true (field is not null)", () => {
      it("encodes $exists: true as NotEq null", () => {
        expect(FILTER.encode({ optionalField: { $exists: true } })).toEqual([
          "optionalField",
          "NotEq",
          null,
        ]);
      });
    });

    describe("$exists: false (field is null)", () => {
      it("encodes $exists: false as Eq null", () => {
        expect(FILTER.encode({ optionalField: { $exists: false } })).toEqual([
          "optionalField",
          "Eq",
          null,
        ]);
      });
    });
  });

  // ============================================================
  // LOGICAL OPERATORS
  // ============================================================

  describe("logical operators", () => {
    describe("implicit AND (multiple fields)", () => {
      it("encodes two fields as AND", () => {
        const result = FILTER.encode({
          status: "active",
          views: { $gte: 100 },
        });
        expect(result).toEqual([
          "And",
          [
            ["status", "Eq", "active"],
            ["views", "Gte", 100],
          ],
        ]);
      });

      it("encodes three fields as AND", () => {
        const result = FILTER.encode({
          a: 1,
          b: 2,
          c: 3,
        });
        expect(result).toEqual([
          "And",
          [
            ["a", "Eq", 1],
            ["b", "Eq", 2],
            ["c", "Eq", 3],
          ],
        ]);
      });
    });

    describe("$and", () => {
      it("encodes explicit $and with two conditions", () => {
        const result = FILTER.encode({
          $and: [{ status: "active" }, { views: { $gte: 100 } }],
        });
        expect(result).toEqual([
          "And",
          [
            ["status", "Eq", "active"],
            ["views", "Gte", 100],
          ],
        ]);
      });

      it("encodes $and with single condition (unwraps)", () => {
        const result = FILTER.encode({
          $and: [{ status: "active" }],
        });
        // Single item AND should be unwrapped
        expect(result).toEqual(["status", "Eq", "active"]);
      });

      it("encodes $and with empty array", () => {
        const result = FILTER.encode({ $and: [] });
        expect(result).toEqual(["And", []]);
      });

      it("encodes nested $and inside $and", () => {
        const result = FILTER.encode({
          $and: [{ a: 1 }, { $and: [{ b: 2 }, { c: 3 }] }],
        });
        expect(result).toEqual([
          "And",
          [
            ["a", "Eq", 1],
            ["And", [["b", "Eq", 2], ["c", "Eq", 3]]],
          ],
        ]);
      });
    });

    describe("$or", () => {
      it("encodes $or with two conditions", () => {
        const result = FILTER.encode({
          $or: [{ status: "draft" }, { status: "review" }],
        });
        expect(result).toEqual([
          "Or",
          [
            ["status", "Eq", "draft"],
            ["status", "Eq", "review"],
          ],
        ]);
      });

      it("encodes $or with empty array", () => {
        const result = FILTER.encode({ $or: [] });
        expect(result).toEqual(["Or", []]);
      });

      it("encodes $or with complex conditions", () => {
        const result = FILTER.encode({
          $or: [
            { status: "active", priority: { $gte: 5 } },
            { status: "urgent" },
          ],
        });
        expect(result).toEqual([
          "Or",
          [
            ["And", [["status", "Eq", "active"], ["priority", "Gte", 5]]],
            ["status", "Eq", "urgent"],
          ],
        ]);
      });
    });

    describe("$not", () => {
      it("encodes $not with simple equality", () => {
        const result = FILTER.encode({
          $not: { deleted: true },
        });
        expect(result).toEqual(["Not", ["deleted", "Eq", true]]);
      });

      it("encodes $not with comparison", () => {
        const result = FILTER.encode({
          $not: { views: { $lt: 100 } },
        });
        expect(result).toEqual(["Not", ["views", "Lt", 100]]);
      });

      it("encodes $not with compound filter", () => {
        const result = FILTER.encode({
          $not: { status: "deleted", archived: true },
        });
        expect(result).toEqual([
          "Not",
          ["And", [["status", "Eq", "deleted"], ["archived", "Eq", true]]],
        ]);
      });
    });

    describe("complex nested logical trees", () => {
      it("encodes AND of ORs", () => {
        const result = FILTER.encode({
          $and: [
            { $or: [{ status: "active" }, { status: "pending" }] },
            { $or: [{ type: "article" }, { type: "post" }] },
          ],
        });
        expect(result).toEqual([
          "And",
          [
            ["Or", [["status", "Eq", "active"], ["status", "Eq", "pending"]]],
            ["Or", [["type", "Eq", "article"], ["type", "Eq", "post"]]],
          ],
        ]);
      });

      it("encodes OR of ANDs", () => {
        const result = FILTER.encode({
          $or: [
            { status: "active", role: "admin" },
            { status: "active", role: "moderator" },
          ],
        });
        expect(result).toEqual([
          "Or",
          [
            ["And", [["status", "Eq", "active"], ["role", "Eq", "admin"]]],
            ["And", [["status", "Eq", "active"], ["role", "Eq", "moderator"]]],
          ],
        ]);
      });

      it("encodes NOT of AND of ORs", () => {
        const result = FILTER.encode({
          $not: {
            $and: [
              { $or: [{ a: 1 }, { b: 2 }] },
              { $or: [{ c: 3 }, { d: 4 }] },
            ],
          },
        });
        expect(result).toEqual([
          "Not",
          [
            "And",
            [
              ["Or", [["a", "Eq", 1], ["b", "Eq", 2]]],
              ["Or", [["c", "Eq", 3], ["d", "Eq", 4]]],
            ],
          ],
        ]);
      });

      it("encodes deeply nested tree (4 levels)", () => {
        const result = FILTER.encode({
          $and: [
            { active: true },
            {
              $or: [
                { role: "admin" },
                {
                  $and: [
                    { role: "user" },
                    {
                      $or: [{ verified: true }, { trusted: true }],
                    },
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
                    ["Or", [["verified", "Eq", true], ["trusted", "Eq", true]]],
                  ],
                ],
              ],
            ],
          ],
        ]);
      });

      it("encodes mixed logical and comparison operators", () => {
        const result = FILTER.encode({
          $and: [
            { status: { $in: ["active", "pending"] } },
            { views: { $gte: 100, $lt: 10000 } },
            {
              $or: [
                { premium: true },
                { $not: { trial: true } },
              ],
            },
          ],
        });
        expect(result).toEqual([
          "And",
          [
            ["status", "In", ["active", "pending"]],
            ["And", [["views", "Gte", 100], ["views", "Lt", 10000]]],
            [
              "Or",
              [
                ["premium", "Eq", true],
                ["Not", ["trial", "Eq", true]],
              ],
            ],
          ],
        ]);
      });
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("edge cases", () => {
    it("handles field names with special characters", () => {
      expect(FILTER.encode({ "field.nested": "value" })).toEqual([
        "field.nested",
        "Eq",
        "value",
      ]);
    });

    it("handles field names with underscores", () => {
      expect(FILTER.encode({ created_at: "2024-01-01" })).toEqual([
        "created_at",
        "Eq",
        "2024-01-01",
      ]);
    });

    it("handles field names with numbers", () => {
      expect(FILTER.encode({ field1: "value" })).toEqual([
        "field1",
        "Eq",
        "value",
      ]);
    });

    it("handles very long string values", () => {
      const longString = "a".repeat(10000);
      expect(FILTER.encode({ content: longString })).toEqual([
        "content",
        "Eq",
        longString,
      ]);
    });

    it("handles large numbers", () => {
      expect(FILTER.encode({ bigNum: 9007199254740991 })).toEqual([
        "bigNum",
        "Eq",
        9007199254740991,
      ]);
    });

    it("ignores undefined values in filter object", () => {
      const result = FILTER.encode({ a: 1, b: undefined, c: 3 });
      expect(result).toEqual([
        "And",
        [
          ["a", "Eq", 1],
          ["c", "Eq", 3],
        ],
      ]);
    });
  });

  // ============================================================
  // ERROR CASES
  // ============================================================

  describe("error cases", () => {
    it("throws on empty filter object", () => {
      expect(() => FILTER.encode({})).toThrow("Empty filter");
    });

    it("throws on filter with only undefined values", () => {
      expect(() => FILTER.encode({ a: undefined })).toThrow("Empty filter");
    });
  });
});
