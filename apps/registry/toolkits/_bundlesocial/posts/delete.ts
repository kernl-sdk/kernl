import { z } from "zod";
import { tool } from "kernl";

import { client } from "../client";

export const deletePost = tool({
  id: "posts_delete",
  description: "Delete a post",
  parameters: z.object({
    id: z.string().describe("Post ID to delete"),
  }),
  execute: async (ctx, params) => {
    const post = await client.post.postDelete({ id: params.id });

    return {
      id: post.id,
      title: post.title,
      deleted: true,
    };
  },
});
