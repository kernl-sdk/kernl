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

export const createComment = tool({
  id: "comments_create",
  description: "Create a comment/reply on a post",
  parameters: z.object({
    title: z.string().describe("Internal title for the comment"),
    post_id: z.string().describe("Internal post ID to comment on"),
    post_date: z.string().describe("ISO 8601 datetime for when to post the comment"),
    status: z.enum(["DRAFT", "SCHEDULED"]).describe("DRAFT or SCHEDULED"),
    platforms: z.array(z.enum(commentPlatforms)).min(1).describe("Platforms to comment on"),
    text: z.string().describe("Comment text"),
    parent_comment_id: z.string().optional().describe("Parent comment ID for replies"),
  }),
  execute: async (ctx, params) => {
    const data: Record<string, { text: string }> = {};
    for (const platform of params.platforms) {
      data[platform] = { text: params.text };
    }

    const comment = await client.comment.commentCreate({
      requestBody: {
        teamId: TEAM_ID,
        title: params.title,
        internalPostId: params.post_id,
        postDate: params.post_date,
        status: params.status,
        socialAccountTypes: params.platforms,
        data,
        internalParentCommentId: params.parent_comment_id,
      },
    });

    return {
      id: comment.id,
      title: comment.title,
      status: comment.status,
      post_date: comment.postDate,
    };
  },
});
