import { z } from "zod";
import { tool } from "kernl";

import { am } from "../index";

export const replyToMessage = tool({
  id: "agentmail_messages_reply",
  description: "Reply to an existing message in a thread",
  parameters: z.object({
    inbox_id: z.string().describe("The inbox to send from"),
    message_id: z.string().describe("The message ID to reply to"),
    text: z.string().describe("Plain text body of the reply"),
    html: z.string().optional().describe("HTML body of the reply"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.messages.reply(
      params.inbox_id,
      params.message_id,
      {
        text: params.text,
        html: params.html,
      },
    );

    return {
      message_id: message.messageId,
      thread_id: message.threadId,
    };
  },
});
