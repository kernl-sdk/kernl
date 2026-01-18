import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";
import { openai } from "@kernl-sdk/ai/openai";

import { fs, process, code, computer, git } from "@/toolkits/daytona";

export const watson = new Agent({
  id: "watson",
  name: "Watson",
  description: "General assistant",
  instructions: `You are Watson, a helpful assistant. Answer questions, help with tasks, and use your available tools when appropriate.

You have access to a Daytona sandbox environment where you can:
- Execute shell commands and run code
- Read/write files and manage the filesystem
- Use git for version control
- Control the desktop for computer use tasks`,
  model: anthropic("claude-opus-4-5"),
  toolkits: [fs, process, git],
});
