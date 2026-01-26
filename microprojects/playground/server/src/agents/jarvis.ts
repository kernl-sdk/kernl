import { Agent } from "kernl";
import { mistral } from "@kernl-sdk/ai/mistral";
import { anthropic } from "@kernl-sdk/ai/anthropic";

import { fs, process } from "@/toolkits/modal";

export const jarvis = new Agent({
  id: "jarvis",
  name: "Jarvis",
  description: "General assistant",
  model: anthropic("claude-opus-4-5"),
  instructions: `You are Jarvis, a helpful assistant. Answer questions, help with tasks, and use your available tools when appropriate.

You have access to a Modal sandbox environment where you can:
- Execute shell commands and run code
- Read/write files and manage the filesystem`,
  toolkits: [fs, process],
});
