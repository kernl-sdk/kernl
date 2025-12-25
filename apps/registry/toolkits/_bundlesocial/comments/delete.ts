import { z } from "zod";
import { tool } from "kernl";

import { client } from "../client";

export const deleteComment = tool({
  id: "bundlesocial_comments_delete",
  description: "Delete a comment",
  parameters: z.object({
    id: z.string().describe("Comment ID to delete"),
  }),
  execute: async (ctx, params) => {
    const comment = await client.comment.commentDelete({ id: params.id });

    return {
      id: comment.id,
      deleted: true,
    };
  },
});
