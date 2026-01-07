# Agent Handoffs Design

> Multi-agent orchestration via a built-in handoff tool

**Date:** 2026-01-07
**Status:** Approved
**Author:** Claude + User

## Overview

Add support for multi-agent orchestration through a simple, tool-based handoff mechanism. Agents can delegate to other registered agents by calling a built-in `handoff` tool, enabling patterns like sequential pipelines, router/dispatcher, and collaborative swarms.

## Goals

- **Simplicity First:** Minimal API surface, easy to understand
- **Fits Existing Model:** Uses the tool system, no new execution concepts
- **Flexible Patterns:** Enables sequential, routing, and parallel patterns
- **Safe by Default:** Built-in limits prevent runaway handoff chains

## Non-Goals (Future Extensions)

- Resource/token budgets across handoff chains
- Parallel agent execution (swarm pattern)
- Deep observability/tracing integration
- Approval workflows for handoffs

## API Design

### Basic Usage

```typescript
import { Agent, Kernl } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

const researcher = new Agent({
  id: "researcher",
  name: "Researcher",
  model: anthropic("claude-sonnet-4-20250514"),
  instructions: `You research topics. When done, hand off to the writer.
                 Use the handoff tool with your findings.`,
});

const writer = new Agent({
  id: "writer",
  name: "Writer",
  model: anthropic("claude-sonnet-4-20250514"),
  instructions: "You write articles based on research provided to you.",
});

const kernl = new Kernl();
kernl.register(researcher, writer);

// Start with researcher - may hand off to writer automatically
const result = await kernl.run("researcher", "Write about quantum computing");

console.log(result.output);        // Final article from writer
console.log(result.finalAgent);    // "writer"
console.log(result.handoffChain);  // [{ from: "researcher", to: "writer", ... }]
```

### The Handoff Tool

Every agent registered with Kernl automatically gets access to a built-in `handoff` tool:

```typescript
// Tool signature (auto-injected)
handoff({
  to: string,      // Target agent ID
  message: string, // Context/instructions for the target agent
})
```

The tool description includes available agent IDs so the LLM knows its options.

## Types

### HandoffResult

```typescript
export interface HandoffResult {
  kind: "handoff";
  to: string;        // Target agent ID
  message: string;   // Context passed to target
  from: string;      // Source agent ID (auto-filled)
}

export function isHandoffResult(value: unknown): value is HandoffResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).kind === "handoff"
  );
}
```

### HandoffRecord

```typescript
export interface HandoffRecord {
  from: string;
  to: string;
  message: string;
  timestamp: Date;
}
```

### RunResult

```typescript
export interface RunResult {
  output: string;                    // Final agent's response
  handoffChain: HandoffRecord[];     // Empty if no handoffs occurred
  finalAgent: string;                // Which agent produced the output
}
```

## Implementation

### Handoff Tool Factory

```typescript
// packages/kernl/src/handoff/tool.ts
import { tool } from "@/tool";
import { z } from "zod";

export function createHandoffTool(agentId: string, availableAgents: string[]) {
  return tool({
    id: "handoff",
    description: `Transfer to another agent. Available: ${availableAgents.join(", ")}`,
    parameters: z.object({
      to: z.enum(availableAgents as [string, ...string[]]),
      message: z.string().describe("Context and instructions for the target agent"),
    }),
    execute: async ({ parameters }) => {
      return {
        kind: "handoff",
        to: parameters.to,
        message: parameters.message,
        from: agentId,
      } satisfies HandoffResult;
    },
  });
}
```

### Runner Loop

```typescript
// In packages/kernl/src/kernl/kernl.ts

async run(agentId: string, input: string, options?: RunOptions): Promise<RunResult> {
  let currentAgentId = agentId;
  let currentInput = input;
  const handoffChain: HandoffRecord[] = [];

  const maxHandoffs = options?.maxHandoffs ?? 10;

  for (let i = 0; i <= maxHandoffs; i++) {
    const agent = this.getAgent(currentAgentId);
    if (!agent) {
      throw new MisconfiguredError(`Agent not found: ${currentAgentId}`);
    }

    // Inject handoff tool with available targets
    const otherAgents = this.getAgentIds().filter(id => id !== currentAgentId);
    const handoffTool = createHandoffTool(currentAgentId, otherAgents);

    // Run the agent
    const result = await agent.run(currentInput, {
      ...options,
      additionalTools: [handoffTool],
    });

    // Check if result contains a handoff
    const handoff = extractHandoff(result);

    if (handoff) {
      handoffChain.push({
        from: currentAgentId,
        to: handoff.to,
        message: handoff.message,
        timestamp: new Date(),
      });

      // Emit lifecycle hook
      this.emit("agent_handoff", this.context, agent, handoff);

      // Continue with target agent
      currentAgentId = handoff.to;
      currentInput = handoff.message;
    } else {
      // No handoff - we're done
      return {
        output: result.output,
        handoffChain,
        finalAgent: currentAgentId,
      };
    }
  }

  throw new MaxHandoffsExceededError(maxHandoffs, handoffChain);
}
```

### Error Types

```typescript
// packages/kernl/src/handoff/errors.ts

export class MaxHandoffsExceededError extends KernlError {
  constructor(limit: number, chain: HandoffRecord[]) {
    super(
      `Max handoffs (${limit}) exceeded. Chain: ${chain.map(h => h.from).join(" → ")}`
    );
  }
}

export class HandoffTargetNotFoundError extends KernlError {
  constructor(from: string, to: string, available: string[]) {
    super(
      `Agent "${from}" tried to handoff to "${to}", but it's not registered. ` +
      `Available: ${available.join(", ")}`
    );
  }
}
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Agent hands off to itself | Allowed (retry with different approach) |
| Target agent not registered | Throw `HandoffTargetNotFoundError` |
| Circular handoffs (A→B→A→B...) | Stopped by `maxHandoffs` limit |
| No agents to hand off to | Handoff tool not injected (single agent) |
| Handoff in streaming mode | Handoff detected after stream completes |

## File Structure

### New Files

```
packages/kernl/src/
├── handoff/
│   ├── index.ts           # Public exports
│   ├── types.ts           # HandoffResult, HandoffRecord, RunResult
│   ├── tool.ts            # createHandoffTool()
│   ├── errors.ts          # MaxHandoffsExceededError, etc.
│   ├── utils.ts           # isHandoffResult(), extractHandoff()
│   └── __tests__/
│       ├── handoff.test.ts        # Unit tests
│       └── integration.test.ts    # Multi-agent flow tests
```

### Modified Files

```
packages/kernl/src/
├── kernl/
│   ├── kernl.ts           # Add handoff loop to run()
│   └── types.ts           # Extend KernlHooks with agent_handoff
├── index.ts               # Export handoff types
```

### Public Exports

```typescript
// packages/kernl/src/index.ts
export type { HandoffResult, HandoffRecord, RunResult } from "./handoff";
export { isHandoffResult } from "./handoff";
```

## Test Plan

### Unit Tests

- Handoff tool creation with available agents
- `isHandoffResult()` type guard
- `extractHandoff()` from various result shapes
- Error construction and messages

### Integration Tests

- Two-agent handoff (researcher → writer)
- Three-agent chain (A → B → C)
- Max handoffs limit enforcement
- Agent not found error
- Single agent (no handoff tool injected)
- Self-handoff allowed
- Lifecycle hook emission

## Configuration

```typescript
await kernl.run("researcher", "...", {
  maxHandoffs: 5,  // Default: 10
});
```

## Future Extensions

Once the basic handoff mechanism is proven, these can be added:

1. **Resource Budgets:** Token limits across the chain
2. **Parallel Execution:** Multiple agents working simultaneously
3. **Handoff Conditions:** Declarative rules for automatic routing
4. **Approval Workflows:** Human-in-the-loop for sensitive handoffs
5. **Observability:** OpenTelemetry spans for each handoff

## Summary

This design adds multi-agent handoffs with:

- ~150 lines of new code
- 1 new concept (handoff tool)
- Full backward compatibility
- Clear execution tracing
- Safety limits built-in
