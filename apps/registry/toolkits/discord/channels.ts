import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";
import { Routes, ChannelType } from "discord-api-types/v10";

import { discord, getGuildId, type DiscordContext } from "./client";

/**
 * List all channels in a guild.
 */
export const list = tool({
  id: "discord_channels_list",
  description: "List all channels in the Discord server",
  parameters: z.object({}),
  async execute(ctx: Context<DiscordContext>) {
    const guildId = getGuildId(ctx);
    const channels = await discord.get(Routes.guildChannels(guildId));
    return channels;
  },
});

/**
 * Get a channel by ID.
 */
export const get = tool({
  id: "discord_channels_get",
  description: "Get information about a specific channel",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
  }),
  async execute(ctx: Context<DiscordContext>, { channelId }) {
    const channel = await discord.get(Routes.channel(channelId));
    return channel;
  },
});

/**
 * Create a new channel.
 */
export const create = tool({
  id: "discord_channels_create",
  description: "Create a new channel in the Discord server",
  parameters: z.object({
    name: z.string().describe("Channel name"),
    type: z
      .enum(["text", "voice", "category", "announcement", "forum"])
      .default("text")
      .describe("Channel type"),
    topic: z.string().optional().describe("Channel topic (for text channels)"),
    parentId: z.string().optional().describe("Parent category ID"),
    position: z.number().optional().describe("Sorting position"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { name, type, topic, parentId, position },
  ) {
    const guildId = getGuildId(ctx);
    const typeMap: Record<string, ChannelType> = {
      text: ChannelType.GuildText,
      voice: ChannelType.GuildVoice,
      category: ChannelType.GuildCategory,
      announcement: ChannelType.GuildAnnouncement,
      forum: ChannelType.GuildForum,
    };

    const channel = await discord.post(Routes.guildChannels(guildId), {
      body: {
        name,
        type: typeMap[type],
        topic,
        parent_id: parentId,
        position,
      },
    });

    return channel;
  },
});

/**
 * Edit a channel.
 */
export const edit = tool({
  id: "discord_channels_edit",
  description: "Edit a channel's settings",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    name: z.string().optional().describe("New channel name"),
    topic: z.string().optional().describe("New channel topic"),
    position: z.number().optional().describe("New sorting position"),
    parentId: z
      .string()
      .optional()
      .describe("New parent category ID (null to remove)"),
    nsfw: z.boolean().optional().describe("Whether channel is NSFW"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { channelId, name, topic, position, parentId, nsfw },
  ) {
    const channel = await discord.patch(Routes.channel(channelId), {
      body: {
        name,
        topic,
        position,
        parent_id: parentId,
        nsfw,
      },
    });

    return channel;
  },
});

/**
 * Delete a channel.
 */
export const remove = tool({
  id: "discord_channels_delete",
  description: "Delete a channel",
  parameters: z.object({
    channelId: z.string().describe("The channel ID to delete"),
  }),
  async execute(ctx: Context<DiscordContext>, { channelId }) {
    await discord.delete(Routes.channel(channelId));
    return { success: true, channelId };
  },
});

export const channels = new Toolkit<DiscordContext>({
  id: "discord_channels",
  description: "Discord channel management",
  tools: [list, get, create, edit, remove],
});
