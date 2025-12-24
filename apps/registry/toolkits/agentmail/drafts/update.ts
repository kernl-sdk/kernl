import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "../client";

export const updateDraft = tool({
  id: "agentmail_drafts_update",
  description: "Update a draft email before sending",
  parameters: z.object({
    draft_id: z.string().describe("The draft ID to update"),
    to: z.array(z.string()).optional().describe("Updated recipient email addresses"),
    subject: z.string().optional().describe("Updated email subject line"),
    text: z.string().optional().describe("Updated plain text body"),
    html: z.string().optional().describe("Updated HTML body"),
    cc: z.array(z.string()).optional().describe("Updated CC recipients"),
    bcc: z.array(z.string()).optional().describe("Updated BCC recipients"),
  }),
  execute: async (ctx, params) => {
    const draft = await am.inboxes.drafts.update(INBOX_ID, params.draft_id, {
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      cc: params.cc,
      bcc: params.bcc,
    });

    return {
      draft_id: draft.draftId,
      to: draft.to,
      subject: draft.subject,
    };
  },
});
