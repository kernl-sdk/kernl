import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "./client";

/**
 * @tool
 *
 * Creates a draft email for review before sending.
 */
export const createDraft = tool({
  id: "agentmail_drafts_create",
  description: "Create a draft email for review before sending",
  parameters: z.object({
    to: z.array(z.string()).describe("Recipient email addresses"),
    subject: z.string().describe("Email subject line"),
    text: z.string().optional().describe("Plain text body of the email"),
    html: z.string().optional().describe("HTML body of the email"),
    cc: z.array(z.string()).optional().describe("CC recipient email addresses"),
    bcc: z.array(z.string()).optional().describe("BCC recipient email addresses"),
  }),
  execute: async (ctx, params) => {
    const draft = await am.inboxes.drafts.create(INBOX_ID, {
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

/**
 * @tool
 *
 * Gets the details of a specific draft.
 */
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

/**
 * @tool
 *
 * Lists all drafts across the organization.
 */
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

/**
 * @tool
 *
 * Sends a draft email, converting it to a sent message.
 */
export const sendDraft = tool({
  id: "agentmail_drafts_send",
  description: "Send a draft email, converting it to a sent message",
  parameters: z.object({
    draft_id: z.string().describe("The draft ID to send"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.drafts.send(INBOX_ID, params.draft_id, {});

    return {
      message_id: message.messageId,
      thread_id: message.threadId,
    };
  },
});

/**
 * @tool
 *
 * Updates a draft email before sending.
 */
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

/**
 * @tool
 *
 * Deletes a draft email.
 */
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
