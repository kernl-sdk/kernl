import { z } from "zod";
import { Context, tool } from "kernl";

const SubtractParams = z.object({
  a: z.number().describe("First number"),
  b: z.number().describe("Second number"),
});

type SubtractParams = z.infer<typeof SubtractParams>;

/**
 * @tool
 *
 * Subtracts two numbers.
 */
export const subtract = tool({
  id: "subtract",
  name: "subtract",
  description: "Subtract two numbers",
  parameters: SubtractParams,
  execute: _subtract,
});

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
