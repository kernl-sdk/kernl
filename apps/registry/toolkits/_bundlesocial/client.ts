import { Bundlesocial } from "bundlesocial";

export const client = new Bundlesocial(process.env.BUNDLESOCIAL_API_KEY!);

/**
 * Team ID for Bundle Social operations.
 *
 * This is configured at the toolkit level. If you need per-request team IDs
 * (e.g., multi-tenant scenarios), modify the tools to accept team_id from
 * the agent context instead.
 */
export const TEAM_ID = process.env.BUNDLESOCIAL_TEAM_ID!;
