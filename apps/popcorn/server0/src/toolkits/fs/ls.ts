import { z } from "zod";
import { tool } from "kernl";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { Context } from "kernl";
import type { BaseContext } from "@/lib/context";
import { safeResolve } from "@/util/path";

const DESCRIPTION = `Lists files and directories in a given path. The path parameter must be absolute; omit it to use the current workspace directory. You can optionally provide an array of glob patterns to ignore with the ignore parameter. You should generally prefer the Glob and Grep tools, if you know which directories to search.`;

const IGNORE_PATTERNS = [
  "node_modules/",
  "__pycache__/",
  ".git/",
  "dist/",
  "build/",
  "target/",
  "vendor/",
  "bin/",
  "obj/",
  ".idea/",
  ".vscode/",
  ".zig-cache/",
  "zig-out",
  ".coverage",
  "coverage/",
  "tmp/",
  "temp/",
  ".cache/",
  "cache/",
  "logs/",
  ".venv/",
  "venv/",
  "env/",
];

const LIMIT = 100;

/**
 * @tool
 *
 * Lists files and directories in a given path with tree-style output.
 * Automatically ignores common build artifacts and dependency directories.
 */
export const ls = tool({
  id: "ls",
  description: DESCRIPTION,
  parameters: z.object({
    path: z
      .string()
      .optional()
      .describe(
        "The path to the directory to list (relative to workspace, or absolute within workspace)",
      ),
    ignore: z
      .array(z.string())
      .optional()
      .describe("List of glob patterns to ignore"),
  }),
  async execute(ctx: Context<BaseContext>, params) {
    const baseDir = ctx.context.directory;
    const searchPath = safeResolve(baseDir, params.path || ".");

    if (!searchPath) {
      throw new Error(`Path escapes workspace directory: ${params.path}`);
    }

    const ignorePatterns = [
      ...IGNORE_PATTERNS,
      ...(params.ignore || []),
    ];

    const files = await collectFiles(searchPath, ignorePatterns, LIMIT);

    // Build directory structure
    const dirs = new Set<string>();
    const filesByDir = new Map<string, string[]>();

    for (const file of files) {
      const relPath = path.relative(searchPath, file);
      const dir = path.dirname(relPath);
      const parts = dir === "." ? [] : dir.split(path.sep);

      // Add all parent directories
      for (let i = 0; i <= parts.length; i++) {
        const dirPath = i === 0 ? "." : parts.slice(0, i).join("/");
        dirs.add(dirPath);
      }

      // Add file to its directory
      const dirKey = dir === "." ? "." : dir.replace(/\\/g, "/");
      if (!filesByDir.has(dirKey)) filesByDir.set(dirKey, []);
      filesByDir.get(dirKey)!.push(path.basename(file));
    }

    function renderDir(dirPath: string, depth: number): string {
      const indent = "  ".repeat(depth);
      let output = "";

      if (depth > 0) {
        output += `${indent}${path.basename(dirPath)}/\n`;
      }

      const childIndent = "  ".repeat(depth + 1);
      const children = Array.from(dirs)
        .filter((d) => {
          const parent = path.dirname(d).replace(/\\/g, "/");
          return parent === dirPath && d !== dirPath;
        })
        .sort();

      // Render subdirectories first
      for (const child of children) {
        output += renderDir(child, depth + 1);
      }

      // Render files
      const dirFiles = filesByDir.get(dirPath) || [];
      for (const file of dirFiles.sort()) {
        output += `${childIndent}${file}\n`;
      }

      return output;
    }

    const output = `${searchPath}/\n` + renderDir(".", 0);
    const truncated = files.length >= LIMIT;

    if (truncated) {
      return output + `\n(Showing first ${LIMIT} files, more exist)`;
    }

    return output;
  },
});

async function collectFiles(
  dir: string,
  ignorePatterns: string[],
  limit: number,
): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    if (files.length >= limit) return;

    const relDir = path.relative(dir, currentDir);

    // Check if directory should be ignored
    for (const pattern of ignorePatterns) {
      const cleanPattern = pattern.replace(/\/$/, "");
      if (relDir === cleanPattern || relDir.startsWith(cleanPattern + path.sep)) {
        return;
      }
    }

    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return; // Skip directories we can't read
    }

    for (const entry of entries) {
      if (files.length >= limit) return;

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Check if subdirectory should be ignored
        let shouldIgnore = false;
        for (const pattern of ignorePatterns) {
          const cleanPattern = pattern.replace(/\/$/, "");
          if (entry.name === cleanPattern) {
            shouldIgnore = true;
            break;
          }
        }
        if (!shouldIgnore) {
          await walk(fullPath);
        }
      } else {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}
