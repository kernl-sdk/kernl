import { z } from "zod";
import { tool } from "kernl";

/**
 * @tool
 *
 * Divides two numbers.
 */
export const divide = tool({
  id: "divide",
  description: "Divide two numbers",
  parameters: z.object({
    a: z.number().describe("Numerator"),
    b: z.number().describe("Denominator"),
  }),
  execute: async (ctx, params) => {
    const { a, b } = params;

    if (b === 0) {
      throw new Error("Division by zero");
    }

    return a / b;
  },
});
