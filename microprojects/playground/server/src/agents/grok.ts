import { Agent } from "kernl";
import { xai } from "@kernl-sdk/ai/xai";

import { fs, git, process } from "@/toolkits/daytona";

export const grok = new Agent({
  id: "grok",
  name: "Grok",
  description: "xAI Grok assistant for testing",
  model: xai("grok-4-latest"),
  instructions:
    "You are Grok, a helpful AI assistant. Be concise and informative.",
  toolkits: [git, process, fs],
});
