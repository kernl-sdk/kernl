import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { octokit, getRepo, type GitHubContext } from "./client";

/**
 * @tool
 *
 * Adds a comment to an issue or pull request.
 */
export const addComment = tool({
  id: "issues_add_comment",
  description: "Add a comment to an issue or pull request",
  parameters: z.object({
    issue_number: z.number().describe("Issue or PR number"),
    body: z.string().describe("Comment content"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: params.issue_number,
      body: params.body,
    });
    return { id: data.id, url: data.html_url };
  },
});

/**
 * @tool
 *
 * Retrieves details for a specific issue including labels and assignees.
 */
export const getIssue = tool({
  id: "issues_get",
  description: "Get issue details",
  parameters: z.object({
    issue_number: z.number().describe("Issue number"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: params.issue_number,
    });
    return {
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      author: issue.user?.login,
      body: issue.body,
      labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name)),
      assignees: issue.assignees?.map((a) => a.login),
      comments: issue.comments,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
    };
  },
});

/**
 * @tool
 *
 * Creates a new issue with optional labels, assignees, and milestone.
 */
export const createIssue = tool({
  id: "issues_create",
  description: "Create a new issue",
  parameters: z.object({
    title: z.string().describe("Issue title"),
    body: z.string().optional().describe("Issue body content"),
    assignees: z.array(z.string()).optional().describe("Usernames to assign"),
    labels: z.array(z.string()).optional().describe("Labels to apply"),
    milestone: z.number().optional().describe("Milestone number"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.issues.create({
      owner,
      repo,
      title: params.title,
      body: params.body,
      assignees: params.assignees,
      labels: params.labels,
      milestone: params.milestone,
    });
    return { number: data.number, url: data.html_url };
  },
});

/**
 * @tool
 *
 * Updates an existing issue's title, body, state, labels, or assignees.
 */
export const updateIssue = tool({
  id: "issues_update",
  description: "Update an existing issue",
  parameters: z.object({
    issue_number: z.number().describe("Issue number"),
    title: z.string().optional().describe("New title"),
    body: z.string().optional().describe("New body content"),
    state: z.enum(["open", "closed"]).optional().describe("New state"),
    state_reason: z
      .enum(["completed", "not_planned", "reopened"])
      .optional()
      .describe("Reason for state change"),
    assignees: z.array(z.string()).optional().describe("Usernames to assign"),
    labels: z.array(z.string()).optional().describe("Labels to apply"),
    milestone: z.number().nullable().optional().describe("Milestone number"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.issues.update({
      owner,
      repo,
      issue_number: params.issue_number,
      title: params.title,
      body: params.body,
      state: params.state,
      state_reason: params.state_reason,
      assignees: params.assignees,
      labels: params.labels,
      milestone: params.milestone,
    });
    return { number: data.number, url: data.html_url, state: data.state };
  },
});

/**
 * @tool
 *
 * Lists issues in the repository with optional state and label filters.
 */
export const listIssues = tool({
  id: "issues_list",
  description: "List issues in the repository",
  parameters: z.object({
    state: z
      .enum(["open", "closed", "all"])
      .optional()
      .describe("Filter by state"),
    labels: z.string().optional().describe("Comma-separated label names"),
    sort: z
      .enum(["created", "updated", "comments"])
      .optional()
      .describe("Sort by"),
    direction: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
    since: z.string().optional().describe("Filter by date (ISO 8601)"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: params.state,
      labels: params.labels,
      sort: params.sort,
      direction: params.direction,
      since: params.since,
      page: params.page,
      per_page: params.per_page,
    });
    return data.map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      author: issue.user?.login,
      labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name)),
      comments: issue.comments,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    }));
  },
});

/**
 * @tool
 *
 * Lists all comments on a specific issue.
 */
export const listIssueComments = tool({
  id: "issues_list_comments",
  description: "List comments on an issue",
  parameters: z.object({
    issue_number: z.number().describe("Issue number"),
    since: z.string().optional().describe("Filter by date (ISO 8601)"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: params.issue_number,
      since: params.since,
      page: params.page,
      per_page: params.per_page,
    });
    return data.map((c) => ({
      id: c.id,
      author: c.user?.login,
      body: c.body,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
  },
});

/**
 * @tool
 *
 * Searches issues and pull requests using GitHub search syntax.
 */
export const searchIssues = tool({
  id: "issues_search",
  description: "Search issues and pull requests",
  parameters: z.object({
    query: z.string().describe("Search query using GitHub search syntax"),
    sort: z
      .enum([
        "comments",
        "reactions",
        "reactions-+1",
        "reactions--1",
        "reactions-smile",
        "reactions-thinking_face",
        "reactions-heart",
        "reactions-tada",
        "interactions",
        "created",
        "updated",
      ])
      .optional()
      .describe("Sort field"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { data } = await octokit.search.issuesAndPullRequests({
      q: params.query,
      sort: params.sort,
      order: params.order,
      page: params.page,
      per_page: params.per_page,
    });
    return {
      total_count: data.total_count,
      items: data.items.map((item) => ({
        number: item.number,
        title: item.title,
        state: item.state,
        url: item.html_url,
        author: item.user?.login,
        labels: item.labels.map((l) => (typeof l === "string" ? l : l.name)),
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
    };
  },
});

// TODO: Implement remaining issues tools
// - assign_copilot_to_issue
// - get_label
// - list_issue_types
// - sub_issue_write

export const issues = new Toolkit<GitHubContext>({
  id: "issues",
  description: "GitHub Issues operations",
  tools: [
    addComment,
    getIssue,
    createIssue,
    updateIssue,
    listIssues,
    listIssueComments,
    searchIssues,
  ],
});
