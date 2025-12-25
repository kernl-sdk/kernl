import { describe, it, expect } from "vitest";
import { planQuery, normalizeQuery } from "../query";
import type { SearchCapabilities } from "../types";

describe("planQuery", () => {
  const vectorOnly: SearchCapabilities = {
    modes: new Set(["vector"]),
    multiSignal: false,
    filters: true,
    orderBy: true,
  };

  const hybridCaps: SearchCapabilities = {
    modes: new Set(["vector", "text", "hybrid"]),
    multiSignal: true,
    multiVector: true,
    multiText: true,
    filters: true,
  };

  describe("hybrid degradation", () => {
    it("preserves hybrid query when supported", () => {
      const result = planQuery(
        { query: [{ text: "hello", tvec: [0.1, 0.2] }] },
        hybridCaps,
      );

      expect(result.degraded).toBe(false);
      expect(result.warnings).toBeUndefined();
      expect(result.input.query?.[0]).toEqual({
        text: "hello",
        tvec: [0.1, 0.2],
      });
    });

    it("drops text when hybrid not supported", () => {
      const result = planQuery(
        { query: [{ text: "hello", tvec: [0.1, 0.2] }] },
        vectorOnly,
      );

      expect(result.degraded).toBe(true);
      expect(result.warnings).toContain(
        "hybrid not supported, using vector-only",
      );
      expect(result.input.query?.[0]).toEqual({ tvec: [0.1, 0.2] });
      expect(result.input.query?.[0]).not.toHaveProperty("text");
    });

    it("keeps vector-only query unchanged", () => {
      const result = planQuery({ query: [{ tvec: [0.1, 0.2] }] }, vectorOnly);

      expect(result.degraded).toBe(false);
      expect(result.input.query?.[0]).toEqual({ tvec: [0.1, 0.2] });
    });
  });

  describe("multi-signal degradation", () => {
    it("preserves multiple signals when supported", () => {
      const result = planQuery(
        { query: [{ tvec: [0.1] }, { tvec: [0.2] }] },
        hybridCaps,
      );

      expect(result.degraded).toBe(false);
      expect(result.input.query).toHaveLength(2);
    });

    it("keeps first signal when multi-signal not supported", () => {
      const result = planQuery(
        { query: [{ tvec: [0.1] }, { tvec: [0.2] }] },
        vectorOnly,
      );

      expect(result.degraded).toBe(true);
      expect(result.warnings).toContain(
        "multi-signal not supported, using first signal",
      );
      expect(result.input.query).toHaveLength(1);
      expect(result.input.query?.[0]).toEqual({ tvec: [0.1] });
    });
  });

  describe("combined degradations", () => {
    it("applies both hybrid and multi-signal degradation", () => {
      const result = planQuery(
        {
          query: [
            { text: "hello", tvec: [0.1] },
            { text: "world", tvec: [0.2] },
          ],
        },
        vectorOnly,
      );

      expect(result.degraded).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.input.query).toHaveLength(1);
      expect(result.input.query?.[0]).toEqual({ tvec: [0.1] });
    });
  });

  describe("passthrough", () => {
    it("preserves filter and limit", () => {
      const result = planQuery(
        {
          query: [{ tvec: [0.1] }],
          filter: { status: "active" },
          limit: 10,
        },
        vectorOnly,
      );

      expect(result.input.filter).toEqual({ status: "active" });
      expect(result.input.limit).toBe(10);
    });
  });
});

describe("normalizeQuery", () => {
  it("wraps single signal in array", () => {
    const result = normalizeQuery({ tvec: [0.1, 0.2] });
    expect(result.query).toEqual([{ tvec: [0.1, 0.2] }]);
  });

  it("converts array shorthand to query field", () => {
    const result = normalizeQuery([{ tvec: [0.1] }, { tvec: [0.2] }]);
    expect(result.query).toEqual([{ tvec: [0.1] }, { tvec: [0.2] }]);
  });

  it("passes through SearchQuery unchanged", () => {
    const input = { query: [{ tvec: [0.1] }], limit: 5 };
    const result = normalizeQuery(input);
    expect(result).toEqual(input);
  });

  it("throws on empty array", () => {
    expect(() => normalizeQuery([])).toThrow("No ranking signals provided");
  });

  it("throws on explicit empty query array", () => {
    expect(() => normalizeQuery({ query: [] })).toThrow(
      "No ranking signals provided",
    );
  });
});
