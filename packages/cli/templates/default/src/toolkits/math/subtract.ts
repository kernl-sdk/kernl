import { z } from "zod";
import { tool } from "kernl";

/**
 * @tool
 *
 * Subtracts two numbers.
 */
export const subtract = tool({
  id: "subtract",
  description: "Subtract two numbers",
  parameters: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
  execute: async (ctx, params) => {
    const { a, b } = params;
    return a - b;
  },
});
