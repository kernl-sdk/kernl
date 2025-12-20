import { describe, it, expect } from "vitest";
import { FunctionToolkit } from "../toolkit";
import {
  simpleStringTool,
  zodTool,
  errorTool,
  mockHostedTool,
  anotherHostedTool,
} from "./fixtures";

describe("FunctionToolkit", () => {
  describe("constructor", () => {
    it("should create empty toolkit with no tools", async () => {
      const toolkit = new FunctionToolkit({ id: "empty", tools: [] });

      expect(await toolkit.list()).toEqual([]);
    });

    it("should initialize with systools", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [mockHostedTool] });

      expect(await toolkit.list()).toHaveLength(1);
      expect(toolkit.get("web-search")).toBe(mockHostedTool);
    });

    it("should initialize with function tools", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [simpleStringTool, zodTool] });

      expect(await toolkit.list()).toHaveLength(2);
      expect(toolkit.get("simple")).toBe(simpleStringTool);
      expect(toolkit.get("zod-tool")).toBe(zodTool);
    });

    it("should initialize with both systools and functions", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [mockHostedTool, simpleStringTool] });

      expect(await toolkit.list()).toHaveLength(2);
      expect(toolkit.get("web-search")).toBe(mockHostedTool);
      expect(toolkit.get("simple")).toBe(simpleStringTool);
    });
  });

  describe("get", () => {
    it("should return undefined for non-existent tool", () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [] });

      expect(toolkit.get("non-existent")).toBeUndefined();
    });

    it("should get systool by id", () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [mockHostedTool] });

      expect(toolkit.get("web-search")).toBe(mockHostedTool);
    });

    it("should get function tool by id", () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [simpleStringTool] });

      expect(toolkit.get("simple")).toBe(simpleStringTool);
    });
  });

  describe("list", () => {
    it("should return empty array for empty toolkit", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [] });

      expect(await toolkit.list()).toEqual([]);
    });

    it("should list all systools", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [mockHostedTool, anotherHostedTool] });

      const tools = await toolkit.list();
      expect(tools).toHaveLength(2);
      expect(tools).toContain(mockHostedTool);
      expect(tools).toContain(anotherHostedTool);
    });

    it("should list all function tools", async () => {
      const toolkit = new FunctionToolkit({
        id: "test",
        tools: [simpleStringTool, zodTool, errorTool],
      });

      const tools = await toolkit.list();
      expect(tools).toHaveLength(3);
      expect(tools).toContain(simpleStringTool);
      expect(tools).toContain(zodTool);
      expect(tools).toContain(errorTool);
    });

    it("should list both systools and function tools", async () => {
      const toolkit = new FunctionToolkit({
        id: "test",
        tools: [mockHostedTool, simpleStringTool, zodTool],
      });

      const tools = await toolkit.list();
      expect(tools).toHaveLength(3);
      expect(tools).toContain(mockHostedTool);
      expect(tools).toContain(simpleStringTool);
      expect(tools).toContain(zodTool);
    });
  });

  describe("serialize", () => {
    it("should return empty array for empty toolkit", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [] });

      expect((await toolkit.list()).map((tool: any) => tool.serialize())).toEqual([]);
    });

    it("should serialize function tools correctly", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [simpleStringTool] });

      const serialized = (await toolkit.list()).map((tool: any) => tool.serialize());
      expect(serialized).toHaveLength(1);
      expect(serialized[0]).toMatchObject({
        kind: "function",
        name: simpleStringTool.id,
        description: simpleStringTool.description,
      });
      expect(serialized[0].parameters).toBeDefined();
    });

    it("should serialize hosted tools correctly", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [mockHostedTool] });

      const serialized = (await toolkit.list()).map((tool: any) => tool.serialize());
      expect(serialized).toHaveLength(1);
      expect(serialized[0]).toEqual({
        kind: "provider-defined",
        id: mockHostedTool.id,
        name: mockHostedTool.name,
        args: mockHostedTool.providerData,
      });
    });

    it("should serialize both function and hosted tools", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [mockHostedTool, simpleStringTool] });

      const serialized = (await toolkit.list()).map((tool: any) => tool.serialize());
      expect(serialized).toHaveLength(2);

      // Check both tools are present (order not guaranteed with Map)
      expect(serialized).toContainEqual({
        kind: "provider-defined",
        id: mockHostedTool.id,
        name: mockHostedTool.name,
        args: mockHostedTool.providerData,
      });

      // Check that function tool is present with correct structure
      const functionTool = serialized.find((t: any) => t.kind === "function");
      expect(functionTool).toBeDefined();
      expect(functionTool).toMatchObject({
        kind: "function",
        name: simpleStringTool.id,
        description: simpleStringTool.description,
      });
      expect(functionTool.parameters).toBeDefined();
    });

    it("should handle hosted tools without providerData", async () => {
      const toolkit = new FunctionToolkit({ id: "test", tools: [anotherHostedTool] });

      const serialized = (await toolkit.list()).map((tool: any) => tool.serialize());
      expect(serialized).toHaveLength(1);
      expect(serialized[0]).toEqual({
        kind: "provider-defined",
        id: anotherHostedTool.id,
        name: anotherHostedTool.name,
        args: {},
      });
    });
  });
});
