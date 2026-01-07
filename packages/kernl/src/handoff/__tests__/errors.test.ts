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

    it("should serialize to JSON with limit and chain", () => {
      const chain = [
        { from: "a", to: "b", message: "test", timestamp: new Date() },
        { from: "b", to: "c", message: "test2", timestamp: new Date() },
      ];
      const error = new MaxHandoffsExceededError(5, chain);
      const json = error.toJSON();

      expect(json.name).toBe("MaxHandoffsExceededError");
      expect(json.message).toContain("5");
      expect(json.limit).toBe(5);
      expect(json.chain).toEqual(chain);
      expect(json.traceId).toBeDefined();
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

    it("should store from, to, and available on error object", () => {
      const error = new HandoffTargetNotFoundError("researcher", "unknown", ["writer", "analyst"]);

      expect(error.from).toBe("researcher");
      expect(error.to).toBe("unknown");
      expect(error.available).toEqual(["writer", "analyst"]);
    });

    it("should serialize to JSON with from, to, and available", () => {
      const error = new HandoffTargetNotFoundError("researcher", "unknown", ["writer", "analyst"]);
      const json = error.toJSON();

      expect(json.name).toBe("HandoffTargetNotFoundError");
      expect(json.message).toContain("researcher");
      expect(json.from).toBe("researcher");
      expect(json.to).toBe("unknown");
      expect(json.available).toEqual(["writer", "analyst"]);
      expect(json.traceId).toBeDefined();
    });
  });
});
