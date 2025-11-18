import { describe, it, expect } from "vitest";
import type { LanguageModelV3CallWarning } from "@ai-sdk/provider";

import { WARNING } from "../response";

describe("WARNING codec", () => {
  describe("decode", () => {
    it("should decode unsupported-setting warning", () => {
      const aiWarning: LanguageModelV3CallWarning = {
        type: "unsupported-setting",
        setting: "someUnsupportedSetting",
        details: "This setting is not supported by the provider",
      };

      const result = WARNING.decode(aiWarning);

      expect(result).toEqual({
        type: "unsupported-setting",
        setting: "someUnsupportedSetting",
        details: "This setting is not supported by the provider",
      });
    });

    it("should decode other warning", () => {
      const aiWarning: LanguageModelV3CallWarning = {
        type: "other",
        message: "Some custom warning message",
      };

      const result = WARNING.decode(aiWarning);

      expect(result).toEqual({
        type: "other",
        message: "Some custom warning message",
      });
    });

    it("should handle unknown warning type", () => {
      const aiWarning = {
        type: "unknown-type",
        someField: "value",
      } as any;

      const result = WARNING.decode(aiWarning);

      expect(result).toEqual({
        type: "other",
        message: "Unknown warning type",
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
