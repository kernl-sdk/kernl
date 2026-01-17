import { z } from "zod";
import { tool } from "kernl";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createTwoFilesPatch } from "diff";

import type { Context } from "kernl";
import type { BaseContext } from "@/lib/context";
import { safeResolve } from "@/util/path";

const DESCRIPTION = `Performs exact string replacements in files.

Usage:
- You must use your \`Read\` tool at least once in the conversation before editing. This tool will error if you attempt an edit without reading the file.
- When editing text from Read tool output, ensure you preserve the exact indentation (tabs/spaces) as it appears AFTER the line number prefix. The line number prefix format is: spaces + line number + tab. Everything after that tab is the actual file content to match. Never include any part of the line number prefix in the oldString or newString.
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.
- The edit will FAIL if \`oldString\` is not found in the file with an error "oldString not found in content".
- The edit will FAIL if \`oldString\` is found multiple times in the file with an error "oldString found multiple times and requires more code context to uniquely identify the intended match". Either provide a larger string with more surrounding context to make it unique or use \`replaceAll\` to change every instance of \`oldString\`.
- Use \`replaceAll\` for replacing and renaming strings across the file. This parameter is useful if you want to rename a variable for instance.`;

/**
 * @tool
 *
 * Performs exact string replacements in files.
 * Use replaceAll to rename variables or replace multiple occurrences.
 */
export const edit = tool({
  id: "edit",
  description: DESCRIPTION,
  parameters: z.object({
    filePath: z.string().describe("The path to the file to edit (relative to workspace, or absolute within workspace)"),
    oldString: z.string().describe("The exact string to find and replace"),
    newString: z.string().describe("The string to replace oldString with"),
    replaceAll: z
      .boolean()
      .optional()
      .describe("If true, replace all occurrences of oldString"),
  }),
  async execute(ctx: Context<BaseContext>, params) {
    const baseDir = ctx.context.directory;
    const filepath = safeResolve(baseDir, params.filePath);

    if (!filepath) {
      throw new Error(`Path escapes workspace directory: ${params.filePath}`);
    }

    // read current content
    let original: string;
    try {
      original = await fs.readFile(filepath, "utf-8");
    } catch {
      throw new Error(`File not found: ${filepath}`);
    }

    const { oldString, newString, replaceAll } = params;

    // check if oldString exists in content
    if (!original.includes(oldString)) {
      throw new Error("oldString not found in content");
    }

    // count occurrences
    const occurrences = original.split(oldString).length - 1;

    if (occurrences > 1 && !replaceAll) {
      throw new Error(
        "oldString found multiple times and requires more code context to uniquely identify the intended match",
      );
    }

    // perform replacement
    let updated: string;
    if (replaceAll) {
      updated = original.split(oldString).join(newString);
    } else {
      updated = original.replace(oldString, newString);
    }

    await fs.writeFile(filepath, updated, "utf-8");

    // generate unified diff
    const diff = createTwoFilesPatch(filepath, filepath, original, updated);

    const replacements = replaceAll ? occurrences : 1;
    const text = `Edited ${filepath}: replaced ${replacements} occurrence${replacements > 1 ? "s" : ""}`;

    return { text, diff };
  },
});
