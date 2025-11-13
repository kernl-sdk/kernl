import { z } from "zod";
import { tool } from "@kernl/core";

/**
 * @tool
 *
 * Multiplies two numbers.
 */
export const multiply = tool({
  id: "multiply",
  description: "Multiply two numbers",
  parameters: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
  execute: async (ctx, params) => {
    const { a, b } = params;
    return a * b;
  },
});
