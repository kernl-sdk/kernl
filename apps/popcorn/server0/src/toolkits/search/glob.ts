import { z } from "zod";
import { tool, type Context } from "kernl";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { spawn } from "node:child_process";

import type { BaseContext } from "@/lib/context";
import { safeResolve } from "@/util/path";

const DESCRIPTION = `- Fast file pattern matching tool that works with any codebase size
- Supports glob patterns like "**/*.js" or "src/**/*.ts"
- Returns matching file paths sorted by modification time
- Use this tool when you need to find files by name patterns
- When you are doing an open-ended search that may require multiple rounds of globbing and grepping, use the Task tool instead
- You have the capability to call multiple tools in a single response. It is always better to speculatively perform multiple searches as a batch that are potentially useful.`;

const LIMIT = 100;

/**
 * @tool
 *
 * Fast file pattern matching using glob patterns.
 * Returns matching file paths sorted by modification time.
 */
export const glob = tool({
  id: "glob",
  description: DESCRIPTION,
  parameters: z.object({
    pattern: z.string().describe("The glob pattern to match files against"),
    path: z
      .string()
      .optional()
      .describe(
        `The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided.`,
      ),
  }),
  async execute(ctx: Context<BaseContext>, params) {
    const baseDir = ctx.context.directory;
    const searchPath = safeResolve(baseDir, params.path || ".");

    if (!searchPath) {
      throw new Error(`Path escapes workspace directory: ${params.path}`);
    }

    // use ripgrep --files with glob pattern
    const files = await rgFiles(searchPath, params.pattern, LIMIT);

    if (files.length === 0) {
      return "No files found";
    }

    // get modification times and sort
    const withMtime = await Promise.all(
      files.map(async (file) => {
        try {
          const stats = await fs.stat(file);
          return { path: file, mtime: stats.mtime.getTime() };
        } catch {
          return { path: file, mtime: 0 };
        }
      }),
    );

    withMtime.sort((a, b) => b.mtime - a.mtime);

    const output: string[] = withMtime.map((f) => f.path);

    if (files.length >= LIMIT) {
      output.push("");
      output.push(
        "(Results are truncated. Consider using a more specific path or pattern.)",
      );
    }

    return output.join("\n");
  },
});

async function rgFiles(
  cwd: string,
  pattern: string,
  limit: number,
): Promise<string[]> {
  return new Promise((resolve) => {
    const proc = spawn("rg", ["--files", "--glob", pattern], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    proc.stdout?.on("data", (chunk) => {
      output += chunk.toString();
    });

    proc.once("exit", () => {
      const files = output
        .trim()
        .split("\n")
        .filter(Boolean)
        .slice(0, limit)
        .map((f) => path.resolve(cwd, f));
      resolve(files);
    });

    proc.once("error", () => {
      resolve([]);
    });
  });
}
