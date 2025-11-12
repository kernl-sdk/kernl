import { z } from "zod";
import { Context, tool } from "kernl";

const MultiplyParams = z.object({
  a: z.number().describe("First number"),
  b: z.number().describe("Second number"),
});

type MultiplyParams = z.infer<typeof MultiplyParams>;

/**
 * @tool
 *
 * Multiplies two numbers.
 */
export const multiply = tool({
  id: "multiply",
  name: "multiply",
  description: "Multiply two numbers",
  parameters: MultiplyParams,
  execute: _multiply,
});

/**
 * Multiplies two numbers together.
 */
async function _multiply(
  context: Context,
  params: MultiplyParams,
): Promise<number> {
  const { a, b } = params;
  return a * b;
}
