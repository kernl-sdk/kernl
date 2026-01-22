import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { octokit, getRepo, type GitHubContext } from "./client";

/**
 * @tool
 *
 * Gets a tree (directory listing) from the repository by SHA or ref.
 */
export const getTree = tool({
  id: "git_get_tree",
  description: "Get a tree from the repository (directory listing)",
  parameters: z.object({
    tree_sha: z
      .string()
      .describe("SHA of the tree, branch name, or 'HEAD'"),
    recursive: z
      .boolean()
      .optional()
      .describe("Recursively fetch all nested trees"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: params.tree_sha,
      recursive: params.recursive ? "1" : undefined,
    });
    return {
      sha: data.sha,
      truncated: data.truncated,
      tree: data.tree.map((item) => ({
        path: item.path,
        mode: item.mode,
        type: item.type,
        sha: item.sha,
        size: item.size,
      })),
    };
  },
});

export const git = new Toolkit<GitHubContext>({
  id: "git",
  description: "Low-level Git API operations",
  tools: [getTree],
});
