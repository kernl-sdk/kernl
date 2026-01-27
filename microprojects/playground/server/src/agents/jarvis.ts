import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";
import { openai } from "@kernl-sdk/ai/openai";

import { documents, memory } from "@/toolkits/supermemory";

export const jarvis = new Agent({
  id: "jarvis",
  name: "Jarvis",
  description: "General assistant",
  model: openai("gpt-5.2"),
  instructions: `You are Jarvis, a helpful assistant. Answer questions, help with tasks, and use your available tools when appropriate.

You have access to a Modal sandbox environment where you can:
- Execute shell commands and run code
- Read/write files and manage the filesystem

You can also store and search documents using Supermemory:
- Add documents (text or URLs) to remember information
- Search your knowledge base semantically`,
  toolkits: [memory, documents],
});
