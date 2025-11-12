import { z } from "zod";
import { Context, tool } from "kernl";

const DivideParams = z.object({
  a: z.number().describe("Numerator"),
  b: z.number().describe("Denominator"),
});

type DivideParams = z.infer<typeof DivideParams>;

/**
 * @tool
 *
 * Divides two numbers.
 */
export const divide = tool({
  id: "divide",
  name: "divide",
  description: "Divide two numbers",
  parameters: DivideParams,
  execute: _divide,
});

/**
 * Divides one number by another.
 * Throws an error if division by zero is attempted.
 */
async function _divide(
  context: Context,
  params: DivideParams,
): Promise<number> {
  const { a, b } = params;

  if (b === 0) {
    throw new Error("Division by zero");
  }

  return a / b;
}
