# Language Model Example

Temporary example demonstrating `@kernl-sdk/ai` package with AI SDK models.

This example will be replaced with a full agent example once the `kernl` package is refactored.

## What it tests

- ✅ Basic text generation
- ✅ Streaming responses
- ✅ Tool calling
- ✅ Multi-turn conversations

## Prerequisites

You need an Anthropic API key to run this example.

## Running the example

From this directory:

```bash
ANTHROPIC_API_KEY=your-key pnpm start
```

Or from the repo root:

```bash
ANTHROPIC_API_KEY=your-key pnpm --filter example-language-model-tmp start
```

## What you'll see

The example runs 4 tests:
1. Basic generation (simple Q&A)
2. Streaming (watch tokens stream in real-time)
3. Tool calling (model decides to use a tool)
4. Multi-turn conversation (model remembers context)

Each test prints the response and usage statistics.
