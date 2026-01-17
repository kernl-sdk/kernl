import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";
import { openai } from "@kernl-sdk/ai/openai";

/**
 * Haiku agent for generating short, human-readable session titles.
 */
export const titler = new Agent({
  id: "titler",
  name: "Titler",
  instructions: `You generate concise, human-readable titles for coding sessions.

Given a user message, respond with a short title (max 8 words)
that summarizes the task in a way that's useful in a sessions list.

Return only the title text, with no quotes or other decoration.`,
  model: anthropic("claude-haiku-4-5"),
});
