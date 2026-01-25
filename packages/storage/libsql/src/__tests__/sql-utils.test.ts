import { describe, it, expect } from "vitest";

import { expandarray, SQL_IDENTIFIER_REGEX } from "../sql";

describe("libsql sql utils", () => {
  describe("expandarray", () => {
    it("returns placeholders and params for array", () => {
      const result = expandarray(["a", "b", "c"]);
      expect(result.placeholders).toBe("?, ?, ?");
      expect(result.params).toEqual(["a", "b", "c"]);
    });

    it("handles single element", () => {
      const result = expandarray(["only"]);
      expect(result.placeholders).toBe("?");
      expect(result.params).toEqual(["only"]);
    });

    it("handles empty array", () => {
      const result = expandarray([]);
      expect(result.placeholders).toBe("");
      expect(result.params).toEqual([]);
    });

    it("preserves original values", () => {
      const result = expandarray([1, "two", null, true]);
      expect(result.placeholders).toBe("?, ?, ?, ?");
      expect(result.params).toEqual([1, "two", null, true]);
    });
  });

  describe("SQL_IDENTIFIER_REGEX", () => {
    it("accepts valid identifiers", () => {
      expect(SQL_IDENTIFIER_REGEX.test("users")).toBe(true);
      expect(SQL_IDENTIFIER_REGEX.test("thread_events")).toBe(true);
      expect(SQL_IDENTIFIER_REGEX.test("kernl_threads")).toBe(true);
      expect(SQL_IDENTIFIER_REGEX.test("_private")).toBe(true);
      expect(SQL_IDENTIFIER_REGEX.test("Table1")).toBe(true);
      expect(SQL_IDENTIFIER_REGEX.test("a")).toBe(true);
    });

    it("rejects invalid identifiers", () => {
      expect(SQL_IDENTIFIER_REGEX.test("")).toBe(false);
      expect(SQL_IDENTIFIER_REGEX.test("1starts_with_number")).toBe(false);
      expect(SQL_IDENTIFIER_REGEX.test("has space")).toBe(false);
      expect(SQL_IDENTIFIER_REGEX.test("has-dash")).toBe(false);
      expect(SQL_IDENTIFIER_REGEX.test("has.dot")).toBe(false);
      expect(SQL_IDENTIFIER_REGEX.test("DROP TABLE")).toBe(false);
      expect(SQL_IDENTIFIER_REGEX.test("users; --")).toBe(false);
    });
  });
});
