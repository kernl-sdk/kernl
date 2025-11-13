import { z } from "zod";
import { Context, tool } from "kernl";

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
  execute: _multiply,
});

type MultiplyParams = z.infer<typeof multiply.parameters>;

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
