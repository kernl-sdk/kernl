import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "./client";

/**
 * @tool
 *
 * Lists threads in the inbox.
 */
export const listThreads = tool({
  id: "threads_list",
  description: "List threads in the inbox",
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

/**
 * @tool
 *
 * Gets a thread with all its messages.
 */
export const getThread = tool({
  id: "threads_get",
  description: "Get a thread with all its messages",
  parameters: z.object({
    thread_id: z.string().describe("The thread ID to retrieve"),
  }),
  execute: async (ctx, params) => {
    const thread = await am.threads.get(params.thread_id);

    return {
      id: thread.threadId,
      subject: thread.subject,
      messages: thread.messages?.map((m) => ({
        id: m.messageId,
        from: m.from,
        to: m.to,
        subject: m.subject,
        text: m.text,
        timestamp: m.timestamp,
      })),
    };
  },
});
