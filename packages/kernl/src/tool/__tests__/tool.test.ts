import { describe, it, expect } from "vitest";
import { COMPLETED, FAILED } from "@kernl/protocol";
import { tool } from "../tool";
import {
  mockContext,
  simpleStringTool,
  zodTool,
  errorTool,
  customErrorTool,
  approvalRequiredTool,
  conditionalApprovalTool,
} from "./fixtures";

describe("FunctionTool", () => {
  describe("creation", () => {
    it("should create tool with required config", () => {
      const t = tool({
        id: "test",
        description: "Test tool",
        parameters: undefined,
        execute: async () => "result",
      });

      expect(t.id).toBe("test");
      expect(t.description).toBe("Test tool");
      expect(t.type).toBe("function");
    });

    it("should default mode to blocking", () => {
      const t = tool({
        id: "test",
        description: "Test tool",
        parameters: undefined,
        execute: async () => "result",
      });

      expect(t.mode).toBe("blocking");
    });

    it("should accept custom mode", () => {
      const t = tool({
        id: "test",
        description: "Test tool",
        parameters: undefined,
        mode: "async",
        execute: async () => "result",
      });

      expect(t.mode).toBe("async");
    });
  });

  describe("parameter parsing", () => {
    it("should handle string input when no parameters schema", async () => {
      const ctx = mockContext();
      const result = await simpleStringTool.invoke(ctx, "hello");

      expect(result.state).toBe(COMPLETED);
      expect(result.result).toBe("Echo: hello");
    });

    it("should parse and validate with Zod schema", async () => {
      const ctx = mockContext();
      const input = JSON.stringify({ name: "Alice", age: 30 });
      const result = await zodTool.invoke(ctx, input);

      expect(result.state).toBe(COMPLETED);
      expect(result.result).toBe("Alice is 30 years old");
    });

    it("should throw ModelBehaviorError on invalid JSON", async () => {
      const ctx = mockContext();
      const result = await zodTool.invoke(ctx, "not valid json");

      expect(result.state).toBe(FAILED);
      expect(result.error).toContain("Invalid JSON input for tool");
    });

    it("should throw ModelBehaviorError on schema validation failure", async () => {
      const ctx = mockContext();
      const input = JSON.stringify({ name: "Alice", age: "not a number" });
      const result = await zodTool.invoke(ctx, input);

      expect(result.state).toBe(FAILED);
      expect(result.error).toContain("Invalid JSON input for tool");
    });
  });

  describe("execution", () => {
    it("should execute and return ToolResult with completed status", async () => {
      const ctx = mockContext();
      const result = await simpleStringTool.invoke(ctx, "test");

      expect(result.state).toBe(COMPLETED);
      expect(result.result).toBe("Echo: test");
      expect(result.error).toBe(null);
    });

    it("should handle sync execute functions", async () => {
      const syncTool = tool({
        id: "sync",
        description: "Sync tool",
        parameters: undefined,
        execute: (ctx, input: string) => `Sync: ${input}`,
      });

      const ctx = mockContext();
      const result = await syncTool.invoke(ctx, "test");

      expect(result.state).toBe(COMPLETED);
      expect(result.result).toBe("Sync: test");
    });

    it("should handle async execute functions", async () => {
      const asyncTool = tool({
        id: "async",
        description: "Async tool",
        parameters: undefined,
        execute: async (ctx, input: string) =>
          Promise.resolve(`Async: ${input}`),
      });

      const ctx = mockContext();
      const result = await asyncTool.invoke(ctx, "test");

      expect(result.state).toBe(COMPLETED);
      expect(result.result).toBe("Async: test");
    });
  });

  describe("error handling", () => {
    it("should return error ToolResult when execute throws", async () => {
      const ctx = mockContext();
      const result = await errorTool.invoke(ctx, "test");

      expect(result.state).toBe(FAILED);
      expect(result.result).toBe(undefined);
      expect(result.error).toContain("Tool execution failed");
    });

    it("should use custom error function if provided", async () => {
      const ctx = mockContext();
      const result = await customErrorTool.invoke(ctx, "test");

      expect(result.state).toBe(FAILED);
      expect(result.error).toBe("Custom error message");
    });

    it("should use default error function if none provided", async () => {
      const ctx = mockContext();
      const result = await errorTool.invoke(ctx, "test");

      expect(result.state).toBe(FAILED);
      expect(result.error).toContain(
        "An error occurred while running the tool",
      );
    });
  });

  describe("approval", () => {
    it("should evaluate boolean requiresApproval", async () => {
      const ctx = mockContext();
      const requiresApproval = await approvalRequiredTool.requiresApproval(
        ctx,
        "test",
      );

      expect(requiresApproval).toBe(true);
    });

    it("should evaluate function requiresApproval", async () => {
      const ctx = mockContext();

      const dangerous = await conditionalApprovalTool.requiresApproval(ctx, {
        dangerous: true,
      });
      const safe = await conditionalApprovalTool.requiresApproval(ctx, {
        dangerous: false,
      });

      expect(dangerous).toBe(true);
      expect(safe).toBe(false);
    });
  });

  describe("isEnabled", () => {
    it("should default to enabled", async () => {
      const ctx = mockContext();
      const enabled = await simpleStringTool.isEnabled(ctx, null as any);

      expect(enabled).toBe(true);
    });

    it("should evaluate boolean isEnabled", async () => {
      const disabledTool = tool({
        id: "disabled",
        description: "Disabled tool",
        parameters: undefined,
        isEnabled: false,
        execute: async () => "result",
      });

      const ctx = mockContext();
      const enabled = await disabledTool.isEnabled(ctx, null as any);

      expect(enabled).toBe(false);
    });

    it("should evaluate function isEnabled with typed context", async () => {
      interface MyContext {
        enabled: boolean;
      }

      const conditionalTool = tool<MyContext>({
        id: "conditional",
        description: "Conditional tool",
        parameters: undefined,
        isEnabled: ({ context }) => {
          return context.context.enabled === true;
        },
        execute: async () => "result",
      });

      const enabledCtx = mockContext<MyContext>({ enabled: true });
      const disabledCtx = mockContext<MyContext>({ enabled: false });

      expect(await conditionalTool.isEnabled(enabledCtx, null as any)).toBe(
        true,
      );
      expect(await conditionalTool.isEnabled(disabledCtx, null as any)).toBe(
        false,
      );
    });
  });
});
