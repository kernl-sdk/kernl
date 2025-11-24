import { Kernl } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

import { jarvis } from "@/agents/jarvis";

/**
 * Main entrypoint.
 */
async function main() {
  const kernl = new Kernl();

  // --- agents ---
  kernl.register(jarvis);

  const result = await jarvis.run(
    "Calculate 15 * 7, then add 23 to the result. What's the final answer?",
  );
  console.log(result.response);

  // streaming execution with agent.stream()
  const stream = jarvis.stream("What's 100 divided by 4, then subtract 10?");

  for await (const event of stream) {
    // stream text deltas to console
    if (event.kind === "text-delta") {
      process.stdout.write(event.text);
    }
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
