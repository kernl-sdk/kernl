import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

import { math } from "@/toolkits/math";

export const jarvis = new Agent({
  id: "jarvis",
  name: "Jarvis",
  instructions:
    "You are Jarvis, a helpful AI assistant with access to mathematical tools. " +
    "Use the math toolkit to perform calculations when needed.",
  model: anthropic("claude-sonnet-4-5"),
  toolkits: [math],
});
