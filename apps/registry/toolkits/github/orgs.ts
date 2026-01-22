import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { octokit } from "./client";

/**
 * @tool
 *
 * Searches for GitHub organizations using GitHub search syntax.
 */
export const searchOrgs = tool({
  id: "orgs_search",
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
  execute: async (ctx: Context, params) => {
    const { data } = await octokit.search.users({
      q: `${params.query} type:org`,
      sort: params.sort,
      order: params.order,
      page: params.page,
      per_page: params.per_page,
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
  id: "orgs",
  description: "GitHub Organizations",
  tools: [searchOrgs],
});
