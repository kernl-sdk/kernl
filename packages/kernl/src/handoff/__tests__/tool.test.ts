import { describe, it, expect } from "vitest";
import { COMPLETED, FAILED } from "@kernl-sdk/protocol";
import { createHandoffTool } from "../tool";
import { isHandoffResult } from "../types";
import { mockContext } from "@/tool/__tests__/fixtures";

describe("createHandoffTool", () => {
  it("should create a tool with id 'handoff'", () => {
    const tool = createHandoffTool("researcher", ["writer", "analyst"]);
    expect(tool.id).toBe("handoff");
  });

  it("should include available agents in description", () => {
    const tool = createHandoffTool("researcher", ["writer", "analyst"]);
    expect(tool.description).toContain("writer");
    expect(tool.description).toContain("analyst");
  });

  it("should return a HandoffResult when executed", async () => {
    const tool = createHandoffTool("researcher", ["writer", "analyst"]);
    const ctx = mockContext();

    const input = JSON.stringify({ to: "writer", message: "Here are findings" });
    const result = await tool.invoke(ctx, input);

    expect(result.state).toBe(COMPLETED);
    expect(isHandoffResult(result.result)).toBe(true);
    expect(result.result).toEqual({
      kind: "handoff",
      to: "writer",
      message: "Here are findings",
      from: "researcher",
    });
  });

  it("should indicate no agents available in description when list is empty", () => {
    const tool = createHandoffTool("solo", []);
    expect(tool.description).toContain("no other agents currently available");
  });

  it("should fail validation when handing off to an agent not in the available list", async () => {
    const tool = createHandoffTool("researcher", ["writer", "analyst"]);
    const ctx = mockContext();

    const input = JSON.stringify({ to: "unknown-agent", message: "test" });
    const result = await tool.invoke(ctx, input);

    expect(result.state).toBe(FAILED);
  });
});
