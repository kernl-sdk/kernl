import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

/**
 * Lightweight agent for generating thread titles.
 *
 * Uses Haiku for fast, cheap title generation.
 */
export const titler = new Agent({
  id: "titler",
  name: "Titler",
  instructions: `You generate concise, human-readable titles for chat threads.

Given a user message, respond with a short title (max 8 words) that summarizes
the topic in a way that's useful in a conversation list.

Return only the title text, with no quotes or other decoration.`,
  model: anthropic("claude-haiku-4-5"),
});
