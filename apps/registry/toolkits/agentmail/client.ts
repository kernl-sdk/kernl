import { AgentMailClient } from "agentmail";

export const am = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY,
});

/**
 * Inbox ID for AgentMail operations.
 *
 * This is configured at the toolkit level. For dynamic inbox IDs
 * (e.g., multi-tenant scenarios), use context to propagate the inbox ID
 * to the tools at runtime.
 */
export const INBOX_ID = process.env.AGENTMAIL_INBOX_ID!;
