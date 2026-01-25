import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { createTwoFilesPatch } from "diff";

import { getSandbox, type SandboxContext } from "./client";

/**
 * List contents of a directory.
 */
export const list = tool({
  id: "fs_list",
  description: "List files and directories in a path",
  parameters: z.object({
    path: z
      .string()
      .describe("Directory path to list (default: working directory)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path }) => {
    const sandbox = await getSandbox(ctx);
    return await sandbox.fs.listFiles(path);
  },
});

const DEFAULT_READ_LIMIT = 2000;
const MAX_LINE_LENGTH = 2000;
const MAX_BYTES = 50 * 1024;

/**
 * Read a file's contents.
 */
export const read = tool({
  id: "fs_read",
  description: "Read the contents of a file",
  parameters: z.object({
    path: z.string().describe("Path to the file to read"),
    offset: z.number().optional().describe("Line number to start reading from (0-based)"),
    limit: z.number().optional().describe("Number of lines to read (default: 2000)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, offset: offsetParam, limit: limitParam }) => {
    const sandbox = await getSandbox(ctx);
    const buf = await sandbox.fs.downloadFile(path);
    const content = buf.toString("utf-8");
    const allLines = content.split("\n");

    const limit = limitParam ?? DEFAULT_READ_LIMIT;
    const offset = offsetParam ?? 0;

    const raw: string[] = [];
    let bytes = 0;
    let truncatedByBytes = false;

    for (let i = offset; i < Math.min(allLines.length, offset + limit); i++) {
      const line =
        allLines[i].length > MAX_LINE_LENGTH
          ? allLines[i].substring(0, MAX_LINE_LENGTH) + "..."
          : allLines[i];
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

    const totalLines = allLines.length;
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

/**
 * Edit a file by replacing a specific string.
 */
export const edit = tool({
  id: "fs_edit",
  description: "Edit a file by replacing a specific string with new content",
  parameters: z.object({
    path: z.string().describe("Path to the file to edit"),
    old: z.string().describe("The exact string to find and replace"),
    new: z.string().describe("The replacement string"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, old, new: newStr }) => {
    const sandbox = await getSandbox(ctx);

    // Read original content before edit
    const originalBuf = await sandbox.fs.downloadFile(path);
    const original = originalBuf.toString("utf-8");

    const [result] = await sandbox.fs.replaceInFiles([path], old, newStr);

    if (!result?.success) {
      throw new Error(
        `Edit failed: ${result?.error ?? "string not found in " + path}`,
      );
    }

    // Read updated content after edit
    const updatedBuf = await sandbox.fs.downloadFile(path);
    const updated = updatedBuf.toString("utf-8");

    // Generate unified diff
    const diff = createTwoFilesPatch(path, path, original, updated);
    const text = `Edited ${path}: replaced 1 occurrence`;

    return {
      text,
      diff,
      changes: {
        file: path,
        before: old,
        after: newStr,
        additions: newStr.split("\n").length,
        deletions: old.split("\n").length,
      },
    };
  },
});

/**
 * Write content to a file.
 */
export const write = tool({
  id: "fs_write",
  description: "Write content to a file (creates or overwrites)",
  parameters: z.object({
    path: z.string().describe("Path to the file to write"),
    content: z.string().describe("Content to write to the file"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, content }) => {
    const sandbox = await getSandbox(ctx);

    // Capture original content (empty if new file)
    let original = "";
    let exists = false;
    try {
      const buf = await sandbox.fs.downloadFile(path);
      original = buf.toString("utf-8");
      exists = true;
    } catch {
      // File doesn't exist, will be created
    }

    await sandbox.fs.uploadFile(Buffer.from(content, "utf-8"), path);

    // Generate unified diff
    const diff = createTwoFilesPatch(path, path, original, content);

    const lines = content.split("\n").length;
    const action = exists ? "Updated" : "Created";
    const text = `${action} ${path} (${lines} lines)`;

    return { text, diff };
  },
});

/**
 * Create a directory.
 */
export const mkdir = tool({
  id: "fs_mkdir",
  description: "Create a new directory",
  parameters: z.object({
    path: z.string().describe("Path of the directory to create"),
    mode: z
      .string()
      .optional()
      .describe("Permissions in octal format (default: 755)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, mode }) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.fs.createFolder(path, mode ?? "755");
    return { success: true, path };
  },
});

/**
 * Delete a file or directory.
 */
export const rm = tool({
  id: "fs_rm",
  description: "Delete a file or directory",
  parameters: z.object({
    path: z.string().describe("Path to delete"),
    recursive: z
      .boolean()
      .optional()
      .describe("Delete directories recursively (default: false)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, recursive }) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.fs.deleteFile(path, recursive);
    return { success: true, path };
  },
});

/**
 * Move or rename a file or directory.
 */
export const mv = tool({
  id: "fs_mv",
  description: "Move or rename a file or directory",
  parameters: z.object({
    source: z.string().describe("Source path"),
    destination: z.string().describe("Destination path"),
  }),
  execute: async (ctx: Context<SandboxContext>, { source, destination }) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.fs.moveFiles(source, destination);
    return { success: true, source, destination };
  },
});

/**
 * Search for files by name pattern.
 */
export const find = tool({
  id: "fs_find",
  description: "Search for files by name pattern (supports globs like *.ts)",
  parameters: z.object({
    path: z.string().describe("Directory to search in"),
    pattern: z.string().describe("File name pattern (e.g., *.ts, config.*)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, pattern }) => {
    const sandbox = await getSandbox(ctx);
    const result = await sandbox.fs.searchFiles(path, pattern);

    return result.files;
  },
});

/**
 * Search for text patterns within files.
 */
export const grep = tool({
  id: "fs_grep",
  description: "Search for text patterns within files",
  parameters: z.object({
    path: z.string().describe("Directory to search in"),
    pattern: z.string().describe("Text pattern to search for"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, pattern }) => {
    const sandbox = await getSandbox(ctx);
    return await sandbox.fs.findFiles(path, pattern);
  },
});

/**
 * Get detailed information about a file.
 */
export const stat = tool({
  id: "fs_stat",
  description: "Get detailed information about a file or directory",
  parameters: z.object({
    path: z.string().describe("Path to the file or directory"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path }) => {
    const sandbox = await getSandbox(ctx);
    return await sandbox.fs.getFileDetails(path);
  },
});

export const fs = new Toolkit<SandboxContext>({
  id: "fs",
  description: "File system operations for Daytona sandboxes",
  tools: [list, read, write, edit, mkdir, rm, mv, find, grep, stat],
});
