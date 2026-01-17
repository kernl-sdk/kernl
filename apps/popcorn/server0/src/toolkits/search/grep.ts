import { z } from "zod";
import { tool, type Context } from "kernl";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { spawn } from "node:child_process";

import type { BaseContext } from "@/lib/context";
import { safeResolve } from "@/util/path";

const DESCRIPTION = `- Fast content search tool that works with any codebase size
- Searches file contents using regular expressions
- Supports full regex syntax (eg. "log.*Error", "function\\s+\\w+", etc.)
- Filter files by pattern with the include parameter (eg. "*.js", "*.{ts,tsx}")
- Returns file paths and line numbers with at least one match sorted by modification time
- Use this tool when you need to find files containing specific patterns
- If you need to identify/count the number of matches within files, use the Bash tool with \`rg\` (ripgrep) directly. Do NOT use \`grep\`.
- When you are doing an open-ended search that may require multiple rounds of globbing and grepping, use the Task tool instead`;

const MAX_LINE_LENGTH = 2000;
const LIMIT = 100;

interface Match {
  path: string;
  mtime: number;
  lineNum: number;
  lineText: string;
}

/**
 * @tool
 *
 * Fast content search using regular expressions.
 * Returns file paths and line numbers sorted by modification time.
 */
export const grep = tool({
  id: "grep",
  description: DESCRIPTION,
  parameters: z.object({
    pattern: z
      .string()
      .describe("The regex pattern to search for in file contents"),
    path: z
      .string()
      .optional()
      .describe(
        "The directory to search in. Defaults to the current working directory.",
      ),
    include: z
      .string()
      .optional()
      .describe(
        'File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")',
      ),
  }),
  async execute(ctx: Context<BaseContext>, params) {
    if (!params.pattern) {
      throw new Error("pattern is required");
    }

    const baseDir = ctx.context.directory;
    const searchPath = safeResolve(baseDir, params.path || ".");

    if (!searchPath) {
      throw new Error(`Path escapes workspace directory: ${params.path}`);
    }

    const matches = await rgSearch(
      searchPath,
      params.pattern,
      params.include,
      LIMIT,
    );

    if (matches.length === 0) {
      return "No files found";
    }

    // get modification times
    const withMtime = await Promise.all(
      matches.map(async (m) => {
        try {
          const stats = await fs.stat(m.path);
          return { ...m, mtime: stats.mtime.getTime() };
        } catch {
          return { ...m, mtime: 0 };
        }
      }),
    );

    withMtime.sort((a, b) => b.mtime - a.mtime);

    const truncated = matches.length >= LIMIT;
    const output: string[] = [`Found ${withMtime.length} matches`];

    let currentFile = "";
    for (const match of withMtime) {
      if (currentFile !== match.path) {
        if (currentFile !== "") {
          output.push("");
        }
        currentFile = match.path;
        output.push(`${match.path}:`);
      }
      const truncatedLineText =
        match.lineText.length > MAX_LINE_LENGTH
          ? match.lineText.substring(0, MAX_LINE_LENGTH) + "..."
          : match.lineText;
      output.push(`  Line ${match.lineNum}: ${truncatedLineText}`);
    }

    if (truncated) {
      output.push("");
      output.push(
        "(Results are truncated. Consider using a more specific path or pattern.)",
      );
    }

    return output.join("\n");
  },
});

async function rgSearch(
  cwd: string,
  pattern: string,
  include: string | undefined,
  limit: number,
): Promise<Match[]> {
  return new Promise((resolve) => {
    const args = [
      "-nH",
      "--hidden",
      "--follow",
      "--field-match-separator=|",
      "--regexp",
      pattern,
    ];

    if (include) {
      args.push("--glob", include);
    }

    args.push(cwd);

    const proc = spawn("rg", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    proc.stdout?.on("data", (chunk) => {
      output += chunk.toString();
    });

    proc.once("exit", (code) => {
      if (code === 1 || !output.trim()) {
        resolve([]);
        return;
      }

      const lines = output.trim().split(/\r?\n/);
      const matches: Match[] = [];

      for (const line of lines) {
        if (!line || matches.length >= limit) continue;

        const [filePath, lineNumStr, ...lineTextParts] = line.split("|");
        if (!filePath || !lineNumStr || lineTextParts.length === 0) continue;

        const lineNum = parseInt(lineNumStr, 10);
        const lineText = lineTextParts.join("|");

        matches.push({
          path: filePath,
          mtime: 0,
          lineNum,
          lineText,
        });
      }

      resolve(matches);
    });

    proc.once("error", () => {
      resolve([]);
    });
  });
}
