import { describe, it, expect } from "vitest";
import { extractHandoff } from "../utils";
import type { HandoffResult } from "../types";

describe("extractHandoff", () => {
  it("should extract handoff from direct result", () => {
    const handoff: HandoffResult = {
      kind: "handoff",
      to: "writer",
      message: "test",
      from: "researcher",
    };

    expect(extractHandoff(handoff)).toEqual(handoff);
  });

  it("should extract handoff from object with output property", () => {
    const handoff: HandoffResult = {
      kind: "handoff",
      to: "writer",
      message: "test",
      from: "researcher",
    };

    expect(extractHandoff({ output: handoff })).toEqual(handoff);
  });

  it("should return null for string output", () => {
    expect(extractHandoff("regular response")).toBeNull();
  });

  it("should return null for object without handoff", () => {
    expect(extractHandoff({ output: "regular response" })).toBeNull();
  });

  it("should return null for null input", () => {
    expect(extractHandoff(null)).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(extractHandoff(undefined)).toBeNull();
  });
});
