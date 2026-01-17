import { z } from "zod";
import { tool, type Context } from "kernl";
import { spawn } from "node:child_process";

import type { BaseContext } from "@/lib/context";
import { safeResolve } from "@/util/path";

const DEFAULT_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const MAX_OUTPUT = 100_000; // 100KB

/**
 * @tool
 *
 * Executes a bash command with optional timeout.
 * Use for terminal operations like git, npm, docker, etc.
 */
export const bash = tool({
  id: "bash",
  description: `Executes a bash command with optional timeout.

Usage:
- Use for terminal operations like git, npm, docker, etc.
- Do NOT use for file operations - use dedicated tools (Read, Write, Edit, Glob, Grep)
- Commands run in the specified workdir (defaults to cwd)
- Use workdir parameter instead of 'cd' commands
- Timeout defaults to 2 minutes

Guidelines:
- Quote paths with spaces: mkdir "/path with spaces"
- Chain dependent commands with &&: git add . && git commit -m "msg"
- For independent commands, make multiple tool calls in parallel
- Avoid: find, grep, cat, head, tail, sed, awk - use dedicated tools instead`,
  parameters: z.object({
    command: z.string().describe("The bash command to execute"),
    workdir: z
      .string()
      .optional()
      .describe("Working directory for the command"),
    timeout: z
      .number()
      .optional()
      .describe("Timeout in milliseconds (default: 120000)"),
    description: z
      .string()
      .optional()
      .describe("Short description of what this command does (5-10 words)"),
  }),
  async execute(ctx: Context<BaseContext>, params) {
    const baseDir = ctx.context.directory;
    let cwd = baseDir;

    if (params.workdir) {
      const resolved = safeResolve(baseDir, params.workdir);
      if (!resolved) {
        throw new Error(`Working directory escapes workspace: ${params.workdir}`);
      }
      cwd = resolved;
    }
    const timeout = params.timeout ?? DEFAULT_TIMEOUT;

    return new Promise((resolve, reject) => {
      const proc = spawn(params.command, {
        shell: true,
        cwd,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let output = "";
      let truncated = false;

      const append = (chunk: Buffer) => {
        if (truncated) return;
        const text = chunk.toString();
        if (output.length + text.length > MAX_OUTPUT) {
          output += text.slice(0, MAX_OUTPUT - output.length);
          output += "\n\n(Output truncated at 100KB)";
          truncated = true;
        } else {
          output += text;
        }
      };

      proc.stdout?.on("data", append);
      proc.stderr?.on("data", append);

      const timer = setTimeout(() => {
        proc.kill("SIGTERM");
        setTimeout(() => proc.kill("SIGKILL"), 1000);
      }, timeout);

      proc.once("exit", (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          output += `\n\n(Exit code: ${code})`;
        }
        resolve(output || "(No output)");
      });

      proc.once("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  },
});
