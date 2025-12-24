import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "../client";

export const getMessage = tool({
  id: "agentmail_messages_get",
  description: "Get the details of a specific message",
  parameters: z.object({
    message_id: z.string().describe("The message ID to retrieve"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.messages.get(
      INBOX_ID,
      params.message_id,
    );

    return {
      id: message.messageId,
      thread_id: message.threadId,
      from: message.from,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      text: message.text,
      html: message.html,
      timestamp: message.timestamp,
      labels: message.labels,
    };
  },
});
