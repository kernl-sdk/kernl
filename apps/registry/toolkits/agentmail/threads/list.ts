import { z } from "zod";
import { tool } from "kernl";

import { am } from "../index";

export const listThreads = tool({
  id: "agentmail_threads_list",
  description:
    "List threads. Provide inbox_id to list threads in a specific inbox, or omit for org-wide listing.",
  parameters: z.object({
    inbox_id: z
      .string()
      .optional()
      .describe("The inbox to list threads from. Omit for org-wide listing."),
  }),
  execute: async (ctx, params) => {
    const result = params.inbox_id
      ? await am.inboxes.threads.list(params.inbox_id)
      : await am.threads.list();

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
