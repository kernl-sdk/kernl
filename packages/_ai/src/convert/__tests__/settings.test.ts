import { describe, it, expect } from "vitest";
import type { LanguageModelRequestSettings } from "@kernl/protocol";

import { MODEL_SETTINGS } from "../settings";

describe("MODEL_SETTINGS codec", () => {
  describe("encode", () => {
    it("should encode temperature setting", () => {
      const settings: LanguageModelRequestSettings = {
        temperature: 0.7,
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        temperature: 0.7,
      });
    });

    it("should encode topP setting", () => {
      const settings: LanguageModelRequestSettings = {
        topP: 0.9,
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        topP: 0.9,
      });
    });

    it("should encode maxTokens setting", () => {
      const settings: LanguageModelRequestSettings = {
        maxTokens: 1000,
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        maxOutputTokens: 1000,
      });
    });

    it("should encode frequencyPenalty setting", () => {
      const settings: LanguageModelRequestSettings = {
        frequencyPenalty: 0.5,
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        frequencyPenalty: 0.5,
      });
    });

    it("should encode presencePenalty setting", () => {
      const settings: LanguageModelRequestSettings = {
        presencePenalty: 0.3,
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        presencePenalty: 0.3,
      });
    });

    it("should encode toolChoice 'auto'", () => {
      const settings: LanguageModelRequestSettings = {
        toolChoice: { kind: "auto" },
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        toolChoice: { type: "auto" },
      });
    });

    it("should encode toolChoice 'none'", () => {
      const settings: LanguageModelRequestSettings = {
        toolChoice: { kind: "none" },
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        toolChoice: { type: "none" },
      });
    });

    it("should encode toolChoice 'required'", () => {
      const settings: LanguageModelRequestSettings = {
        toolChoice: { kind: "required" },
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        toolChoice: { type: "required" },
      });
    });

    it("should encode toolChoice with specific tool", () => {
      const settings: LanguageModelRequestSettings = {
        toolChoice: { kind: "tool", toolId: "get_weather" },
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        toolChoice: { type: "tool", toolName: "get_weather" },
      });
    });

    it("should encode providerOptions", () => {
      const settings: LanguageModelRequestSettings = {
        providerOptions: {
          anthropic: {
            cacheControl: { type: "ephemeral" },
          },
        },
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        providerOptions: {
          anthropic: {
            cacheControl: { type: "ephemeral" },
          },
        },
      });
    });

    it("should encode multiple settings together", () => {
      const settings: LanguageModelRequestSettings = {
        temperature: 0.8,
        maxTokens: 2000,
        topP: 0.95,
        frequencyPenalty: 0.2,
        presencePenalty: 0.1,
        toolChoice: { kind: "auto" },
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        temperature: 0.8,
        maxOutputTokens: 2000,
        topP: 0.95,
        frequencyPenalty: 0.2,
        presencePenalty: 0.1,
        toolChoice: { type: "auto" },
      });
    });

    it("should handle empty settings", () => {
      const settings: LanguageModelRequestSettings = {};

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({});
    });

    it("should only include defined settings", () => {
      const settings: LanguageModelRequestSettings = {
        temperature: 0.5,
        maxTokens: undefined,
      };

      const result = MODEL_SETTINGS.encode(settings);

      expect(result).toEqual({
        temperature: 0.5,
      });
      expect(result).not.toHaveProperty("maxTokens");
    });
  });

  describe("decode", () => {
    it("should throw unimplemented error", () => {
      expect(() => MODEL_SETTINGS.decode({} as any)).toThrow(
        "codec:unimplemented",
      );
    });
  });
});
