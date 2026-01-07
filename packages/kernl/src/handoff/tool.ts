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
    execute: async (_ctx, params): Promise<HandoffResult> => {
      return {
        kind: "handoff",
        to: params.to,
        message: params.message,
        from: agentId,
      };
    },
  });
}
