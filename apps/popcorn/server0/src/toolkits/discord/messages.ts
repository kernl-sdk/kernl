import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";
import { Routes } from "discord-api-types/v10";

import { discord, type DiscordContext } from "./client";

/**
 * Send a message to a channel.
 */
export const send = tool({
  id: "discord_messages_send",
  description: "Send a message to a Discord channel",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    content: z.string().optional().describe("Message content (up to 2000 chars)"),
    embeds: z
      .array(
        z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          color: z.number().optional(),
          url: z.string().optional(),
          footer: z.object({ text: z.string() }).optional(),
          fields: z
            .array(
              z.object({
                name: z.string(),
                value: z.string(),
                inline: z.boolean().optional(),
              }),
            )
            .optional(),
        }),
      )
      .optional()
      .describe("Embed objects to include"),
    replyTo: z.string().optional().describe("Message ID to reply to"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { channelId, content, embeds, replyTo },
  ) {
    const body: Record<string, unknown> = {};
    if (content) body.content = content;
    if (embeds) body.embeds = embeds;
    if (replyTo) {
      body.message_reference = { message_id: replyTo };
    }

    const message = await discord.post(Routes.channelMessages(channelId), {
      body,
    });

    return message;
  },
});

/**
 * Get messages from a channel.
 */
export const list = tool({
  id: "discord_messages_list",
  description: "Get messages from a Discord channel",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(50)
      .describe("Number of messages to retrieve (1-100)"),
    before: z.string().optional().describe("Get messages before this ID"),
    after: z.string().optional().describe("Get messages after this ID"),
    around: z.string().optional().describe("Get messages around this ID"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { channelId, limit, before, after, around },
  ) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set("before", before);
    if (after) query.set("after", after);
    if (around) query.set("around", around);

    const messages = await discord.get(
      `${Routes.channelMessages(channelId)}?${query}`,
    );
    return messages;
  },
});

/**
 * Get a specific message.
 */
export const get = tool({
  id: "discord_messages_get",
  description: "Get a specific message by ID",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    messageId: z.string().describe("The message ID"),
  }),
  async execute(ctx: Context<DiscordContext>, { channelId, messageId }) {
    const message = await discord.get(
      Routes.channelMessage(channelId, messageId),
    );
    return message;
  },
});

/**
 * Delete a message.
 */
export const remove = tool({
  id: "discord_messages_delete",
  description: "Delete a message",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    messageId: z.string().describe("The message ID to delete"),
  }),
  async execute(ctx: Context<DiscordContext>, { channelId, messageId }) {
    await discord.delete(Routes.channelMessage(channelId, messageId));
    return { success: true, channelId, messageId };
  },
});

/**
 * Bulk delete messages (for moderation).
 */
export const bulkDelete = tool({
  id: "discord_messages_bulk_delete",
  description:
    "Bulk delete messages (2-100 messages, must be less than 14 days old)",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    messageIds: z
      .array(z.string())
      .min(2)
      .max(100)
      .describe("Array of message IDs to delete (2-100)"),
  }),
  async execute(ctx: Context<DiscordContext>, { channelId, messageIds }) {
    await discord.post(Routes.channelBulkDelete(channelId), {
      body: { messages: messageIds },
    });

    return { success: true, channelId, deleted: messageIds.length };
  },
});

/**
 * Pin a message.
 */
export const pin = tool({
  id: "discord_messages_pin",
  description: "Pin a message to a channel",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    messageId: z.string().describe("The message ID to pin"),
  }),
  async execute(ctx: Context<DiscordContext>, { channelId, messageId }) {
    await discord.put(Routes.channelPin(channelId, messageId));
    return { success: true, channelId, messageId };
  },
});

/**
 * Unpin a message.
 */
export const unpin = tool({
  id: "discord_messages_unpin",
  description: "Unpin a message from a channel",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    messageId: z.string().describe("The message ID to unpin"),
  }),
  async execute(ctx: Context<DiscordContext>, { channelId, messageId }) {
    await discord.delete(Routes.channelPin(channelId, messageId));
    return { success: true, channelId, messageId };
  },
});

export const messages = new Toolkit<DiscordContext>({
  id: "discord_messages",
  description: "Discord message operations",
  tools: [send, list, get, remove, bulkDelete, pin, unpin],
});
