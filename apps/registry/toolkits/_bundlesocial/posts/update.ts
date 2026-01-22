import { z } from "zod";
import { tool } from "kernl";
import type { PostUpdateData } from "bundlesocial";

import { client } from "../client";
import { PLATFORMS } from "../constants";

type UpdatePlatformData = NonNullable<PostUpdateData["requestBody"]>["data"];

export const updatePost = tool({
  id: "posts_update",
  description: "Update a draft or scheduled post (cannot update posted content)",
  parameters: z.object({
    id: z.string().describe("Post ID to update"),
    title: z.string().optional().describe("New title"),
    post_date: z.string().optional().describe("New scheduled date (ISO 8601)"),
    status: z.enum(["DRAFT", "SCHEDULED"]).optional().describe("New status"),
    platforms: z.array(z.enum(PLATFORMS)).optional().describe("Updated platforms"),
    data: z.record(z.string(), z.unknown()).optional().describe("Updated platform-specific content"),
  }),
  execute: async (ctx, params) => {
    const post = await client.post.postUpdate({
      id: params.id,
      requestBody: {
        title: params.title,
        postDate: params.post_date,
        status: params.status,
        socialAccountTypes: params.platforms,
        data: params.data as UpdatePlatformData,
      },
    });

    return {
      id: post.id,
      title: post.title,
      status: post.status,
      post_date: post.postDate,
      updated_at: post.updatedAt,
    };
  },
});
