// import "@kernl-sdk/ai/openai";
import { openai } from "@kernl-sdk/ai/openai";
import { Agent } from "kernl";
// import { anthropic } from "@kernl-sdk/ai/anthropic";


export const sleeper = new Agent({
  id: "sleeper",
  name: "Sleeper",
  description: "An agent that demonstrates the sleep/wakeup system tool",
  instructions: `You are a helpful assistant that can pause and wait.
When asked to wait or sleep, use the wait_until tool with an appropriate delay.
Always explain what you're doing before sleeping.`,
  model: openai("gpt-5.1"),
  memory: { enabled: true },
});
