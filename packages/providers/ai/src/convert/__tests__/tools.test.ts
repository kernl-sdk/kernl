import { describe, it, expect } from "vitest";
import type {
  LanguageModelV3FunctionTool,
  LanguageModelV3ProviderTool,
  LanguageModelV3ToolChoice,
} from "@ai-sdk/provider";

import { TOOL, TOOL_CHOICE } from "../tools";

describe("TOOL codec", () => {
  describe("encode - function tools", () => {
    it("should encode function tool with basic schema", () => {
      const result = TOOL.encode({
        kind: "function",
        name: "get_weather",
        description: "Get current weather for a location",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string" },
          },
          required: ["city"],
        },
      });

      expect(result).toEqual({
        type: "function",
        name: "get_weather",
        description: "Get current weather for a location",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string" },
          },
          required: ["city"],
        },
        providerOptions: undefined,
      });
    });

    it("should encode function tool without description", () => {
      const result = TOOL.encode({
        kind: "function",
        name: "simple_tool",
        parameters: {
          type: "object",
          properties: {},
        },
      });

      expect(result).toEqual({
        type: "function",
        name: "simple_tool",
        description: undefined,
        inputSchema: {
          type: "object",
          properties: {},
        },
        providerOptions: undefined,
      });
    });

    it("should encode function tool with complex schema", () => {
      const result = TOOL.encode({
        kind: "function",
        name: "search",
        description: "Search for information",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            filters: {
              type: "object",
              properties: {
                category: { type: "string" },
                maxResults: { type: "number" },
              },
            },
          },
          required: ["query"],
        },
      });

      expect(result.type).toBe("function");
      expect(result.name).toBe("search");
      if (result.type === "function" && result.inputSchema.properties) {
        expect(result.inputSchema.properties.query).toEqual({
          type: "string",
          description: "Search query",
        });
        expect(result.inputSchema.required).toEqual(["query"]);
      }
    });
  });

  describe("encode - provider tools", () => {
    it("should encode provider tool", () => {
      const result = TOOL.encode({
        kind: "provider-defined",
        id: "mcp.tool-123",
        name: "custom_mcp_tool",
        args: { param1: "value1" },
      });

      expect(result).toEqual({
        type: "provider",
        id: "mcp.tool-123",
        name: "custom_mcp_tool",
        args: { param1: "value1" },
      });
    });

    it("should encode provider tool without args", () => {
      const result = TOOL.encode({
        kind: "provider-defined",
        id: "mcp.tool-id",
        name: "tool_name",
        args: {},
      });

      expect(result).toEqual({
        type: "provider",
        id: "mcp.tool-id",
        name: "tool_name",
        args: {},
      });
    });
  });

  describe("decode", () => {
    it("should throw unimplemented error", () => {
      expect(() => TOOL.decode({} as LanguageModelV3FunctionTool)).toThrow(
        "codec:unimplemented",
      );
    });
  });
});

describe("TOOL_CHOICE codec", () => {
  describe("encode", () => {
    it("should encode 'auto' tool choice", () => {
      const result = TOOL_CHOICE.encode({ kind: "auto" });
      expect(result).toEqual({ type: "auto" });
    });

    it("should encode 'none' tool choice", () => {
      const result = TOOL_CHOICE.encode({ kind: "none" });
      expect(result).toEqual({ type: "none" });
    });

    it("should encode 'required' tool choice", () => {
      const result = TOOL_CHOICE.encode({ kind: "required" });
      expect(result).toEqual({ type: "required" });
    });

    it("should encode specific tool choice", () => {
      const result = TOOL_CHOICE.encode({
        kind: "tool",
        toolId: "get_weather",
      });

      expect(result).toEqual({
        type: "tool",
        toolId: "get_weather",
      });
    });
  });

  describe("decode", () => {
    it("should throw unimplemented error", () => {
      expect(() => TOOL_CHOICE.decode({} as LanguageModelV3ToolChoice)).toThrow(
        "codec:unimplemented",
      );
    });
  });
});
