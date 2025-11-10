import { describe, it, expect } from "vitest";
import { Toolkit } from "../toolkit";
import {
  simpleStringTool,
  zodTool,
  errorTool,
  mockHostedTool,
  anotherHostedTool,
} from "./fixtures";

describe("Toolkit", () => {
  describe("constructor", () => {
    it("should create empty toolkit with no config", () => {
      const toolkit = new Toolkit();

      expect(toolkit.list()).toEqual([]);
    });

    it("should initialize with systools", () => {
      const toolkit = new Toolkit({ tools: [mockHostedTool] });

      expect(toolkit.list()).toHaveLength(1);
      expect(toolkit.get("hosted-1")).toBe(mockHostedTool);
    });

    it("should initialize with function tools", () => {
      const toolkit = new Toolkit({ tools: [simpleStringTool, zodTool] });

      expect(toolkit.list()).toHaveLength(2);
      expect(toolkit.get("simple")).toBe(simpleStringTool);
      expect(toolkit.get("zod-tool")).toBe(zodTool);
    });

    it("should initialize with both systools and functions", () => {
      const toolkit = new Toolkit({ tools: [mockHostedTool, simpleStringTool] });

      expect(toolkit.list()).toHaveLength(2);
      expect(toolkit.get("hosted-1")).toBe(mockHostedTool);
      expect(toolkit.get("simple")).toBe(simpleStringTool);
    });
  });

  describe("get", () => {
    it("should return undefined for non-existent tool", () => {
      const toolkit = new Toolkit();

      expect(toolkit.get("non-existent")).toBeUndefined();
    });

    it("should get systool by id", () => {
      const toolkit = new Toolkit({ tools: [mockHostedTool] });

      expect(toolkit.get("web-search")).toBe(mockHostedTool);
    });

    it("should get function tool by id", () => {
      const toolkit = new Toolkit({ tools: [simpleStringTool] });

      expect(toolkit.get("simple")).toBe(simpleStringTool);
    });

    it("should prioritize systools over functions with same id", () => {
      const toolkit = new Toolkit({ tools: [mockHostedTool, simpleStringTool] });

      // systools.get() is checked first in the implementation
      expect(toolkit.get("duplicate-id")).toBe(mockHostedTool);
    });
  });

  describe("list", () => {
    it("should return empty array for empty toolkit", () => {
      const toolkit = new Toolkit();

      expect(toolkit.list()).toEqual([]);
    });

    it("should list all systools", () => {
      const toolkit = new Toolkit({ tools: [mockHostedTool, anotherHostedTool] });

      const tools = toolkit.list();
      expect(tools).toHaveLength(2);
      expect(tools).toContain(mockHostedTool);
      expect(tools).toContain(anotherHostedTool);
    });

    it("should list all function tools", () => {
      const toolkit = new Toolkit({
        tools: [simpleStringTool, zodTool, errorTool],
      });

      const tools = toolkit.list();
      expect(tools).toHaveLength(3);
      expect(tools).toContain(simpleStringTool);
      expect(tools).toContain(zodTool);
      expect(tools).toContain(errorTool);
    });

    it("should list both systools and function tools", () => {
      const toolkit = new Toolkit({
        tools: [mockHostedTool, simpleStringTool, zodTool],
      });

      const tools = toolkit.list();
      expect(tools).toHaveLength(3);
      expect(tools).toContain(mockHostedTool);
      expect(tools).toContain(simpleStringTool);
      expect(tools).toContain(zodTool);
    });

    it("should return systools before functions in list order", () => {
      const toolkit = new Toolkit({ tools: [mockHostedTool, simpleStringTool] });

      const tools = toolkit.list();
      // Implementation spreads systools first: [...this.systools.values(), ...this.functions.values()]
      expect(tools[0]).toBe(mockHostedTool);
      expect(tools[1]).toBe(simpleStringTool);
    });
  });

  describe("serialize", () => {
    it("should return empty array for empty toolkit", () => {
      const toolkit = new Toolkit();

      expect(toolkit.list().map((tool) => tool.serialize())).toEqual([]);
    });

    it("should serialize function tools correctly", () => {
      const toolkit = new Toolkit({ tools: [simpleStringTool] });

      const serialized = toolkit.list().map((tool) => tool.serialize());
      expect(serialized).toHaveLength(1);
      expect(serialized[0]).toEqual({
        type: "function",
        name: simpleStringTool.name,
        description: simpleStringTool.description,
        parameters: simpleStringTool.parameters,
      });
    });

    it("should serialize hosted tools correctly", () => {
      const toolkit = new Toolkit({ tools: [mockHostedTool] });

      const serialized = toolkit.list().map((tool) => tool.serialize());
      expect(serialized).toHaveLength(1);
      expect(serialized[0]).toEqual({
        type: "hosted-tool",
        id: mockHostedTool.id,
        name: mockHostedTool.name,
        providerData: mockHostedTool.providerData,
      });
    });

    it("should serialize both function and hosted tools", () => {
      const toolkit = new Toolkit({ tools: [mockHostedTool, simpleStringTool] });

      const serialized = toolkit.list().map((tool) => tool.serialize());
      expect(serialized).toHaveLength(2);

      // First should be hosted tool (systools come first)
      expect(serialized[0]).toEqual({
        type: "hosted-tool",
        id: mockHostedTool.id,
        name: mockHostedTool.name,
        providerData: mockHostedTool.providerData,
      });

      // Second should be function tool
      expect(serialized[1]).toEqual({
        type: "function",
        name: simpleStringTool.name,
        description: simpleStringTool.description,
        parameters: simpleStringTool.parameters,
      });
    });

    it("should handle hosted tools without providerData", () => {
      const toolkit = new Toolkit({ tools: [anotherHostedTool] });

      const serialized = toolkit.list().map((tool) => tool.serialize());
      expect(serialized).toHaveLength(1);
      expect(serialized[0]).toEqual({
        type: "hosted-tool",
        id: anotherHostedTool.id,
        name: anotherHostedTool.name,
        providerData: undefined,
      });
    });
  });
});
