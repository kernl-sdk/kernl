import { z } from "zod";
import { tool } from "kernl";

import { client, TEAM_ID } from "../client";

const commentPlatforms = [
  "TIKTOK",
  "YOUTUBE",
  "INSTAGRAM",
  "FACEBOOK",
  "THREADS",
  "LINKEDIN",
  "REDDIT",
  "MASTODON",
  "DISCORD",
  "SLACK",
  "BLUESKY",
] as const;

export const listComments = tool({
  id: "comments_list",
  description: "List comments for a team",
  parameters: z.object({
    post_id: z.string().optional().describe("Filter by post ID"),
    status: z.enum(["DRAFT", "SCHEDULED", "POSTED", "ERROR", "DELETED", "PROCESSING", "RETRYING"]).optional().describe("Filter by status"),
    order_by: z.enum(["createdAt", "updatedAt"]).optional().describe("Field to sort by"),
    order: z.enum(["ASC", "DESC"]).optional().describe("Sort direction"),
    platforms: z.array(z.enum(commentPlatforms)).optional().describe("Filter by platforms"),
    offset: z.number().optional().describe("Pagination offset"),
    limit: z.number().optional().describe("Number of results"),
  }),
  execute: async (ctx, params) => {
    const result = await client.comment.commentGetList({
      teamId: TEAM_ID,
      postId: params.post_id,
      status: params.status,
      orderBy: params.order_by,
      order: params.order,
      platforms: params.platforms,
      offset: params.offset,
      limit: params.limit,
    });

    return {
      total: result.total,
      items: result.items.map((comment) => ({
        id: comment.id,
        title: comment.title,
        status: comment.status,
        post_date: comment.postDate,
        posted_date: comment.postedDate,
        created_at: comment.createdAt,
      })),
    };
  },
});
