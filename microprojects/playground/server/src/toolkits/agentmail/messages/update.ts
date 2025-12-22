import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "../index";

export const updateMessage = tool({
  id: "agentmail_messages_update",
  description: "Update a message's labels for organizing and tracking workflows",
  parameters: z.object({
    message_id: z.string().describe("The message ID to update"),
    add_labels: z.array(z.string()).optional().describe("Labels to add to the message"),
    remove_labels: z.array(z.string()).optional().describe("Labels to remove from the message"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.messages.update(INBOX_ID, params.message_id, {
      addLabels: params.add_labels,
      removeLabels: params.remove_labels,
    });

    return {
      message_id: message.messageId,
      labels: message.labels,
    };
  },
});
