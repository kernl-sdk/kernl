import { z } from "zod";
import { tool, Toolkit } from "kernl";
import { octokit } from "./client";

export const searchOrgs = tool({
  id: "github_orgs_search",
  description: "Search for GitHub organizations",
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
      q: `${query} type:org`,
      sort,
      order,
      page,
      per_page,
    });
    return {
      total_count: data.total_count,
      items: data.items.map((org) => ({
        login: org.login,
        id: org.id,
        url: org.html_url,
        avatar_url: org.avatar_url,
        description: org.bio,
      })),
    };
  },
});

export const orgs = new Toolkit({
  id: "github_orgs",
  description: "GitHub Organizations",
  tools: [searchOrgs],
});
