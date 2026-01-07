# Agent Handoffs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-agent orchestration via a built-in handoff tool that allows agents to delegate to other registered agents.

**Architecture:** Tool-based handoffs using the existing tool system. The `Kernl.run()` method loops through agents, injecting a `handoff` tool that returns a special marker result. When detected, execution transfers to the target agent with the provided context.

**Tech Stack:** TypeScript, Zod v4, Vitest

**Design Doc:** `docs/plans/2026-01-07-agent-handoffs-design.md`

---

## Task 1: Create Handoff Types

**Files:**
- Create: `packages/kernl/src/handoff/types.ts`
- Create: `packages/kernl/src/handoff/__tests__/types.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/kernl/src/handoff/__tests__/types.test.ts
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
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/types.test.ts`
Expected: FAIL with "Cannot find module '../types'"

**Step 3: Write the implementation**

```typescript
// packages/kernl/src/handoff/types.ts

/**
 * Result returned by the handoff tool to signal agent transfer.
 */
export interface HandoffResult {
  kind: "handoff";
  to: string;
  message: string;
  from: string;
}

/**
 * Record of a handoff in the execution chain.
 */
export interface HandoffRecord {
  from: string;
  to: string;
  message: string;
  timestamp: Date;
}

/**
 * Extended run result with handoff chain information.
 */
export interface HandoffRunResult {
  output: string;
  handoffChain: HandoffRecord[];
  finalAgent: string;
}

/**
 * Type guard for HandoffResult.
 */
export function isHandoffResult(value: unknown): value is HandoffResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as HandoffResult).kind === "handoff" &&
    typeof (value as HandoffResult).to === "string" &&
    typeof (value as HandoffResult).message === "string" &&
    typeof (value as HandoffResult).from === "string"
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/types.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add packages/kernl/src/handoff/
git commit -m "feat(handoff): add handoff types and type guard"
```

---

## Task 2: Create Handoff Errors

**Files:**
- Create: `packages/kernl/src/handoff/errors.ts`
- Create: `packages/kernl/src/handoff/__tests__/errors.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/kernl/src/handoff/__tests__/errors.test.ts
import { describe, it, expect } from "vitest";
import { MaxHandoffsExceededError, HandoffTargetNotFoundError } from "../errors";

describe("Handoff Errors", () => {
  describe("MaxHandoffsExceededError", () => {
    it("should format message with limit and chain", () => {
      const chain = [
        { from: "a", to: "b", message: "test", timestamp: new Date() },
        { from: "b", to: "c", message: "test", timestamp: new Date() },
      ];
      const error = new MaxHandoffsExceededError(5, chain);

      expect(error.message).toContain("5");
      expect(error.message).toContain("a");
      expect(error.message).toContain("b");
      expect(error.name).toBe("MaxHandoffsExceededError");
    });

    it("should store chain on error object", () => {
      const chain = [
        { from: "a", to: "b", message: "test", timestamp: new Date() },
      ];
      const error = new MaxHandoffsExceededError(10, chain);

      expect(error.chain).toEqual(chain);
      expect(error.limit).toBe(10);
    });
  });

  describe("HandoffTargetNotFoundError", () => {
    it("should format message with from, to, and available agents", () => {
      const error = new HandoffTargetNotFoundError("researcher", "unknown", ["writer", "analyst"]);

      expect(error.message).toContain("researcher");
      expect(error.message).toContain("unknown");
      expect(error.message).toContain("writer");
      expect(error.message).toContain("analyst");
      expect(error.name).toBe("HandoffTargetNotFoundError");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/errors.test.ts`
Expected: FAIL with "Cannot find module '../errors'"

**Step 3: Write the implementation**

```typescript
// packages/kernl/src/handoff/errors.ts
import { KernlError } from "@/lib/error";
import type { HandoffRecord } from "./types";

/**
 * Thrown when the maximum number of handoffs is exceeded.
 */
export class MaxHandoffsExceededError extends KernlError {
  readonly limit: number;
  readonly chain: HandoffRecord[];

  constructor(limit: number, chain: HandoffRecord[]) {
    const path = chain.map((h) => h.from).join(" → ");
    super(`Max handoffs (${limit}) exceeded. Chain: ${path}`);
    this.name = "MaxHandoffsExceededError";
    this.limit = limit;
    this.chain = chain;
  }
}

/**
 * Thrown when a handoff targets an agent that is not registered.
 */
export class HandoffTargetNotFoundError extends KernlError {
  constructor(from: string, to: string, available: string[]) {
    super(
      `Agent "${from}" tried to handoff to "${to}", but it's not registered. ` +
        `Available: ${available.join(", ")}`
    );
    this.name = "HandoffTargetNotFoundError";
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/errors.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add packages/kernl/src/handoff/errors.ts packages/kernl/src/handoff/__tests__/errors.test.ts
git commit -m "feat(handoff): add handoff error types"
```

---

## Task 3: Create Handoff Tool Factory

**Files:**
- Create: `packages/kernl/src/handoff/tool.ts`
- Create: `packages/kernl/src/handoff/__tests__/tool.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/kernl/src/handoff/__tests__/tool.test.ts
import { describe, it, expect } from "vitest";
import { createHandoffTool } from "../tool";
import { isHandoffResult } from "../types";
import { Context } from "@/context";

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
    const ctx = new Context("test", {});

    const result = await tool.invoke(ctx, { to: "writer", message: "Here are findings" });

    expect(isHandoffResult(result)).toBe(true);
    expect(result).toEqual({
      kind: "handoff",
      to: "writer",
      message: "Here are findings",
      from: "researcher",
    });
  });

  it("should have empty array when no other agents available", () => {
    const tool = createHandoffTool("solo", []);
    expect(tool.description).toContain("Transfer");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/tool.test.ts`
Expected: FAIL with "Cannot find module '../tool'"

**Step 3: Write the implementation**

```typescript
// packages/kernl/src/handoff/tool.ts
import { z } from "zod";
import { tool } from "@/tool";
import type { HandoffResult } from "./types";

/**
 * Creates a handoff tool for an agent with the list of available target agents.
 */
export function createHandoffTool(agentId: string, availableAgents: string[]) {
  const description =
    availableAgents.length > 0
      ? `Transfer execution to another agent. Available agents: ${availableAgents.join(", ")}`
      : "Transfer execution to another agent (no other agents currently available)";

  // Build schema - if no agents available, use string (will fail validation gracefully)
  const toSchema =
    availableAgents.length > 0
      ? z.enum(availableAgents as [string, ...string[]])
      : z.string();

  return tool({
    id: "handoff",
    description,
    parameters: z.object({
      to: toSchema.describe("The ID of the agent to hand off to"),
      message: z
        .string()
        .describe("Context and instructions for the target agent"),
    }),
    execute: async ({ parameters }): Promise<HandoffResult> => {
      return {
        kind: "handoff",
        to: parameters.to,
        message: parameters.message,
        from: agentId,
      };
    },
  });
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/tool.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add packages/kernl/src/handoff/tool.ts packages/kernl/src/handoff/__tests__/tool.test.ts
git commit -m "feat(handoff): add handoff tool factory"
```

---

## Task 4: Create Handoff Utils

**Files:**
- Create: `packages/kernl/src/handoff/utils.ts`
- Create: `packages/kernl/src/handoff/__tests__/utils.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/kernl/src/handoff/__tests__/utils.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/utils.test.ts`
Expected: FAIL with "Cannot find module '../utils'"

**Step 3: Write the implementation**

```typescript
// packages/kernl/src/handoff/utils.ts
import { isHandoffResult, type HandoffResult } from "./types";

/**
 * Extracts a handoff result from an agent's output.
 * Checks both direct results and wrapped results (e.g., { output: HandoffResult }).
 */
export function extractHandoff(result: unknown): HandoffResult | null {
  if (result == null) {
    return null;
  }

  // Check if result is directly a handoff
  if (isHandoffResult(result)) {
    return result;
  }

  // Check if result has an output property that is a handoff
  if (typeof result === "object" && "output" in result) {
    const output = (result as { output: unknown }).output;
    if (isHandoffResult(output)) {
      return output;
    }
  }

  return null;
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/utils.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add packages/kernl/src/handoff/utils.ts packages/kernl/src/handoff/__tests__/utils.test.ts
git commit -m "feat(handoff): add extractHandoff utility"
```

---

## Task 5: Create Handoff Index (Exports)

**Files:**
- Create: `packages/kernl/src/handoff/index.ts`

**Step 1: Create the index file**

```typescript
// packages/kernl/src/handoff/index.ts
export { isHandoffResult } from "./types";
export type { HandoffResult, HandoffRecord, HandoffRunResult } from "./types";

export { createHandoffTool } from "./tool";

export { extractHandoff } from "./utils";

export {
  MaxHandoffsExceededError,
  HandoffTargetNotFoundError,
} from "./errors";
```

**Step 2: Run all handoff tests to verify exports work**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/`
Expected: PASS (all tests)

**Step 3: Commit**

```bash
git add packages/kernl/src/handoff/index.ts
git commit -m "feat(handoff): add handoff module exports"
```

---

## Task 6: Add agent_handoff Lifecycle Hook

**Files:**
- Modify: `packages/kernl/src/kernl/types.ts`
- Create: `packages/kernl/src/kernl/__tests__/hooks.test.ts` (if not exists, add to existing)

**Step 1: Read existing types file**

Run: `cat packages/kernl/src/kernl/types.ts | head -100`
(Understand existing KernlHooks interface structure)

**Step 2: Write the failing test**

```typescript
// Add to packages/kernl/src/kernl/__tests__/hooks.test.ts or create new
import { describe, it, expect, vi } from "vitest";
import type { KernlHooks } from "../types";
import type { HandoffResult } from "@/handoff";

describe("KernlHooks", () => {
  it("should have agent_handoff event type", () => {
    // Type check - this test passes if it compiles
    const hooks: Partial<KernlHooks> = {
      agent_handoff: [
        (context, agent, handoff) => {
          // Type assertions
          const _to: string = handoff.to;
          const _from: string = handoff.from;
          const _message: string = handoff.message;
        },
      ],
    };
    expect(hooks.agent_handoff).toBeDefined();
  });
});
```

**Step 3: Modify types.ts to add agent_handoff hook**

Find the `KernlHooks` interface and add:

```typescript
// In packages/kernl/src/kernl/types.ts
import type { HandoffResult } from "@/handoff";

// Add to KernlHooks interface:
agent_handoff: (context: Context, agent: Agent, handoff: HandoffResult) => void;
```

**Step 4: Run test to verify it passes**

Run: `cd packages/kernl && npx vitest run src/kernl/__tests__/`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/kernl/src/kernl/types.ts packages/kernl/src/kernl/__tests__/
git commit -m "feat(handoff): add agent_handoff lifecycle hook type"
```

---

## Task 7: Implement Handoff Loop in Kernl.run()

**Files:**
- Modify: `packages/kernl/src/kernl/kernl.ts`
- Create: `packages/kernl/src/handoff/__tests__/integration.test.ts`

**Step 1: Write the integration test**

```typescript
// packages/kernl/src/handoff/__tests__/integration.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { tool, FunctionToolkit } from "@/tool";
import { z } from "zod";
import { createMockModel } from "@/thread/__tests__/fixtures/mock-model";
import { MaxHandoffsExceededError } from "../errors";

describe("Handoff Integration", () => {
  // Helper to create mock model that triggers handoff
  function createHandoffModel(handoffTo: string, handoffMessage: string) {
    return createMockModel(async (req) => {
      // Find handoff tool and call it
      const handoffTool = req.tools?.find((t) => t.name === "handoff");
      if (handoffTool) {
        return {
          content: [
            {
              kind: "tool-call",
              toolCallId: "call-1",
              toolName: "handoff",
              args: { to: handoffTo, message: handoffMessage },
            },
          ],
          finishReason: "tool-calls",
          usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
          warnings: [],
        };
      }
      return {
        content: [{ kind: "text", text: "No handoff tool available" }],
        finishReason: "stop",
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        warnings: [],
      };
    });
  }

  // Helper to create mock model that returns final response
  function createFinalModel(response: string) {
    return createMockModel(async () => ({
      content: [{ kind: "text", text: response }],
      finishReason: "stop",
      usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
      warnings: [],
    }));
  }

  it("should execute single agent without handoff", async () => {
    const model = createFinalModel("Hello from solo agent");
    const agent = new Agent({
      id: "solo",
      name: "Solo",
      model,
      instructions: "You work alone",
    });

    const kernl = new Kernl();
    kernl.register(agent);

    const result = await kernl.run("solo", "Do something");

    expect(result.output).toBe("Hello from solo agent");
    expect(result.finalAgent).toBe("solo");
    expect(result.handoffChain).toHaveLength(0);
  });

  it("should handle two-agent handoff", async () => {
    const researcherModel = createHandoffModel("writer", "Research findings...");
    const writerModel = createFinalModel("Final article based on research");

    const researcher = new Agent({
      id: "researcher",
      name: "Researcher",
      model: researcherModel,
      instructions: "Research and hand off to writer",
    });

    const writer = new Agent({
      id: "writer",
      name: "Writer",
      model: writerModel,
      instructions: "Write based on research",
    });

    const kernl = new Kernl();
    kernl.register(researcher, writer);

    const result = await kernl.run("researcher", "Write about AI");

    expect(result.output).toBe("Final article based on research");
    expect(result.finalAgent).toBe("writer");
    expect(result.handoffChain).toHaveLength(1);
    expect(result.handoffChain[0].from).toBe("researcher");
    expect(result.handoffChain[0].to).toBe("writer");
  });

  it("should emit agent_handoff hook", async () => {
    const researcherModel = createHandoffModel("writer", "Findings");
    const writerModel = createFinalModel("Done");

    const researcher = new Agent({
      id: "researcher",
      name: "Researcher",
      model: researcherModel,
      instructions: "Research",
    });

    const writer = new Agent({
      id: "writer",
      name: "Writer",
      model: writerModel,
      instructions: "Write",
    });

    const kernl = new Kernl();
    kernl.register(researcher, writer);

    const handoffListener = vi.fn();
    kernl.on("agent_handoff", handoffListener);

    await kernl.run("researcher", "Test");

    expect(handoffListener).toHaveBeenCalledTimes(1);
    expect(handoffListener).toHaveBeenCalledWith(
      expect.anything(), // context
      researcher,
      expect.objectContaining({ to: "writer", from: "researcher" })
    );
  });

  it("should enforce maxHandoffs limit", async () => {
    // Create agents that ping-pong forever
    const agentA = new Agent({
      id: "agent-a",
      name: "Agent A",
      model: createHandoffModel("agent-b", "Passing to B"),
      instructions: "Pass to B",
    });

    const agentB = new Agent({
      id: "agent-b",
      name: "Agent B",
      model: createHandoffModel("agent-a", "Passing to A"),
      instructions: "Pass to A",
    });

    const kernl = new Kernl();
    kernl.register(agentA, agentB);

    await expect(
      kernl.run("agent-a", "Start", { maxHandoffs: 3 })
    ).rejects.toThrow(MaxHandoffsExceededError);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/integration.test.ts`
Expected: FAIL (run() doesn't return handoff chain yet)

**Step 3: Modify Kernl.run() to implement handoff loop**

Read the existing `packages/kernl/src/kernl/kernl.ts` and modify the `run()` method to:

1. Get list of other agent IDs
2. Create handoff tool if multiple agents
3. Loop with handoff detection
4. Return HandoffRunResult

(The exact implementation depends on the current structure of kernl.ts - read it first)

**Step 4: Run test to verify it passes**

Run: `cd packages/kernl && npx vitest run src/handoff/__tests__/integration.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add packages/kernl/src/kernl/kernl.ts packages/kernl/src/handoff/__tests__/integration.test.ts
git commit -m "feat(handoff): implement handoff loop in Kernl.run()"
```

---

## Task 8: Export Handoff Types from Main Package

**Files:**
- Modify: `packages/kernl/src/index.ts`

**Step 1: Add handoff exports**

```typescript
// Add to packages/kernl/src/index.ts
export {
  isHandoffResult,
  MaxHandoffsExceededError,
  HandoffTargetNotFoundError,
} from "./handoff";

export type {
  HandoffResult,
  HandoffRecord,
  HandoffRunResult,
} from "./handoff";
```

**Step 2: Run build to verify exports work**

Run: `cd packages/kernl && pnpm build`
Expected: SUCCESS

**Step 3: Commit**

```bash
git add packages/kernl/src/index.ts
git commit -m "feat(handoff): export handoff types from main package"
```

---

## Task 9: Run Full Test Suite

**Step 1: Run all tests**

Run: `cd packages/kernl && npx vitest run`
Expected: All tests pass

**Step 2: Run build**

Run: `pnpm build`
Expected: SUCCESS

**Step 3: Final commit if any cleanup needed**

```bash
git status
# If any files need cleanup, commit them
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Handoff types | 6 |
| 2 | Handoff errors | 3 |
| 3 | Handoff tool factory | 4 |
| 4 | extractHandoff utility | 6 |
| 5 | Module exports | - |
| 6 | Lifecycle hook type | 1 |
| 7 | Kernl.run() integration | 4 |
| 8 | Package exports | - |
| 9 | Full test suite | - |

**Total new tests:** ~24
**Estimated LOC:** ~150
