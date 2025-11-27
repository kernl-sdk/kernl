import { describe, it, expect } from "vitest";
import { SQL_LIMIT } from "../limit";

describe("SQL_LIMIT", () => {
  describe("encode", () => {
    it("builds LIMIT clause", () => {
      const result = SQL_LIMIT.encode({
        topK: 10,
        offset: 0,
        startIdx: 1,
      });
      expect(result.sql).toBe("LIMIT $1");
      expect(result.params).toEqual([10]);
    });

    it("respects startIdx for parameter numbering", () => {
      const result = SQL_LIMIT.encode({
        topK: 10,
        offset: 0,
        startIdx: 5,
      });
      expect(result.sql).toBe("LIMIT $5");
      expect(result.params).toEqual([10]);
    });

    it("includes OFFSET when offset > 0", () => {
      const result = SQL_LIMIT.encode({
        topK: 10,
        offset: 20,
        startIdx: 1,
      });
      expect(result.sql).toBe("LIMIT $1 OFFSET $2");
      expect(result.params).toEqual([10, 20]);
    });

    it("skips OFFSET when offset is 0", () => {
      const result = SQL_LIMIT.encode({
        topK: 25,
        offset: 0,
        startIdx: 3,
      });
      expect(result.sql).toBe("LIMIT $3");
      expect(result.params).toEqual([25]);
    });

    it("handles pagination correctly", () => {
      // Page 1: offset 0
      const page1 = SQL_LIMIT.encode({
        topK: 20,
        offset: 0,
        startIdx: 1,
      });
      expect(page1.sql).toBe("LIMIT $1");
      expect(page1.params).toEqual([20]);

      // Page 2: offset 20
      const page2 = SQL_LIMIT.encode({
        topK: 20,
        offset: 20,
        startIdx: 1,
      });
      expect(page2.sql).toBe("LIMIT $1 OFFSET $2");
      expect(page2.params).toEqual([20, 20]);

      // Page 3: offset 40
      const page3 = SQL_LIMIT.encode({
        topK: 20,
        offset: 40,
        startIdx: 1,
      });
      expect(page3.sql).toBe("LIMIT $1 OFFSET $2");
      expect(page3.params).toEqual([20, 40]);
    });

    it("correctly increments param index after SELECT and WHERE", () => {
      // Simulating: SELECT uses $1, WHERE uses $2-$4
      // LIMIT should start at $5
      const result = SQL_LIMIT.encode({
        topK: 10,
        offset: 50,
        startIdx: 5,
      });
      expect(result.sql).toBe("LIMIT $5 OFFSET $6");
      expect(result.params).toEqual([10, 50]);
    });

    describe("edge values", () => {
      it("handles topK: 0", () => {
        const result = SQL_LIMIT.encode({
          topK: 0,
          offset: 0,
          startIdx: 1,
        });
        // LIMIT 0 is valid SQL - returns no rows
        expect(result.sql).toBe("LIMIT $1");
        expect(result.params).toEqual([0]);
      });

      it("handles topK: 1", () => {
        const result = SQL_LIMIT.encode({
          topK: 1,
          offset: 0,
          startIdx: 1,
        });
        expect(result.sql).toBe("LIMIT $1");
        expect(result.params).toEqual([1]);
      });

      it("handles very large topK", () => {
        const result = SQL_LIMIT.encode({
          topK: 1000000,
          offset: 0,
          startIdx: 1,
        });
        expect(result.sql).toBe("LIMIT $1");
        expect(result.params).toEqual([1000000]);
      });

      it("handles very large offset", () => {
        const result = SQL_LIMIT.encode({
          topK: 10,
          offset: 999999,
          startIdx: 1,
        });
        expect(result.sql).toBe("LIMIT $1 OFFSET $2");
        expect(result.params).toEqual([10, 999999]);
      });

      it("handles very large startIdx", () => {
        const result = SQL_LIMIT.encode({
          topK: 10,
          offset: 20,
          startIdx: 50,
        });
        expect(result.sql).toBe("LIMIT $50 OFFSET $51");
        expect(result.params).toEqual([10, 20]);
      });

      it("handles startIdx: 1 with both topK and offset", () => {
        const result = SQL_LIMIT.encode({
          topK: 25,
          offset: 100,
          startIdx: 1,
        });
        expect(result.sql).toBe("LIMIT $1 OFFSET $2");
        expect(result.params).toEqual([25, 100]);
      });
    });

    describe("offset boundary", () => {
      it("includes OFFSET when offset is exactly 1", () => {
        const result = SQL_LIMIT.encode({
          topK: 10,
          offset: 1,
          startIdx: 1,
        });
        expect(result.sql).toBe("LIMIT $1 OFFSET $2");
        expect(result.params).toEqual([10, 1]);
      });

      it("does not include OFFSET when offset is exactly 0", () => {
        const result = SQL_LIMIT.encode({
          topK: 10,
          offset: 0,
          startIdx: 1,
        });
        expect(result.sql).toBe("LIMIT $1");
        expect(result.params).toEqual([10]);
      });
    });
  });

  describe("decode", () => {
    it("throws not implemented", () => {
      expect(() => SQL_LIMIT.decode({} as any)).toThrow(
        "SQL_LIMIT.decode not implemented",
      );
    });
  });
});
