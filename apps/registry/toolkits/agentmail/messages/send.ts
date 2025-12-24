import { z } from "zod";
import { tool } from "kernl";

import { am } from "../client";

export const sendMessage = tool({
  id: "agentmail_messages_send",
  description: "Send a new email message, creating a new thread",
  parameters: z.object({
    inbox_id: z.string().describe("The inbox to send from (e.g. 'outreach@agentmail.to')"),
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    text: z.string().describe("Plain text body of the email"),
    html: z.string().optional().describe("HTML body of the email"),
    cc: z.string().optional().describe("CC recipient email address"),
    bcc: z.string().optional().describe("BCC recipient email address"),
    labels: z.array(z.string()).optional().describe("Labels to apply to the message"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.messages.send(params.inbox_id, {
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      cc: params.cc,
      bcc: params.bcc,
      labels: params.labels,
    });

    return {
      message_id: message.messageId,
      thread_id: message.threadId,
    };
  },
});
