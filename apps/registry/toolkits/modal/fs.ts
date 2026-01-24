import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";

import { getSandbox, type SandboxContext } from "./client";

/**
 * Read a file from the sandbox.
 */
const decoder = new TextDecoder();
const encoder = new TextEncoder();

export const read = tool({
  id: "fs_read",
  description: "Read the contents of a file in the sandbox",
  parameters: z.object({
    path: z.string().describe("Path to the file to read"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path }) => {
    const sandbox = await getSandbox(ctx);
    const file = await sandbox.open(path, "r");
    const bytes = await file.read();
    await file.close();
    return decoder.decode(bytes);
  },
});

/**
 * Write content to a file in the sandbox.
 */
export const write = tool({
  id: "fs_write",
  description: "Write content to a file in the sandbox (creates or overwrites)",
  parameters: z.object({
    path: z.string().describe("Path to the file to write"),
    content: z.string().describe("Content to write to the file"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, content }) => {
    const sandbox = await getSandbox(ctx);
    const file = await sandbox.open(path, "w");
    await file.write(encoder.encode(content));
    await file.close();
    return { success: true, path };
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

    // read
    const file = await sandbox.open(path, "r");
    const content = decoder.decode(await file.read());
    await file.close();

    if (!content.includes(old)) {
      throw new Error(`Edit failed: string not found in ${path}`);
    }

    // replace and write
    const updated = content.replace(old, newStr);
    const out = await sandbox.open(path, "w");
    await out.write(encoder.encode(updated));
    await out.close();

    return {
      success: true,
      path,
      diff: {
        before: old,
        after: newStr,
        additions: newStr.split("\n").length,
        deletions: old.split("\n").length,
      },
    };
  },
});

/**
 * List files in a directory.
 */
export const list = tool({
  id: "fs_list",
  description: "List files and directories in a path",
  parameters: z.object({
    path: z
      .string()
      .optional()
      .describe("Directory path to list (default: current directory)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path }) => {
    const sandbox = await getSandbox(ctx);
    const targetPath = path ?? ".";
    const proc = await sandbox.exec(["ls", "-la", targetPath]);
    const stdout = await proc.stdout.readText();
    const exitCode = await proc.wait();

    if (exitCode !== 0) {
      const stderr = await proc.stderr.readText();
      throw new Error(`Failed to list directory: ${stderr}`);
    }

    return stdout.trim();
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
  }),
  execute: async (ctx: Context<SandboxContext>, { path }) => {
    const sandbox = await getSandbox(ctx);
    const proc = await sandbox.exec(["mkdir", "-p", path]);
    const exitCode = await proc.wait();

    if (exitCode !== 0) {
      const stderr = await proc.stderr.readText();
      throw new Error(`Failed to create directory: ${stderr}`);
    }

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
    const args = recursive ? ["rm", "-rf", path] : ["rm", path];
    const proc = await sandbox.exec(args);
    const exitCode = await proc.wait();

    if (exitCode !== 0) {
      const stderr = await proc.stderr.readText();
      throw new Error(`Failed to delete: ${stderr}`);
    }

    return { success: true, path };
  },
});

export const fs = new Toolkit<SandboxContext>({
  id: "fs",
  description: "File system operations for Modal sandboxes",
  tools: [read, write, edit, list, mkdir, rm],
});
