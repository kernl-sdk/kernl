import { z } from "zod";
import { Context, tool } from "kernl";

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
  execute: _add,
});

type AddParams = z.infer<typeof add.parameters>;

/**
 * Adds two numbers together.
 */
async function _add(context: Context, params: AddParams): Promise<number> {
  const { a, b } = params;
  return a + b;
}
