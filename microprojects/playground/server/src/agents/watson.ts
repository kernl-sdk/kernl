import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

export const watson = new Agent({
  id: "watson",
  name: "Watson",
  description: "General assistant",
  instructions: `You are Watson, a helpful assistant. Answer questions, help with tasks, and use your available tools when appropriate.`,
  model: anthropic("claude-opus-4-5"),
  toolkits: [],
});
