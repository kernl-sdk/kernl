import { z } from "zod";
import { tool } from "kernl";

import { client } from "../client";

export const retryPost = tool({
  id: "posts_retry",
  description: "Retry a failed post",
  parameters: z.object({
    id: z.string().describe("Post ID to retry"),
  }),
  execute: async (ctx, params) => {
    const post = await client.post.postRetry({ id: params.id });

    return {
      id: post.id,
      title: post.title,
      status: post.status,
    };
  },
});
