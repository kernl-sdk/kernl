import { z } from "zod";
import { tool } from "kernl";

import { am } from "../client";

export const listMessages = tool({
  id: "agentmail_messages_list",
  description: "List all messages in an inbox",
  parameters: z.object({
    inbox_id: z.string().describe("The inbox to list messages from"),
  }),
  execute: async (ctx, params) => {
    const result = await am.inboxes.messages.list(params.inbox_id);

    return {
      count: result.count,
      messages: result.messages?.map((m) => ({
        id: m.messageId,
        thread_id: m.threadId,
        from: m.from,
        to: m.to,
        subject: m.subject,
        timestamp: m.timestamp,
      })),
    };
  },
});
