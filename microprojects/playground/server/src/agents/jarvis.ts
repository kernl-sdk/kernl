import { z } from "zod";
import { Agent, pipe, GuardrailError } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";
import { openai } from "@kernl-sdk/ai/openai";

import {
  documents,
  memory,
  type SupermemoryContext,
} from "@/toolkits/supermemory";
import { supermemory, getUserId } from "@/toolkits/supermemory/client";

/**
 * Guardrail agent that detects math homework requests.
 */
export const guardrailer = new Agent({
  id: "guardrailer",
  name: "Math Homework Guardrail",
  model: anthropic("claude-sonnet-4-20250514"),
  instructions: `You are a content classifier. Analyze the user's message and determine if they are asking for help with math homework or math assignments.

Examples of math homework requests:
- "Can you solve this equation for me: 2x + 5 = 15"
- "What's the answer to problem 3 on my calculus homework?"
- "Help me with my algebra assignment"
- "Solve these math problems for my class"

Examples that are NOT math homework:
- "What is 2 + 2?" (simple curiosity)
- "Explain how derivatives work" (learning concepts)
- "How do I calculate a tip?" (practical application)
- "What's the history of calculus?" (general knowledge)

Be conservative - only flag clear homework/assignment requests.`,
  output: z.object({
    blocked: z.boolean(),
    reason: z.string().optional(),
  }),
});

/**
 * Pre-processor that runs the math homework guardrail.
 */
const guard = pipe.guardrail(async (ctx, items) => {
  const last = items
    .filter((item) => item.kind === "message" && item.role === "user")
    .pop();

  if (!last || last.kind !== "message") return;

  const text = last.content
    .filter((p) => p.kind === "text")
    .map((p) => p.text)
    .join("\n");

  if (!text) return;

  const result = await guardrailer.run(text);
  if (result.response.blocked) {
    throw new GuardrailError(
      result.response.reason ??
        "I can't help with math homework. Try asking me to explain the concepts instead!",
    );
  }
});

export const jarvis = new Agent<SupermemoryContext>({
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
  memory: {
    load: async (ctx) => {
      const uid = getUserId(ctx.context);
      const { profile } = await supermemory.profile({ containerTag: uid });

      return `You are assisting a user.

      ABOUT THE USER:
      ${profile.static.join("\n") || "No profile yet."}

      CURRENT CONTEXT:
      ${profile.dynamic.join("\n") || "No recent activity."}

      Personalize responses to their expertise and preferences.`;
    },
  },
});
