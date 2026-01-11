import { z } from "zod";
import { tool, Toolkit } from "kernl";
import { octokit } from "./client";

export const searchUsers = tool({
  id: "github_users_search",
  description: "Search for GitHub users",
  parameters: z.object({
    query: z.string().describe("Search query using GitHub search syntax"),
    sort: z
      .enum(["followers", "repositories", "joined"])
      .optional()
      .describe("Sort field"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (_ctx, { query, sort, order, page, per_page }) => {
    const { data } = await octokit.search.users({
      q: query,
      sort,
      order,
      page,
      per_page,
    });
    return {
      total_count: data.total_count,
      items: data.items.map((user) => ({
        login: user.login,
        id: user.id,
        type: user.type,
        url: user.html_url,
        avatar_url: user.avatar_url,
      })),
    };
  },
});

export const users = new Toolkit({
  id: "github_users",
  description: "GitHub Users",
  tools: [searchUsers],
});
