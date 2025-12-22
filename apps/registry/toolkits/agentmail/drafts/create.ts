import { z } from "zod";
import { tool } from "kernl";

import { am } from "../index";

export const createDraft = tool({
  id: "agentmail_drafts_create",
  description: "Create a draft email for review before sending",
  parameters: z.object({
    inbox_id: z.string().describe("The inbox to create the draft in"),
    to: z.array(z.string()).describe("Recipient email addresses"),
    subject: z.string().describe("Email subject line"),
    text: z.string().optional().describe("Plain text body of the email"),
    html: z.string().optional().describe("HTML body of the email"),
    cc: z.array(z.string()).optional().describe("CC recipient email addresses"),
    bcc: z.array(z.string()).optional().describe("BCC recipient email addresses"),
  }),
  execute: async (ctx, params) => {
    const draft = await am.inboxes.drafts.create(params.inbox_id, {
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
