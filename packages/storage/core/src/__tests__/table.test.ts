import { describe, it, expect } from "vitest";
import { text, integer, bigint, jsonb } from "../table";

describe("Column codec", () => {
  describe("text column", () => {
    it("should encode strings with single quotes", () => {
      const col = text();
      expect(col.encode("hello")).toBe("'hello'");
    });

    it("should escape single quotes", () => {
      const col = text();
      expect(col.encode("it's")).toBe("'it''s'");
      expect(col.encode("'quoted'")).toBe("'''quoted'''");
    });

    it("should handle NULL values", () => {
      const col = text();
      expect(col.encode(null as any)).toBe("NULL");
      expect(col.encode(undefined as any)).toBe("NULL");
    });

    it("should decode strings", () => {
      const col = text();
      expect(col.decode("hello")).toBe("hello");
    });
  });

  describe("integer column", () => {
    it("should encode numbers as strings", () => {
      const col = integer();
      expect(col.encode(42)).toBe("42");
      expect(col.encode(0)).toBe("0");
      expect(col.encode(-100)).toBe("-100");
    });

    it("should handle NULL values", () => {
      const col = integer();
      expect(col.encode(null as any)).toBe("NULL");
      expect(col.encode(undefined as any)).toBe("NULL");
    });

    it("should decode strings to numbers", () => {
      const col = integer();
      expect(col.decode("42")).toBe(42);
      expect(col.decode("-100")).toBe(-100);
    });
  });

  describe("bigint column", () => {
    it("should encode numbers as strings", () => {
      const col = bigint();
      expect(col.encode(9007199254740991)).toBe("9007199254740991");
      expect(col.encode(0)).toBe("0");
    });

    it("should handle NULL values", () => {
      const col = bigint();
      expect(col.encode(null as any)).toBe("NULL");
      expect(col.encode(undefined as any)).toBe("NULL");
    });

    it("should decode strings to numbers", () => {
      const col = bigint();
      expect(col.decode("9007199254740991")).toBe(9007199254740991);
    });
  });

  describe("jsonb column", () => {
    it("should encode objects as JSON strings", () => {
      const col = jsonb();
      expect(col.encode({ foo: "bar" })).toBe("'{\"foo\":\"bar\"}'");
    });

    it("should encode arrays", () => {
      const col = jsonb();
      expect(col.encode([1, 2, 3])).toBe("'[1,2,3]'");
    });

    it("should encode nested objects", () => {
      const col = jsonb();
      const obj = { user: { name: "Alice", age: 30 } };
      expect(col.encode(obj)).toBe("'{\"user\":{\"name\":\"Alice\",\"age\":30}}'");
    });

    it("should handle NULL values", () => {
      const col = jsonb();
      expect(col.encode(null as any)).toBe("NULL");
      expect(col.encode(undefined as any)).toBe("NULL");
    });

    it("should decode JSON strings to objects", () => {
      const col = jsonb();
      expect(col.decode('{"foo":"bar"}')).toEqual({ foo: "bar" });
    });

    it("should decode JSON arrays", () => {
      const col = jsonb();
      expect(col.decode("[1,2,3]")).toEqual([1, 2, 3]);
    });
  });

  describe("column builders", () => {
    it("should support primaryKey()", () => {
      const col = text().primaryKey();
      expect(col._pk).toBe(true);
    });

    it("should support nullable()", () => {
      const col = text().nullable();
      expect(col._nullable).toBe(true);
    });

    it("should support unique()", () => {
      const col = text().unique();
      expect(col._unique).toBe(true);
    });

    it("should support default() with type safety", () => {
      const textCol = text().default("hello");
      expect(textCol._default).toBe("hello");

      const intCol = integer().default(42);
      expect(intCol._default).toBe(42);
    });

    it("should chain builder methods", () => {
      const col = text().unique().nullable().default("test");
      expect(col._unique).toBe(true);
      expect(col._nullable).toBe(true);
      expect(col._default).toBe("test");
    });
  });
});
