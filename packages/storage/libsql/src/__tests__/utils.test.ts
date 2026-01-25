import { describe, it, expect } from "vitest";

import { parsejson } from "../utils";

describe("libsql utils", () => {
  describe("parsejson", () => {
    it("parses JSON strings", () => {
      expect(parsejson('{"foo": "bar"}')).toEqual({ foo: "bar" });
      expect(parsejson("[1, 2, 3]")).toEqual([1, 2, 3]);
      expect(parsejson('"hello"')).toEqual("hello");
      expect(parsejson("42")).toEqual(42);
      expect(parsejson("true")).toEqual(true);
      expect(parsejson("null")).toEqual(null);
    });

    it("returns null on invalid JSON", () => {
      expect(parsejson("{invalid}")).toBeNull();
      expect(parsejson("not json")).toBeNull();
      expect(parsejson("{foo: bar}")).toBeNull();
    });

    it("returns null for null/undefined input", () => {
      expect(parsejson(null)).toBeNull();
      expect(parsejson(undefined)).toBeNull();
    });

    it("passes through non-strings as-is", () => {
      const obj = { foo: "bar" };
      expect(parsejson(obj)).toBe(obj);

      const arr = [1, 2, 3];
      expect(parsejson(arr)).toBe(arr);

      expect(parsejson(42)).toBe(42);
      expect(parsejson(true)).toBe(true);
    });
  });
});
