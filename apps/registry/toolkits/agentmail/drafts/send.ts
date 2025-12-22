import { z } from "zod";
import { tool } from "kernl";

import { am } from "../index";

export const sendDraft = tool({
  id: "agentmail_drafts_send",
  description: "Send a draft email, converting it to a sent message",
  parameters: z.object({
    inbox_id: z.string().describe("The inbox the draft belongs to"),
    draft_id: z.string().describe("The draft ID to send"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.drafts.send(
      params.inbox_id,
      params.draft_id,
      {},
    );

    return {
      message_id: message.messageId,
      thread_id: message.threadId,
    };
  },
});
