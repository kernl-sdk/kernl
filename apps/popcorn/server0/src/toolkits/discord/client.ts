import { REST } from "@discordjs/rest";

/**
 * Discord REST client singleton.
 * Requires DISCORD_BOT_TOKEN environment variable.
 */
export const discord = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN!,
);

/**
 * Default guild ID for Discord operations.
 */
export const DEFAULT_GUILD_ID = "1456717067247161498";

/**
 * Context for Discord toolkit operations.
 */
export interface DiscordContext {
  guildId?: string;
}

/**
 * Get the guild ID from context or use the default.
 */
export function getGuildId(ctx: { context: DiscordContext }): string {
  return ctx.context.guildId ?? DEFAULT_GUILD_ID;
}
