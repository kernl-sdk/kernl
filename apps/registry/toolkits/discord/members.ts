import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";
import { Routes } from "discord-api-types/v10";

import { discord, getGuildId, type DiscordContext } from "./client";

/**
 * List members in the guild.
 */
export const list = tool({
  id: "members_list",
  description: "List members in the Discord server",
  parameters: z.object({
    limit: z
      .number()
      .min(1)
      .max(1000)
      .default(100)
      .describe("Max number of members to return (1-1000)"),
    after: z.string().optional().describe("Get members after this user ID"),
  }),
  async execute(ctx: Context<DiscordContext>, { limit, after }) {
    const guildId = getGuildId(ctx);
    const query = new URLSearchParams({ limit: String(limit) });
    if (after) query.set("after", after);

    const members = await discord.get(
      `${Routes.guildMembers(guildId)}?${query}`,
    );
    return members;
  },
});

/**
 * Get a specific member.
 */
export const get = tool({
  id: "members_get",
  description: "Get information about a specific server member",
  parameters: z.object({
    userId: z.string().describe("The user ID"),
  }),
  async execute(ctx: Context<DiscordContext>, { userId }) {
    const guildId = getGuildId(ctx);
    return await discord.get(Routes.guildMember(guildId, userId));
  },
});

/**
 * Edit a member (nickname, roles, etc.).
 */
export const edit = tool({
  id: "members_edit",
  description: "Edit a member's server profile",
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    nick: z.string().optional().describe("New nickname (null to remove)"),
    roles: z.array(z.string()).optional().describe("Array of role IDs to set"),
    mute: z.boolean().optional().describe("Whether member is muted in voice"),
    deaf: z
      .boolean()
      .optional()
      .describe("Whether member is deafened in voice"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { userId, nick, roles, mute, deaf },
  ) {
    const guildId = getGuildId(ctx);
    const member = await discord.patch(Routes.guildMember(guildId, userId), {
      body: { nick, roles, mute, deaf },
    });

    return member;
  },
});

/**
 * Add a role to a member.
 */
export const addRole = tool({
  id: "members_add_role",
  description: "Add a role to a member",
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    roleId: z.string().describe("The role ID to add"),
  }),
  async execute(ctx: Context<DiscordContext>, { userId, roleId }) {
    const guildId = getGuildId(ctx);
    await discord.put(Routes.guildMemberRole(guildId, userId, roleId));
    return { success: true, userId, roleId };
  },
});

/**
 * Remove a role from a member.
 */
export const removeRole = tool({
  id: "members_remove_role",
  description: "Remove a role from a member",
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    roleId: z.string().describe("The role ID to remove"),
  }),
  async execute(ctx: Context<DiscordContext>, { userId, roleId }) {
    const guildId = getGuildId(ctx);
    await discord.delete(Routes.guildMemberRole(guildId, userId, roleId));
    return { success: true, userId, roleId };
  },
});

/**
 * Kick a member from the server.
 */
export const kick = tool({
  id: "members_kick",
  description: "Kick a member from the server",
  parameters: z.object({
    userId: z.string().describe("The user ID to kick"),
  }),
  async execute(ctx: Context<DiscordContext>, { userId }) {
    const guildId = getGuildId(ctx);
    await discord.delete(Routes.guildMember(guildId, userId));
    return { success: true, userId };
  },
});

/**
 * Ban a member from the server.
 */
export const ban = tool({
  id: "members_ban",
  description: "Ban a user from the server",
  parameters: z.object({
    userId: z.string().describe("The user ID to ban"),
    deleteMessageSeconds: z
      .number()
      .min(0)
      .max(604800)
      .optional()
      .describe("Seconds of messages to delete (0-604800, 7 days max)"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { userId, deleteMessageSeconds },
  ) {
    const guildId = getGuildId(ctx);
    await discord.put(Routes.guildBan(guildId, userId), {
      body: { delete_message_seconds: deleteMessageSeconds },
    });

    return { success: true, userId };
  },
});

/**
 * Unban a user.
 */
export const unban = tool({
  id: "members_unban",
  description: "Unban a user from the server",
  parameters: z.object({
    userId: z.string().describe("The user ID to unban"),
  }),
  async execute(ctx: Context<DiscordContext>, { userId }) {
    const guildId = getGuildId(ctx);
    await discord.delete(Routes.guildBan(guildId, userId));
    return { success: true, userId };
  },
});

/**
 * Timeout a member (temporarily mute).
 */
export const timeout = tool({
  id: "members_timeout",
  description:
    "Timeout a member (prevent them from sending messages temporarily)",
  parameters: z.object({
    userId: z.string().describe("The user ID to timeout"),
    duration: z
      .number()
      .min(0)
      .max(2419200)
      .describe("Timeout duration in seconds (0 to remove, max 28 days)"),
  }),
  async execute(ctx: Context<DiscordContext>, { userId, duration }) {
    const guildId = getGuildId(ctx);
    const communicationDisabledUntil =
      duration > 0
        ? new Date(Date.now() + duration * 1000).toISOString()
        : null;

    await discord.patch(Routes.guildMember(guildId, userId), {
      body: { communication_disabled_until: communicationDisabledUntil },
    });

    return { success: true, userId, duration };
  },
});

export const members = new Toolkit<DiscordContext>({
  id: "members",
  description: "Discord member management",
  tools: [list, get, edit, addRole, removeRole, kick, ban, unban, timeout],
});
