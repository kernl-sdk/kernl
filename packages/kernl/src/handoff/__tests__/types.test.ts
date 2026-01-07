import { describe, it, expect } from "vitest";
import { isHandoffResult, type HandoffResult, type HandoffRecord } from "../types";

describe("Handoff Types", () => {
  describe("isHandoffResult", () => {
    it("should return true for valid handoff result", () => {
      const result: HandoffResult = {
        kind: "handoff",
        to: "writer",
        message: "Here are the findings",
        from: "researcher",
      };
      expect(isHandoffResult(result)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isHandoffResult(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isHandoffResult(undefined)).toBe(false);
    });

    it("should return false for string", () => {
      expect(isHandoffResult("handoff")).toBe(false);
    });

    it("should return false for object without kind", () => {
      expect(isHandoffResult({ to: "writer", message: "test" })).toBe(false);
    });

    it("should return false for object with wrong kind", () => {
      expect(isHandoffResult({ kind: "other", to: "writer" })).toBe(false);
    });

    it("should return false when 'to' field is missing", () => {
      expect(isHandoffResult({
        kind: "handoff",
        message: "test",
        from: "agent1"
      })).toBe(false);
    });

    it("should return false when 'message' field is missing", () => {
      expect(isHandoffResult({
        kind: "handoff",
        to: "writer",
        from: "agent1"
      })).toBe(false);
    });

    it("should return false when 'from' field is missing", () => {
      expect(isHandoffResult({
        kind: "handoff",
        to: "writer",
        message: "test"
      })).toBe(false);
    });
  });
});
