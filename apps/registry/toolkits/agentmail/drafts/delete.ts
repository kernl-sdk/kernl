import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "../client";

export const deleteDraft = tool({
  id: "agentmail_drafts_delete",
  description: "Delete a draft email",
  parameters: z.object({
    draft_id: z.string().describe("The draft ID to delete"),
  }),
  execute: async (ctx, params) => {
    await am.inboxes.drafts.delete(INBOX_ID, params.draft_id);

    return {
      deleted: true,
      draft_id: params.draft_id,
    };
  },
});
