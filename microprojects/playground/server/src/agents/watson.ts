import { Agent } from "kernl";
import { openai } from "@kernl-sdk/ai/openai";

export const watson = new Agent({
  id: "watson",
  name: "Watson",
  description: "General assistant",
  instructions: `You are Watson, a helpful assistant. Answer questions, help with tasks, and use your available tools when appropriate.`,
  model: openai("gpt-5.1"),
});
