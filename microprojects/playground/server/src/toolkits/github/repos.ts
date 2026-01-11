import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { octokit, getRepo, type GitHubContext } from "./client";

/**
 * @tool
 *
 * Gets file or directory contents from the repository.
 */
export const getFileContents = tool({
  id: "github_repos_get_file_contents",
  description: "Get file or directory contents from the repository",
  parameters: z.object({
    path: z.string().optional().describe("Path to file/directory"),
    ref: z.string().optional().describe("Git ref (branch, tag, or commit SHA)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: params.path ?? "",
      ref: params.ref,
    });
    // Directory listing
    if (Array.isArray(data)) {
      return data.map((item) => ({
        type: item.type,
        name: item.name,
        path: item.path,
        sha: item.sha,
      }));
    }
    // File content
    if (data.type === "file") {
      return {
        type: data.type,
        name: data.name,
        path: data.path,
        content: data.content,
        encoding: data.encoding,
        sha: data.sha,
      };
    }
    // Symlink or submodule
    return { type: data.type, name: data.name, path: data.path, sha: data.sha };
  },
});

/**
 * @tool
 *
 * Creates a new branch from an existing branch or commit.
 */
export const createBranch = tool({
  id: "github_repos_create_branch",
  description: "Create a new branch in the repository",
  parameters: z.object({
    branch: z.string().describe("Name for the new branch"),
    from_branch: z
      .string()
      .optional()
      .describe("Source branch (defaults to repo default branch)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);

    // Get the SHA of the source branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${params.from_branch ?? "main"}`,
    });

    // Create the new branch
    const { data } = await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${params.branch}`,
      sha: refData.object.sha,
    });

    return { ref: data.ref, sha: data.object.sha };
  },
});

/**
 * @tool
 *
 * Lists all branches in the repository.
 */
export const listBranches = tool({
  id: "github_repos_list_branches",
  description: "List branches in the repository",
  parameters: z.object({
    page: z.number().optional().describe("Page number (default: 1)"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const { data } = await octokit.repos.listBranches({
      owner,
      repo,
      page: params.page,
      per_page: params.per_page,
    });
    return data;
  },
});

/**
 * @tool
 *
 * Searches for code across repositories using GitHub search syntax.
 */
export const searchCode = tool({
  id: "github_repos_search_code",
  description: "Search for code across repositories",
  parameters: z.object({
    query: z.string().describe("Search query using GitHub code search syntax"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { data } = await octokit.search.code({
      q: params.query,
      page: params.page,
      per_page: params.per_page,
    });
    return {
      total_count: data.total_count,
      items: data.items.map((item) => ({
        name: item.name,
        path: item.path,
        url: item.html_url,
        repository: item.repository.full_name,
        language: item.language,
      })),
    };
  },
});

/**
 * @tool
 *
 * Searches for repositories using GitHub search syntax.
 */
export const searchRepositories = tool({
  id: "github_repos_search_repositories",
  description: "Search for repositories",
  parameters: z.object({
    query: z.string().describe("Search query using GitHub search syntax"),
    sort: z
      .enum(["stars", "forks", "help-wanted-issues", "updated"])
      .optional()
      .describe("Sort field"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { data } = await octokit.search.repos({
      q: params.query,
      sort: params.sort,
      order: params.order,
      page: params.page,
      per_page: params.per_page,
    });
    return {
      total_count: data.total_count,
      items: data.items.map((repo) => ({
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
        topics: repo.topics,
        updated_at: repo.updated_at,
      })),
    };
  },
});

// TODO: Implement remaining repos tools
// - create_repository
// - delete_file
// - fork_repository
// - get_commit
// - get_latest_release
// - get_release_by_tag
// - get_tag
// - list_commits
// - list_releases
// - list_tags

export const repos = new Toolkit<GitHubContext>({
  id: "github_repos",
  description: "GitHub Repository operations",
  tools: [
    // getFileContents, - uncomment if agents need to read file contents
    createBranch,
    listBranches,
    searchCode,
    searchRepositories,
  ],
});
