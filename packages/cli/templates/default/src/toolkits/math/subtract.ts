import { z } from "zod";
import { Context, tool } from "kernl";

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
  execute: _subtract,
});

type SubtractParams = z.infer<typeof subtract.parameters>;

/**
 * Subtracts two numbers using the fanciest algorithm on earth.
 */
async function _subtract(
  context: Context,
  params: SubtractParams,
): Promise<number> {
  const { a, b } = params;
  return a - b;
}
