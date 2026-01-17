import { z } from "zod";
import { tool } from "kernl";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createTwoFilesPatch } from "diff";

import type { Context } from "kernl";
import type { BaseContext } from "@/lib/context";
import { safeResolve } from "@/util/path";

const DESCRIPTION = `Writes a file to the local filesystem.

Usage:
- This tool will overwrite the existing file if there is one at the provided path.
- If this is an existing file, you MUST use the Read tool first to read the file's contents. This tool will fail if you did not read the file first.
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- Only use emojis if the user explicitly requests it. Avoid writing emojis to files unless asked.`;

/**
 * @tool
 *
 * Writes content to a file, creating it if it doesn't exist.
 * Use Edit tool for making changes to existing files.
 */
export const write = tool({
  id: "write",
  description: DESCRIPTION,
  parameters: z.object({
    filePath: z
      .string()
      .describe(
        "The path to the file to write (relative to workspace, or absolute within workspace)",
      ),
    content: z.string().describe("The content to write to the file"),
  }),
  async execute(ctx: Context<BaseContext>, params) {
    const baseDir = ctx.context.directory;
    const filepath = safeResolve(baseDir, params.filePath);

    if (!filepath) {
      throw new Error(`Path escapes workspace directory: ${params.filePath}`);
    }

    // Capture original content (empty if new file)
    let original = "";
    let exists = false;
    try {
      original = await fs.readFile(filepath, "utf-8");
      exists = true;
    } catch {
      // File doesn't exist, will be created
    }

    // Ensure parent directory exists
    const dir = path.dirname(filepath);
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(filepath, params.content, "utf-8");

    // Generate unified diff
    const diff = createTwoFilesPatch(filepath, filepath, original, params.content);

    const lines = params.content.split("\n").length;
    const action = exists ? "Updated" : "Created";
    const text = `${action} ${filepath} (${lines} lines)`;

    return { text, diff };
  },
});
