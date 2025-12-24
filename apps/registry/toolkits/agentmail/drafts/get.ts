import { z } from "zod";
import { tool } from "kernl";

import { am } from "../client";

export const getDraft = tool({
  id: "agentmail_drafts_get",
  description: "Get the details of a specific draft",
  parameters: z.object({
    inbox_id: z.string().describe("The inbox the draft belongs to"),
    draft_id: z.string().describe("The draft ID to retrieve"),
  }),
  execute: async (ctx, params) => {
    const draft = await am.inboxes.drafts.get(params.inbox_id, params.draft_id);

    return {
      draft_id: draft.draftId,
      to: draft.to,
      cc: draft.cc,
      bcc: draft.bcc,
      subject: draft.subject,
      text: draft.text,
      html: draft.html,
    };
  },
});
