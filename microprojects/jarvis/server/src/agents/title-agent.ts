import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

/**
 * Haiku agent for generating short, human-readable thread titles.
 */
export const titler = new Agent({
  id: "jarvis-title-generator",
  name: "Jarvis Title Generator",
  instructions: `You generate concise, human-readable titles for Jarvis threads.

Given a user message or short transcript, respond with a short title (max 8 words)
that summarizes the conversation in a way that's useful in a threads list.

Return only the title text, with no quotes or other decoration.`,
  model: anthropic("claude-haiku-4-5"),
});
