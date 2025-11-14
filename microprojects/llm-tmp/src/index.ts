#!/usr/bin/env tsx

/**
 * Example: Using @kernl-sdk/ai with the AI SDK
 *
 * This example demonstrates how to use the AISDKLanguageModel adapter
 * to integrate AI SDK models with the Kernl protocol.
 *
 * Run with: ANTHROPIC_API_KEY=your-key pnpm start
 */

import { anthropic } from "@kernl-sdk/ai/anthropic";

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY environment variable is required");
  console.error("Run with: ANTHROPIC_API_KEY=your-key pnpm start");
  process.exit(1);
}

/**
 * Main entrypoint.
 */
async function main() {
  try {
    await testGenerate();
    await testStream();
    await testTools();
    await testConversation();

    console.log("✅ All examples completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

const model = anthropic("claude-sonnet-4-5");

console.log("Testing @kernl-sdk/ai Language Model Adapter\n");
console.log(`Provider: ${model.provider}`);
console.log(`Model ID: ${model.modelId}`);
console.log(`Spec: ${model.spec}\n`);

// Example 1: Basic Generation
async function testGenerate() {
  console.log("Example 1: Basic Generation");
  console.log("─────────────────────────────");

  const response = await model.generate({
    input: [
      {
        kind: "message",
        role: "user",
        id: "msg-1",
        content: [
          { kind: "text", text: "What is 2 + 2? Answer in one sentence." },
        ],
      },
    ],
    settings: {
      temperature: 0.7,
      maxTokens: 100,
    },
  });

  console.log("Response:");
  for (const item of response.content) {
    if (item.kind === "message") {
      const firstContent = item.content[0];
      if (firstContent?.kind === "text") {
        console.log(`  [${item.role}]:`, firstContent.text);
      }
    }
  }

  console.log("\nUsage:");
  console.log(`  Input tokens: ${response.usage.inputTokens}`);
  console.log(`  Output tokens: ${response.usage.outputTokens}`);
  console.log(`  Total tokens: ${response.usage.totalTokens}`);
  console.log(`  Finish reason: ${response.finishReason}\n`);
}

// Example 2: Streaming
async function testStream() {
  console.log("Example 2: Streaming");
  console.log("─────────────────────────────");

  let fullText = "";
  let tokenCount = 0;

  process.stdout.write("Response: ");

  for await (const event of model.stream({
    input: [
      {
        kind: "message",
        role: "user",
        id: "msg-1",
        content: [{ kind: "text", text: "Count from 1 to 5." }],
      },
    ],
    settings: {
      temperature: 0,
      maxTokens: 100,
    },
  })) {
    if (event.kind === "text-delta") {
      process.stdout.write(event.text);
      fullText += event.text;
      tokenCount++;
    } else if (event.kind === "finish") {
      console.log("\n");
      console.log("Usage:");
      console.log(`  Input tokens: ${event.usage.inputTokens}`);
      console.log(`  Output tokens: ${event.usage.outputTokens}`);
      console.log(`  Total tokens: ${event.usage.totalTokens}`);
      console.log(`  Finish reason: ${event.finishReason}\n`);
    }
  }
}

// Example 3: Tool Calling
async function testTools() {
  console.log("Example 3: Tool Calling");
  console.log("─────────────────────────────");

  const response = await model.generate({
    input: [
      {
        kind: "message",
        role: "user",
        id: "msg-1",
        content: [
          { kind: "text", text: "What's the weather like in San Francisco?" },
        ],
      },
    ],
    tools: [
      {
        kind: "function",
        name: "get_weather",
        description: "Get the current weather for a city",
        parameters: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "The city name",
            },
            units: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "Temperature units",
            },
          },
          required: ["city"],
        },
      },
    ],
    settings: {
      temperature: 0.7,
      maxTokens: 200,
    },
  });

  console.log("Response:");
  for (const item of response.content) {
    if (item.kind === "tool-call") {
      console.log(`  Tool called: ${item.toolId}`);
      console.log(`  Call ID: ${item.callId}`);
      console.log(`  Arguments: ${item.arguments}`);
    } else if (item.kind === "message") {
      const firstContent = item.content[0];
      if (firstContent?.kind === "text") {
        console.log(`  [${item.role}]:`, firstContent.text);
      } else {
        console.log(`  [${item.role}]:`, "(no text)");
      }
    }
  }

  console.log("\nUsage:");
  console.log(`  Input tokens: ${response.usage.inputTokens}`);
  console.log(`  Output tokens: ${response.usage.outputTokens}`);
  console.log(`  Total tokens: ${response.usage.totalTokens}\n`);
}

// Example 4: Multi-turn Conversation
async function testConversation() {
  console.log("Example 4: Multi-turn Conversation");
  console.log("─────────────────────────────────────");

  const response = await model.generate({
    input: [
      {
        kind: "message",
        role: "user",
        id: "msg-1",
        content: [{ kind: "text", text: "My name is Alice." }],
      },
      {
        kind: "message",
        role: "assistant",
        id: "msg-2",
        content: [
          {
            kind: "text",
            text: "Nice to meet you, Alice! How can I help you today?",
          },
        ],
      },
      {
        kind: "message",
        role: "user",
        id: "msg-3",
        content: [{ kind: "text", text: "What's my name?" }],
      },
    ],
    settings: {
      temperature: 0.7,
      maxTokens: 100,
    },
  });

  console.log("Response:");
  for (const item of response.content) {
    if (item.kind === "message") {
      const firstContent = item.content[0];
      if (firstContent?.kind === "text") {
        console.log(`  [${item.role}]:`, firstContent.text);
      }
    }
  }
  console.log();
}

main();
