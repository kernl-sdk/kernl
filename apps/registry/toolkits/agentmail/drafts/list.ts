import { z } from "zod";
import { tool } from "kernl";

import { am } from "../client";

export const listDrafts = tool({
  id: "agentmail_drafts_list",
  description: "List all drafts across the organization",
  parameters: z.object({}),
  execute: async () => {
    const result = await am.drafts.list();

    return {
      count: result.count,
      drafts: result.drafts?.map((d) => ({
        draft_id: d.draftId,
        inbox_id: d.inboxId,
        to: d.to,
        subject: d.subject,
        updated_at: d.updatedAt,
      })),
    };
  },
});
