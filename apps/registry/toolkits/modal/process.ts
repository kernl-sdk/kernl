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
    timeout: z
      .number()
      .optional()
      .describe("Command timeout in seconds (default: 60)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { command, timeout }) => {
    const sandbox = await getSandbox(ctx);

    const options: Record<string, unknown> = {};
    if (timeout) {
      options.timeout = timeout * 1000;
    }

    const proc = await sandbox.exec(["bash", "-c", command], options);

    const stdout = await proc.stdout.readText();
    const stderr = await proc.stderr.readText();
    const exitCode = await proc.wait();

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode,
    };
  },
});

export const process = new Toolkit<SandboxContext>({
  id: "process",
  description: "Shell command execution for Modal sandboxes",
  tools: [exec],
});
