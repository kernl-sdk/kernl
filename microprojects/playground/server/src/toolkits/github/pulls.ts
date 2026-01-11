import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";

import { octokit, getRepo, type GitHubContext } from "./client";

/**
 * @tool
 *
 * Creates a new pull request from a head branch to a base branch.
 */
export const createPullRequest = tool({
  id: "github_pulls_create",
  description: "Create a new pull request",
  parameters: z.object({
    title: z.string().describe("PR title"),
    head: z.string().describe("Branch containing changes"),
    base: z.string().describe("Branch to merge into"),
    body: z.string().optional().describe("PR description"),
    draft: z.boolean().optional().describe("Create as draft PR"),
    maintainer_can_modify: z
      .boolean()
      .optional()
      .describe("Allow maintainer edits"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title: params.title,
      head: params.head,
      base: params.base,
      body: params.body,
      draft: params.draft,
      maintainer_can_modify: params.maintainer_can_modify,
    });
    return { number: data.number, url: data.html_url, state: data.state };
  },
});

/**
 * @tool
 *
 * Retrieves detailed information about a specific pull request.
 */
export const getPullRequest = tool({
  id: "github_pulls_get",
  description: "Get pull request details",
  parameters: z.object({
    pull_number: z.number().describe("Pull request number"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: params.pull_number,
    });
    return {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      draft: pr.draft,
      url: pr.html_url,
      author: pr.user?.login,
      head: pr.head.ref,
      base: pr.base.ref,
      body: pr.body,
      mergeable: pr.mergeable,
      labels: pr.labels.map((l) => l.name),
      reviewers: pr.requested_reviewers?.map((r: any) => r.login),
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
    };
  },
});

/**
 * @tool
 *
 * Fetches the unified diff for a pull request.
 */
export const getPullRequestDiff = tool({
  id: "github_pulls_get_diff",
  description: "Get the diff for a pull request",
  parameters: z.object({
    pull_number: z.number().describe("Pull request number"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: params.pull_number,
      mediaType: { format: "diff" },
    });
    return data as unknown as string;
  },
});

/**
 * @tool
 *
 * Lists files changed in a pull request with additions/deletions stats.
 */
export const getPullRequestFiles = tool({
  id: "github_pulls_get_files",
  description: "Get the list of files changed in a pull request",
  parameters: z.object({
    pull_number: z.number().describe("Pull request number"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: params.pull_number,
      page: params.page,
      per_page: params.per_page,
    });
    return data.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
    }));
  },
});

/**
 * @tool
 *
 * Lists pull requests in the repository with optional filters.
 */
export const listPullRequests = tool({
  id: "github_pulls_list",
  description: "List pull requests in the repository",
  parameters: z.object({
    state: z
      .enum(["open", "closed", "all"])
      .optional()
      .describe("Filter by state"),
    head: z.string().optional().describe("Filter by head user/org and branch"),
    base: z.string().optional().describe("Filter by base branch"),
    sort: z
      .enum(["created", "updated", "popularity", "long-running"])
      .optional()
      .describe("Sort by"),
    direction: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: params.state,
      head: params.head,
      base: params.base,
      sort: params.sort,
      direction: params.direction,
      page: params.page,
      per_page: params.per_page,
    });
    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      draft: pr.draft,
      url: pr.html_url,
      author: pr.user?.login,
      head: pr.head.ref,
      base: pr.base.ref,
      labels: pr.labels.map((l) => l.name),
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    }));
  },
});

/**
 * @tool
 *
 * Updates a pull request's title, body, state, or base branch.
 */
export const updatePullRequest = tool({
  id: "github_pulls_update",
  description: "Update a pull request",
  parameters: z.object({
    pull_number: z.number().describe("Pull request number"),
    title: z.string().optional().describe("New title"),
    body: z.string().optional().describe("New description"),
    state: z.enum(["open", "closed"]).optional().describe("New state"),
    base: z.string().optional().describe("New base branch"),
    maintainer_can_modify: z
      .boolean()
      .optional()
      .describe("Allow maintainer edits"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.pulls.update({
      owner,
      repo,
      pull_number: params.pull_number,
      title: params.title,
      body: params.body,
      state: params.state,
      base: params.base,
      maintainer_can_modify: params.maintainer_can_modify,
    });
    return { number: data.number, url: data.html_url, state: data.state };
  },
});

/**
 * @tool
 *
 * Merges a pull request using merge, squash, or rebase strategy.
 */
export const mergePullRequest = tool({
  id: "github_pulls_merge",
  description: "Merge a pull request",
  parameters: z.object({
    pull_number: z.number().describe("Pull request number"),
    commit_title: z.string().optional().describe("Title for merge commit"),
    commit_message: z
      .string()
      .optional()
      .describe("Extra detail for merge commit"),
    merge_method: z
      .enum(["merge", "squash", "rebase"])
      .optional()
      .describe("Merge method"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: params.pull_number,
      commit_title: params.commit_title,
      commit_message: params.commit_message,
      merge_method: params.merge_method,
    });
    return { merged: data.merged, sha: data.sha, message: data.message };
  },
});

// TODO: Implement remaining pulls tools
// - add_comment_to_pending_review
// - pull_request_review_write
// - request_copilot_review
// - search_pull_requests
// - update_pull_request_branch

export const pulls = new Toolkit<GitHubContext>({
  id: "github_pulls",
  description: "GitHub Pull Request operations",
  tools: [
    createPullRequest,
    getPullRequest,
    getPullRequestDiff,
    getPullRequestFiles,
    listPullRequests,
    updatePullRequest,
    // mergePullRequest - uncomment if you want agents to be able to merge PRs
  ],
});
