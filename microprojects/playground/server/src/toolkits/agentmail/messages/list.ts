import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "../index";

export const listMessages = tool({
  id: "agentmail_messages_list",
  description: "List all messages in the inbox",
  parameters: z.object({}),
  execute: async () => {
    const result = await am.inboxes.messages.list(INBOX_ID);

    return {
      count: result.count,
      messages: result.messages?.map((m) => ({
        message_id: m.messageId,
        thread_id: m.threadId,
        from: m.from,
        to: m.to,
        subject: m.subject,
        timestamp: m.timestamp,
      })),
    };
  },
});
