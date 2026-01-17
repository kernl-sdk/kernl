import { z } from "zod";
import { tool } from "kernl";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { Context } from "kernl";
import type { BaseContext } from "@/lib/context";
import { safeResolve } from "@/util/path";

const DEFAULT_READ_LIMIT = 2000;
const MAX_LINE_LENGTH = 2000;
const MAX_BYTES = 50 * 1024;

const DESCRIPTION = `Reads a file from the local filesystem. You can access any file directly by using this tool.
Assume this tool is able to read all files on the machine. If the User provides a path to a file assume that path is valid. It is okay to read a file that does not exist; an error will be returned.

Usage:
- The filePath parameter must be an absolute path, not a relative path
- By default, it reads up to 2000 lines starting from the beginning of the file
- You can optionally specify a line offset and limit (especially handy for long files), but it's recommended to read the whole file by not providing these parameters
- Any lines longer than 2000 characters will be truncated
- Results are returned using cat -n format, with line numbers starting at 1
- You have the capability to call multiple tools in a single response. It is always better to speculatively read multiple files as a batch that are potentially useful.
- If you read a file that exists but has empty contents you will receive a system reminder warning in place of file contents.
- You can read image files using this tool.`;

/**
 * @tool
 *
 * Reads a file from the local filesystem with line numbers.
 * Supports pagination via offset/limit for large files.
 */
export const read = tool({
  id: "read",
  description: DESCRIPTION,
  parameters: z.object({
    filePath: z.string().describe("The path to the file to read (relative to workspace, or absolute within workspace)"),
    offset: z
      .number()
      .optional()
      .describe("The line number to start reading from (0-based)"),
    limit: z
      .number()
      .optional()
      .describe("The number of lines to read (defaults to 2000)"),
  }),
  async execute(ctx: Context<BaseContext>, params) {
    const baseDir = ctx.context.directory;
    const filepath = safeResolve(baseDir, params.filePath);

    if (!filepath) {
      throw new Error(`Path escapes workspace directory: ${params.filePath}`);
    }

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch {
      // Try to suggest similar files
      const dir = path.dirname(filepath);
      const base = path.basename(filepath);

      try {
        const dirEntries = await fs.readdir(dir);
        const suggestions = dirEntries
          .filter(
            (entry) =>
              entry.toLowerCase().includes(base.toLowerCase()) ||
              base.toLowerCase().includes(entry.toLowerCase()),
          )
          .map((entry) => path.join(dir, entry))
          .slice(0, 3);

        if (suggestions.length > 0) {
          throw new Error(
            `File not found: ${filepath}\n\nDid you mean one of these?\n${suggestions.join("\n")}`,
          );
        }
      } catch {
        // dir doesn't exist either
      }

      throw new Error(`File not found: ${filepath}`);
    }

    // Check for binary files
    const ext = path.extname(filepath).toLowerCase();
    const binaryExtensions = [
      ".zip",
      ".tar",
      ".gz",
      ".exe",
      ".dll",
      ".so",
      ".class",
      ".jar",
      ".war",
      ".7z",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".odt",
      ".ods",
      ".odp",
      ".bin",
      ".dat",
      ".obj",
      ".o",
      ".a",
      ".lib",
      ".wasm",
      ".pyc",
      ".pyo",
    ];
    if (binaryExtensions.includes(ext)) {
      throw new Error(`Cannot read binary file: ${filepath}`);
    }

    // Check for images
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];
    if (imageExtensions.includes(ext)) {
      const content = await fs.readFile(filepath);
      const mime = ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : "image/jpeg";
      return `Image read successfully: ${filepath} (${content.length} bytes, ${mime})`;
    }

    const content = await fs.readFile(filepath, "utf-8");
    const lines = content.split("\n");

    const limit = params.limit ?? DEFAULT_READ_LIMIT;
    const offset = params.offset ?? 0;

    const raw: string[] = [];
    let bytes = 0;
    let truncatedByBytes = false;

    for (let i = offset; i < Math.min(lines.length, offset + limit); i++) {
      const line =
        lines[i].length > MAX_LINE_LENGTH
          ? lines[i].substring(0, MAX_LINE_LENGTH) + "..."
          : lines[i];
      const size = Buffer.byteLength(line, "utf-8") + (raw.length > 0 ? 1 : 0);
      if (bytes + size > MAX_BYTES) {
        truncatedByBytes = true;
        break;
      }
      raw.push(line);
      bytes += size;
    }

    const formatted = raw.map((line, index) => {
      return `${(index + offset + 1).toString().padStart(5, " ")}\t${line}`;
    });

    let output = "<file>\n";
    output += formatted.join("\n");

    const totalLines = lines.length;
    const lastReadLine = offset + raw.length;
    const hasMoreLines = totalLines > lastReadLine;

    if (truncatedByBytes) {
      output += `\n\n(Output truncated at ${MAX_BYTES} bytes. Use 'offset' parameter to read beyond line ${lastReadLine})`;
    } else if (hasMoreLines) {
      output += `\n\n(File has more lines. Use 'offset' parameter to read beyond line ${lastReadLine})`;
    } else {
      output += `\n\n(End of file - total ${totalLines} lines)`;
    }
    output += "\n</file>";

    return output;
  },
});
