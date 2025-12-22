import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "../index";

export const listThreads = tool({
  id: "agentmail_threads_list",
  description: "List all threads in the inbox",
  parameters: z.object({}),
  execute: async () => {
    const result = await am.inboxes.threads.list(INBOX_ID);

    return {
      count: result.count,
      threads: result.threads?.map((t) => ({
        id: t.threadId,
        subject: t.subject,
        message_count: t.messageCount,
        updated_at: t.updatedAt,
      })),
    };
  },
});
