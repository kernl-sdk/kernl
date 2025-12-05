import "@kernl-sdk/ai/openai"; // registers openai provider for embeddings

import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

export const echo = new Agent({
  id: "echo",
  name: "Echo",
  description: "A simple echo agent for testing the playground",
  instructions:
    "You are a helpful assistant. Echo back what the user says with a friendly twist.",
  model: anthropic("claude-haiku-4-5"),
});
