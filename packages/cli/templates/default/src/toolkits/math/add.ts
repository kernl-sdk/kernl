import { z } from "zod";
import { Context, tool } from "kernl";

const AddParams = z.object({
  a: z.number().describe("First number"),
  b: z.number().describe("Second number"),
});

type AddParams = z.infer<typeof AddParams>;

/**
 * @tool
 *
 * Adds two numbers.
 */
export const add = tool({
  id: "add",
  name: "add",
  description: "Add two numbers",
  parameters: AddParams,
  execute: _add,
});

/**
 * Adds two numbers together.
 */
async function _add(context: Context, params: AddParams): Promise<number> {
  const { a, b } = params;
  return a + b;
}
