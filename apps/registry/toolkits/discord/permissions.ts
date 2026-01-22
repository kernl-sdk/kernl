import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";
import { Routes, OverwriteType } from "discord-api-types/v10";

import { discord, type DiscordContext } from "./client";
import { PERMISSION_BITS, encode } from "./util/permissions";

/**
 * Permission flags available for channel overwrites.
 */
const PERMISSION_FLAGS = Object.keys(PERMISSION_BITS) as [string, ...string[]];

/**
 * Set permission overwrites for a role or user on a channel.
 */
export const set = tool({
  id: "permissions_set",
  description:
    "Set permission overwrites for a role or user on a specific channel",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    targetId: z.string().describe("The role or user ID to set permissions for"),
    targetType: z
      .enum(["role", "member"])
      .describe("Whether the target is a role or member"),
    allow: z
      .array(z.enum(PERMISSION_FLAGS))
      .default([])
      .describe("Permissions to explicitly allow"),
    deny: z
      .array(z.enum(PERMISSION_FLAGS))
      .default([])
      .describe("Permissions to explicitly deny"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { channelId, targetId, targetType, allow, deny },
  ) {
    await discord.put(Routes.channelPermission(channelId, targetId), {
      body: {
        type: targetType === "role" ? OverwriteType.Role : OverwriteType.Member,
        allow: encode(allow),
        deny: encode(deny),
      },
    });

    return { success: true, channelId, targetId, allow, deny };
  },
});

/**
 * Remove permission overwrites for a role or user on a channel.
 */
export const remove = tool({
  id: "permissions_remove",
  description: "Remove permission overwrites for a role or user on a channel",
  parameters: z.object({
    channelId: z.string().describe("The channel ID"),
    targetId: z
      .string()
      .describe("The role or user ID to remove permissions for"),
  }),
  async execute(ctx: Context<DiscordContext>, { channelId, targetId }) {
    await discord.delete(Routes.channelPermission(channelId, targetId));
    return { success: true, channelId, targetId };
  },
});

export const permissions = new Toolkit<DiscordContext>({
  id: "permissions",
  description: "Discord channel permission management",
  tools: [set, remove],
});
