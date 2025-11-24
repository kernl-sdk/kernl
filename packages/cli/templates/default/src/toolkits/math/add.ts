import { z } from "zod";
import { tool } from "kernl";

/**
 * @tool
 *
 * Adds two numbers.
 */
export const add = tool({
  id: "add",
  description: "Add two numbers",
  parameters: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
  execute: async (ctx, params) => {
    const { a, b } = params;
    return a + b;
  },
});
