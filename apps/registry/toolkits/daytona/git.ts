import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";

import { getSandbox, type SandboxContext } from "./client";

/**
 * Clone a git repository.
 */
export const clone = tool({
  id: "daytona_git_clone",
  description: "Clone a git repository into the sandbox",
  parameters: z.object({
    url: z.string().describe("Repository URL to clone"),
    path: z.string().describe("Destination path for the clone"),
    branch: z.string().optional().describe("Specific branch to clone"),
    username: z.string().optional().describe("Git username for private repos"),
    password: z
      .string()
      .optional()
      .describe("Git password/token for private repos"),
  }),
  execute: async (
    ctx: Context<SandboxContext>,
    { url, path, branch, username, password },
  ) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.git.clone(url, path, branch, undefined, username, password);

    return { success: true, path };
  },
});

/**
 * Get repository status.
 */
export const status = tool({
  id: "daytona_git_status",
  description: "Get the status of a git repository",
  parameters: z.object({
    path: z.string().describe("Path to the git repository"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path }) => {
    const sandbox = await getSandbox(ctx);
    return await sandbox.git.status(path);
  },
});

/**
 * Stage files for commit.
 */
export const add = tool({
  id: "daytona_git_add",
  description: "Stage files for the next commit",
  parameters: z.object({
    path: z.string().describe("Path to the git repository"),
    files: z.array(z.string()).describe("Files to stage (use ['.'] for all)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, files }) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.git.add(path, files);

    return { success: true, staged: files };
  },
});

/**
 * Commit staged changes.
 */
export const commit = tool({
  id: "daytona_git_commit",
  description: "Commit staged changes",
  parameters: z.object({
    path: z.string().describe("Path to the git repository"),
    message: z.string().describe("Commit message"),
    author: z.string().describe("Author name"),
    email: z.string().describe("Author email"),
  }),
  execute: async (
    ctx: Context<SandboxContext>,
    { path, message, author, email },
  ) => {
    const sandbox = await getSandbox(ctx);
    const result = await sandbox.git.commit(path, message, author, email);

    return { success: true, sha: result.sha };
  },
});

/**
 * List branches.
 */
export const branches = tool({
  id: "daytona_git_branches",
  description: "List branches in a repository",
  parameters: z.object({
    path: z.string().describe("Path to the git repository"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path }) => {
    const sandbox = await getSandbox(ctx);
    const result = await sandbox.git.branches(path);

    return result.branches;
  },
});

/**
 * Checkout a branch.
 */
export const checkout = tool({
  id: "daytona_git_checkout",
  description: "Checkout a branch",
  parameters: z.object({
    path: z.string().describe("Path to the git repository"),
    branch: z.string().describe("Branch name to checkout"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, branch }) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.git.checkoutBranch(path, branch);

    return { success: true, branch };
  },
});

/**
 * Create a new branch.
 */
export const branch = tool({
  id: "daytona_git_branch",
  description: "Create a new branch",
  parameters: z.object({
    path: z.string().describe("Path to the git repository"),
    name: z.string().describe("Name for the new branch"),
  }),
  execute: async (ctx: Context<SandboxContext>, { path, name }) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.git.createBranch(path, name);

    return { success: true, branch: name };
  },
});

/**
 * Pull changes from remote.
 */
export const pull = tool({
  id: "daytona_git_pull",
  description: "Pull changes from the remote repository",
  parameters: z.object({
    path: z.string().describe("Path to the git repository"),
    username: z.string().optional().describe("Git username for private repos"),
    password: z
      .string()
      .optional()
      .describe("Git password/token for private repos"),
  }),
  execute: async (
    ctx: Context<SandboxContext>,
    { path, username, password },
  ) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.git.pull(path, username, password);

    return { success: true };
  },
});

/**
 * Push changes to remote.
 */
export const push = tool({
  id: "daytona_git_push",
  description: "Push changes to the remote repository",
  parameters: z.object({
    path: z.string().describe("Path to the git repository"),
    username: z.string().optional().describe("Git username for private repos"),
    password: z
      .string()
      .optional()
      .describe("Git password/token for private repos"),
  }),
  execute: async (
    ctx: Context<SandboxContext>,
    { path, username, password },
  ) => {
    const sandbox = await getSandbox(ctx);
    await sandbox.git.push(path, username, password);

    return { success: true };
  },
});

export const git = new Toolkit<SandboxContext>({
  id: "daytona_git",
  description: "Git operations for Daytona sandboxes",
  tools: [clone, status, add, commit, branches, checkout, branch, pull, push],
});
