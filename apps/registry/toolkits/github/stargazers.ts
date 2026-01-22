import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { octokit, getRepo, type GitHubContext } from "./client";

/**
 * @tool
 *
 * Lists repositories starred by the authenticated user.
 */
export const list = tool({
  id: "stargazers_list_starred",
  description: "List repositories starred by the authenticated user",
  parameters: z.object({
    sort: z.enum(["created", "updated"]).optional().describe("Sort field"),
    direction: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { data } = await octokit.activity.listReposStarredByAuthenticatedUser(
      {
        sort: params.sort,
        direction: params.direction,
        page: params.page,
        per_page: params.per_page,
      },
    );
    return data.map((repo: any) => ({
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language,
      starred_at: repo.starred_at,
    }));
  },
});

/**
 * @tool
 *
 * Stars the current repository for the authenticated user.
 */
export const star = tool({
  id: "stargazers_star",
  description: "Star a repository",
  parameters: z.object({}),
  execute: async (ctx: Context<GitHubContext>) => {
    const { owner, repo } = getRepo(ctx);
    await octokit.activity.starRepoForAuthenticatedUser({ owner, repo });
    return { starred: true, repo: `${owner}/${repo}` };
  },
});

/**
 * @tool
 *
 * Removes the star from the current repository for the authenticated user.
 */
export const unstar = tool({
  id: "stargazers_unstar",
  description: "Unstar a repository",
  parameters: z.object({}),
  execute: async (ctx: Context<GitHubContext>) => {
    const { owner, repo } = getRepo(ctx);
    await octokit.activity.unstarRepoForAuthenticatedUser({ owner, repo });
    return { starred: false, repo: `${owner}/${repo}` };
  },
});

export const stargazers = new Toolkit<GitHubContext>({
  id: "stargazers",
  description: "Repository stars",
  tools: [list, star, unstar],
});
