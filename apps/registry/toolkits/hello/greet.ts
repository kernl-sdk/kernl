import { z } from "zod";
import { tool } from "kernl";

export const greet = tool({
  id: "greet",
  description: "Greet someone by name",
  parameters: z.object({
    name: z.string().describe("Name of the person to greet"),
  }),
  execute: async (ctx, params) => {
    return `Hello, ${params.name}!`;
  },
});
