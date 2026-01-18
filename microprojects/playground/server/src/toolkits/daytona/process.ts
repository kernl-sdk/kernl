import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";

import { getSandbox, type SandboxContext } from "./client";

/**
 * Execute a shell command.
 */
export const exec = tool({
  id: "process_exec",
  description: "Execute a shell command in the sandbox",
  parameters: z.object({
    command: z.string().describe("Shell command to execute"),
    cwd: z.string().optional().describe("Working directory for the command"),
    timeout: z
      .number()
      .optional()
      .describe("Timeout in seconds (0 = no timeout)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { command, cwd, timeout }) => {
    const sandbox = await getSandbox(ctx);
    return await sandbox.process.executeCommand(
      command,
      cwd,
      undefined,
      timeout,
    );
  },
});

export const process = new Toolkit<SandboxContext>({
  id: "process",
  description: "Shell command execution for Daytona sandboxes",
  tools: [exec],
});
