import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 30;

// NOTE: currently unused; but you could use this if you wanted a serverless chat endpoint with 'ai' SDK
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages: convertToModelMessages(messages),
    system:
      "You are a helpful assistant that can answer questions and help with tasks",
  });

  return result.toUIMessageStreamResponse();
}
