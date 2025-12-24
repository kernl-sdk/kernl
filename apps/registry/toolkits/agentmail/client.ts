import { AgentMailClient } from "agentmail";

export const am = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY,
});
