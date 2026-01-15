import { describe, it, expect } from "vitest";
import type { SharedV3Warning } from "@ai-sdk/provider";

import { WARNING } from "../response";

describe("WARNING codec", () => {
  describe("decode", () => {
    it("should decode unsupported warning", () => {
      const aiWarning: SharedV3Warning = {
        type: "unsupported",
        feature: "someUnsupportedFeature",
        details: "This feature is not supported by the provider",
      };

      const result = WARNING.decode(aiWarning);

      expect(result).toEqual({
        type: "unsupported",
        feature: "someUnsupportedFeature",
        details: "This feature is not supported by the provider",
      });
    });

    it("should decode compatibility warning", () => {
      const aiWarning: SharedV3Warning = {
        type: "compatibility",
        feature: "someFeature",
        details: "Running in compatibility mode",
      };

      const result = WARNING.decode(aiWarning);

      expect(result).toEqual({
        type: "compatibility",
        feature: "someFeature",
        details: "Running in compatibility mode",
      });
    });

    it("should decode other warning", () => {
      const aiWarning: SharedV3Warning = {
        type: "other",
        message: "Some custom warning message",
      };

      const result = WARNING.decode(aiWarning);

      expect(result).toEqual({
        type: "other",
        message: "Some custom warning message",
      });
    });
  });

  describe("encode", () => {
    it("should throw unimplemented error", () => {
      expect(() =>
        WARNING.encode({
          type: "other",
          message: "test",
        }),
      ).toThrow("codec:unimplemented");
    });
  });
});
