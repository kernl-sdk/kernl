import { z } from "zod";
import { tool } from "kernl";

import { am, INBOX_ID } from "./client";

/**
 * @tool
 *
 * Sends a new email message, creating a new thread.
 */
export const sendMessage = tool({
  id: "messages_send",
  description: "Send a new email message, creating a new thread",
  parameters: z.object({
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    text: z.string().describe("Plain text body of the email"),
    html: z.string().optional().describe("HTML body of the email"),
    cc: z.string().optional().describe("CC recipient email address"),
    bcc: z.string().optional().describe("BCC recipient email address"),
    labels: z.array(z.string()).optional().describe("Labels to apply to the message"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.messages.send(INBOX_ID, {
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

/**
 * @tool
 *
 * Lists all messages in the inbox.
 */
export const listMessages = tool({
  id: "messages_list",
  description: "List all messages in the inbox",
  parameters: z.object({}),
  execute: async () => {
    const result = await am.inboxes.messages.list(INBOX_ID);

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

/**
 * @tool
 *
 * Gets the details of a specific message.
 */
export const getMessage = tool({
  id: "messages_get",
  description: "Get the details of a specific message",
  parameters: z.object({
    message_id: z.string().describe("The message ID to retrieve"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.messages.get(INBOX_ID, params.message_id);

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

/**
 * @tool
 *
 * Replies to an existing message in a thread.
 */
export const replyToMessage = tool({
  id: "messages_reply",
  description: "Reply to an existing message in a thread",
  parameters: z.object({
    message_id: z.string().describe("The message ID to reply to"),
    text: z.string().describe("Plain text body of the reply"),
    html: z.string().optional().describe("HTML body of the reply"),
  }),
  execute: async (ctx, params) => {
    const message = await am.inboxes.messages.reply(INBOX_ID, params.message_id, {
      text: params.text,
      html: params.html,
    });

    return {
      message_id: message.messageId,
      thread_id: message.threadId,
    };
  },
});

/**
 * @tool
 *
 * Updates a message's labels for organizing and tracking.
 */
export const updateMessage = tool({
  id: "messages_update",
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
