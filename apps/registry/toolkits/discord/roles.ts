import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";
import { Routes } from "discord-api-types/v10";

import { discord, getGuildId, type DiscordContext } from "./client";
import { transformRole } from "./util/permissions";

/**
 * List all roles in the guild.
 */
export const list = tool({
  id: "discord_roles_list",
  description: "List all roles in the Discord server",
  parameters: z.object({}),
  async execute(ctx: Context<DiscordContext>) {
    const guildId = getGuildId(ctx);
    const roles = (await discord.get(Routes.guildRoles(guildId))) as Record<string, unknown>[];
    return roles.map(transformRole);
  },
});

/**
 * Create a new role.
 */
export const create = tool({
  id: "discord_roles_create",
  description: "Create a new role in the Discord server",
  parameters: z.object({
    name: z.string().describe("Role name"),
    color: z
      .number()
      .optional()
      .describe("Role color as integer (e.g., 0xFF0000 for red)"),
    hoist: z
      .boolean()
      .optional()
      .describe("Whether to display role members separately"),
    mentionable: z.boolean().optional().describe("Whether role can be mentioned"),
    permissions: z
      .string()
      .optional()
      .describe("Permission bitfield as string"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { name, color, hoist, mentionable, permissions },
  ) {
    const guildId = getGuildId(ctx);
    const role = (await discord.post(Routes.guildRoles(guildId), {
      body: {
        name,
        color,
        hoist,
        mentionable,
        permissions,
      },
    })) as Record<string, unknown>;

    return transformRole(role);
  },
});

/**
 * Edit a role.
 */
export const edit = tool({
  id: "discord_roles_edit",
  description: "Edit a role's settings",
  parameters: z.object({
    roleId: z.string().describe("The role ID"),
    name: z.string().optional().describe("New role name"),
    color: z.number().optional().describe("New role color as integer"),
    hoist: z.boolean().optional().describe("Whether to display separately"),
    mentionable: z.boolean().optional().describe("Whether role can be mentioned"),
    permissions: z
      .string()
      .optional()
      .describe("Permission bitfield as string"),
  }),
  async execute(
    ctx: Context<DiscordContext>,
    { roleId, name, color, hoist, mentionable, permissions },
  ) {
    const guildId = getGuildId(ctx);
    const role = (await discord.patch(Routes.guildRole(guildId, roleId), {
      body: {
        name,
        color,
        hoist,
        mentionable,
        permissions,
      },
    })) as Record<string, unknown>;

    return transformRole(role);
  },
});

/**
 * Delete a role.
 */
export const remove = tool({
  id: "discord_roles_delete",
  description: "Delete a role from the Discord server",
  parameters: z.object({
    roleId: z.string().describe("The role ID to delete"),
  }),
  async execute(ctx: Context<DiscordContext>, { roleId }) {
    const guildId = getGuildId(ctx);
    await discord.delete(Routes.guildRole(guildId, roleId));
    return { success: true, roleId };
  },
});

export const roles = new Toolkit<DiscordContext>({
  id: "discord_roles",
  description: "Discord role management",
  tools: [list, create, edit, remove],
});
