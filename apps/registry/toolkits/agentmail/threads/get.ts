import { z } from "zod";
import { tool } from "kernl";

import { am } from "../client";

export const getThread = tool({
  id: "agentmail_threads_get",
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
