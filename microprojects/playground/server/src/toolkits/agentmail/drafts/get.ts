import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "../index";

export const getDraft = tool({
  id: "agentmail_drafts_get",
  description: "Get the details of a specific draft",
  parameters: z.object({
    draft_id: z.string().describe("The draft ID to retrieve"),
  }),
  execute: async (ctx, params) => {
    const draft = await am.inboxes.drafts.get(INBOX_ID, params.draft_id);

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
