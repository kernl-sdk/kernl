import { describe, it, expect } from "vitest";
import { MaxHandoffsExceededError, HandoffTargetNotFoundError } from "../errors";

describe("Handoff Errors", () => {
  describe("MaxHandoffsExceededError", () => {
    it("should format message with limit and chain", () => {
      const chain = [
        { from: "a", to: "b", message: "test", timestamp: new Date() },
        { from: "b", to: "c", message: "test", timestamp: new Date() },
      ];
      const error = new MaxHandoffsExceededError(5, chain);

      expect(error.message).toContain("5");
      expect(error.message).toContain("a");
      expect(error.message).toContain("b");
      expect(error.name).toBe("MaxHandoffsExceededError");
    });

    it("should store chain on error object", () => {
      const chain = [
        { from: "a", to: "b", message: "test", timestamp: new Date() },
      ];
      const error = new MaxHandoffsExceededError(10, chain);

      expect(error.chain).toEqual(chain);
      expect(error.limit).toBe(10);
    });
  });

  describe("HandoffTargetNotFoundError", () => {
    it("should format message with from, to, and available agents", () => {
      const error = new HandoffTargetNotFoundError("researcher", "unknown", ["writer", "analyst"]);

      expect(error.message).toContain("researcher");
      expect(error.message).toContain("unknown");
      expect(error.message).toContain("writer");
      expect(error.message).toContain("analyst");
      expect(error.name).toBe("HandoffTargetNotFoundError");
    });
  });
});
