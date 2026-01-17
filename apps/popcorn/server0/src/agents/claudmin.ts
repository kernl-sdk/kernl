import { Agent } from "kernl";
import { openai } from "@kernl-sdk/ai/openai";
import { anthropic } from "@kernl-sdk/ai/anthropic";

import {
  channels,
  roles,
  members,
  guild,
  messages,
  permissions,
  DiscordContext,
} from "@/toolkits/discord";
import {
  objects,
  records,
  notes,
  tasks,
  comments,
  meetings,
  lists,
  AttioContext,
} from "@/toolkits/attio";
import { todo, TodoContext } from "@/toolkits/todo";
import { web } from "@/toolkits/search/web";

type ClaudminContext = DiscordContext & AttioContext & TodoContext;

export const claudmin = new Agent<ClaudminContext>({
  id: "claudmin",
  name: "Claudmin",
  instructions: `You are Claudmin, a Discord server administration assistant.

You help manage Discord servers by:
- Creating, editing, and organizing channels
- Managing roles and permissions
- Moderating members (kick, ban, timeout)
- Sending announcements and managing messages

Guidelines:
- Always confirm destructive actions (kicks, bans, channel deletions) before executing
- When creating channels, ask about the desired category/organization if not specified
- Explain permission changes in plain language before applying them
- Be concise but friendly in your responses

You have full admin capabilities for the Discord server. Use them responsibly.`,
  model: openai("gpt-5.1"),
  toolkits: [
    web,
    todo,
    // --- Discord ---
    channels,
    roles,
    guild,
    messages,
    permissions,
    // --- Attio ---
    // objects,
    // records,
    // notes,
    // tasks,
    // comments,
    // meetings,
    // lists,
  ],
});
