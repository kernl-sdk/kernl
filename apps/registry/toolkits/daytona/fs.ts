import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";

import { getSandbox, type SandboxContext } from "./client";

/**
 * List contents of a directory.
 */
export const list = tool({
  id: "daytona_fs_list",
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

/**
 * Read a file's contents.
 */
export const read = tool({
  id: "daytona_fs_read",
  description: "Read the contents of a file",
  parameters: z.object({
    path: z.string().describe("Path to the file to read"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path }) => {
    const sandbox = await getSandbox(ctx);
    const buf = await sandbox.fs.downloadFile(path);
    return buf.toString("utf-8");
  },
});

/**
 * Edit a file by replacing a specific string.
 */
export const edit = tool({
  id: "daytona_fs_edit",
  description: "Edit a file by replacing a specific string with new content",
  parameters: z.object({
    path: z.string().describe("Path to the file to edit"),
    old: z.string().describe("The exact string to find and replace"),
    new: z.string().describe("The replacement string"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, old, new: newStr }) => {
    const sandbox = await getSandbox(ctx);

    const [result] = await sandbox.fs.replaceInFiles([path], old, newStr);

    if (!result?.success) {
      throw new Error(
        `Edit failed: ${result?.error ?? "string not found in " + path}`,
      );
    }

    return {
      success: true,
      path,
      diff: {
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
  id: "daytona_fs_write",
  description: "Write content to a file (creates or overwrites)",
  parameters: z.object({
    path: z.string().describe("Path to the file to write"),
    content: z.string().describe("Content to write to the file"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, content }) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.fs.uploadFile(Buffer.from(content, "utf-8"), path);
    return { success: true, path };
  },
});

/**
 * Create a directory.
 */
export const mkdir = tool({
  id: "daytona_fs_mkdir",
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
  id: "daytona_fs_rm",
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
  id: "daytona_fs_mv",
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
  id: "daytona_fs_find",
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
  id: "daytona_fs_grep",
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
  id: "daytona_fs_stat",
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
  id: "daytona_fs",
  description: "File system operations for Daytona sandboxes",
  tools: [list, read, write, edit, mkdir, rm, mv, find, grep, stat],
});
