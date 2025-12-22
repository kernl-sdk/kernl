import { z } from "zod";
import { tool } from "kernl";

import { am } from "../index";

export const deleteDraft = tool({
  id: "agentmail_drafts_delete",
  description: "Delete a draft email",
  parameters: z.object({
    inbox_id: z.string().describe("The inbox the draft belongs to"),
    draft_id: z.string().describe("The draft ID to delete"),
  }),
  execute: async (ctx, params) => {
    await am.inboxes.drafts.delete(params.inbox_id, params.draft_id);

    return {
      deleted: true,
      draft_id: params.draft_id,
    };
  },
});
