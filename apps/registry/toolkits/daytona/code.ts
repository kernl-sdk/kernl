import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";

import { getSandbox, type SandboxContext } from "./client";

/**
 * Run Python code in the sandbox.
 */
export const interpreter = tool({
  id: "code_interpreter",
  description:
    "Run Python code in a stateful interpreter. Variables and imports persist across calls.",
  parameters: z.object({
    code: z.string().describe("Python code to execute"),
    timeout: z
      .number()
      .optional()
      .describe("Timeout in seconds (default: 600)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { code, timeout }) => {
    const sandbox = await getSandbox(ctx);
    return await sandbox.codeInterpreter.runCode(code, {
      timeout: timeout ?? 600,
    });
  },
});

export const code = new Toolkit<SandboxContext>({
  id: "code_interpreter",
  description: "Stateful Python code interpreter",
  tools: [interpreter],
});
