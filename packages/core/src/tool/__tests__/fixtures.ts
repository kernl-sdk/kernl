import { z } from "zod";
import { Context } from "@/context";
import { tool, HostedTool } from "../tool";

/**
 * Create a minimal mock context for testing
 */
export const mockContext = <T = any>(data?: T): Context<T> => {
  return new Context<T>(data ?? ({} as T));
};

/**
 * Simple string tool with no parameters
 */
export const simpleStringTool = tool({
  id: "simple",
  description: "A simple tool that echoes input",
  parameters: undefined,
  execute: async (ctx, input: string) => `Echo: ${input}`,
});

/**
 * Tool with Zod schema validation
 */
export const zodTool = tool({
  id: "zod-tool",
  description: "Tool with Zod schema",
  parameters: z.object({
    name: z.string(),
    age: z.number(),
  }),
  execute: async (ctx, { name, age }) => `${name} is ${age} years old`,
});

/**
 * Tool that always throws an error
 */
export const errorTool = tool({
  id: "error-tool",
  description: "Always throws an error",
  parameters: undefined,
  execute: async () => {
    throw new Error("Tool execution failed");
  },
});

/**
 * Tool with custom error handler
 */
export const customErrorTool = tool({
  id: "custom-error-tool",
  description: "Tool with custom error handler",
  parameters: undefined,
  execute: async () => {
    throw new Error("Original error");
  },
  errorfn: (ctx, error) => {
    return "Custom error message";
  },
});

/**
 * Tool requiring approval (boolean)
 */
export const approvalRequiredTool = tool({
  id: "approval-tool",
  description: "Requires approval",
  parameters: undefined,
  requiresApproval: true,
  execute: async () => "executed",
});

/**
 * Tool with conditional approval (function)
 */
export const conditionalApprovalTool = tool({
  id: "conditional-approval",
  description: "Conditionally requires approval",
  parameters: z.object({
    dangerous: z.boolean(),
  }),
  requiresApproval: async (ctx, input) => {
    return input.dangerous === true;
  },
  execute: async (ctx, { dangerous }) => `Executed with dangerous=${dangerous}`,
});

/**
 * Mock hosted tool (e.g., web_search)
 */
export const mockHostedTool = new HostedTool({
  id: "web-search",
  name: "Web Search",
  providerData: {
    provider: "anthropic",
    capabilities: ["search", "fetch"],
  },
});

/**
 * Another mock hosted tool
 */
export const anotherHostedTool = new HostedTool({
  id: "file-search",
  name: "File Search",
});
