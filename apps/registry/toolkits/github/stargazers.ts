import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { octokit, getRepo, type RepoContext } from "./client";

export const listStarred = tool({
  id: "github_stargazers_list_starred",
  description: "List repositories starred by the authenticated user",
  parameters: z.object({
    sort: z.enum(["created", "updated"]).optional().describe("Sort field"),
    direction: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (_ctx: Context<RepoContext>, { sort, direction, page, per_page }) => {
    const { data } = await octokit.activity.listReposStarredByAuthenticatedUser({
      sort,
      direction,
      page,
      per_page,
    });
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

export const starRepo = tool({
  id: "github_stargazers_star",
  description: "Star a repository",
  parameters: z.object({}),
  execute: async (ctx: Context<RepoContext>) => {
    const { owner, repo } = getRepo(ctx);
    await octokit.activity.starRepoForAuthenticatedUser({ owner, repo });
    return { starred: true, repo: `${owner}/${repo}` };
  },
});

export const unstarRepo = tool({
  id: "github_stargazers_unstar",
  description: "Unstar a repository",
  parameters: z.object({}),
  execute: async (ctx: Context<RepoContext>) => {
    const { owner, repo } = getRepo(ctx);
    await octokit.activity.unstarRepoForAuthenticatedUser({ owner, repo });
    return { starred: false, repo: `${owner}/${repo}` };
  },
});

export const stargazers = new Toolkit<RepoContext>({
  id: "github_stargazers",
  description: "Repository stars",
  tools: [listStarred, starRepo, unstarRepo],
});
