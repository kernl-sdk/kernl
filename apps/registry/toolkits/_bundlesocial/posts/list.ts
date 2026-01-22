import { z } from "zod";
import { tool } from "kernl";

import { client, TEAM_ID } from "../client";
import { PLATFORMS } from "../constants";

export const listPosts = tool({
  id: "posts_list",
  description: "List posts for a team with optional filtering",
  parameters: z.object({
    status: z.enum(["DRAFT", "SCHEDULED", "POSTED", "ERROR", "DELETED", "PROCESSING", "REVIEW", "RETRYING"]).optional().describe("Filter by post status"),
    order_by: z.enum(["createdAt", "updatedAt", "postDate", "postedDate"]).optional().describe("Field to sort by"),
    order: z.enum(["ASC", "DESC"]).optional().describe("Sort direction"),
    q: z.string().optional().describe("Search query"),
    platforms: z.array(z.enum(PLATFORMS)).optional().describe("Filter by platforms"),
    offset: z.number().optional().describe("Pagination offset"),
    limit: z.number().optional().describe("Number of results (default 10)"),
  }),
  execute: async (ctx, params) => {
    const result = await client.post.postGetList({
      teamId: TEAM_ID,
      status: params.status,
      orderBy: params.order_by,
      order: params.order,
      q: params.q,
      platforms: params.platforms,
      offset: params.offset,
      limit: params.limit,
    });

    return {
      total: result.total,
      items: result.items.map((post) => ({
        id: post.id,
        title: post.title,
        status: post.status,
        post_date: post.postDate,
        posted_date: post.postedDate,
        created_at: post.createdAt,
      })),
    };
  },
});
