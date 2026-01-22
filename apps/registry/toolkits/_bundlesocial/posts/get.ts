import { z } from "zod";
import { tool } from "kernl";

import { client } from "../client";

export const getPost = tool({
  id: "posts_get",
  description: "Get details of a specific post",
  parameters: z.object({
    id: z.string().describe("Post ID"),
  }),
  execute: async (ctx, params) => {
    const post = await client.post.postGet({ id: params.id });

    return {
      id: post.id,
      team_id: post.teamId,
      title: post.title,
      status: post.status,
      post_date: post.postDate,
      posted_date: post.postedDate,
      data: post.data,
      external_data: post.externalData,
      error: post.error,
      errors: post.errors,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    };
  },
});
