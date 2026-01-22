import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";
import { Routes } from "discord-api-types/v10";

import { discord, getGuildId, type DiscordContext } from "./client";

/**
 * Get guild information.
 */
export const info = tool({
  id: "guild_info",
  description: "Get information about the Discord server",
  parameters: z.object({}),
  async execute(ctx: Context<DiscordContext>) {
    const guildId = getGuildId(ctx);
    const guild = await discord.get(Routes.guild(guildId));
    return guild;
  },
});

/**
 * Edit guild settings.
 */
export const edit = tool({
  id: "guild_edit",
  description: "Edit the Discord server's settings",
  parameters: z.object({
    name: z.string().optional().describe("New server name"),
    description: z.string().optional().describe("New server description"),
    afkChannelId: z.string().optional().describe("AFK voice channel ID"),
    afkTimeout: z
      .number()
      .optional()
      .describe("AFK timeout in seconds (60, 300, 900, 1800, 3600)"),
    systemChannelId: z.string().optional().describe("System messages channel ID"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { name, description, afkChannelId, afkTimeout, systemChannelId },
  ) {
    const guildId = getGuildId(ctx);
    const guild = await discord.patch(Routes.guild(guildId), {
      body: {
        name,
        description,
        afk_channel_id: afkChannelId,
        afk_timeout: afkTimeout,
        system_channel_id: systemChannelId,
      },
    });

    return guild;
  },
});

/**
 * List bans in the guild.
 */
export const bans = tool({
  id: "guild_bans",
  description: "List all banned users in the Discord server",
  parameters: z.object({
    limit: z.number().min(1).max(1000).default(100).describe("Max bans to return"),
    before: z.string().optional().describe("Get bans before this user ID"),
    after: z.string().optional().describe("Get bans after this user ID"),
  }),
  async execute(ctx: Context<DiscordContext>, { limit, before, after }) {
    const guildId = getGuildId(ctx);
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set("before", before);
    if (after) query.set("after", after);

    const banList = await discord.get(`${Routes.guildBans(guildId)}?${query}`);
    return banList;
  },
});

export const guild = new Toolkit<DiscordContext>({
  id: "guild",
  description: "Discord server/guild management",
  tools: [info, edit, bans],
});
