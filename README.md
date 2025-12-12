# kernl

kernl is a Typescript framework for building + coordinating AI agents that remember, reason, and act.

## What kernl does for you

- **Agents that remember** - Memory isn't an afterthought.
- **Persistent threads** - State management built in.
- **Provider agnostic** - No lock-in.
- **Type-safe** - TypeScript all the way down.

## Quick start

Install the CLI:

```bash
npm install -g @kernl-sdk/cli
```

Create a new kernl app:

```bash
kernl init my-project
```

## Usage

```ts
import { Agent, Kernl } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";
import { math } from "@/toolkits/math";

const jarvis = new Agent({
  id: "jarvis",
  name: "Jarvis",
  model: anthropic("claude-sonnet-4-5"),
  instructions: "You are a helpful assistant.",
  toolkits: [math],
  memory: { enabled: true },
});

const kernl = new Kernl();
kernl.register(jarvis);

const result = await jarvis.run("Remember: I prefer dark mode.");
console.log(result.response);
```

## Learn more

- [Documentation](https://docs.kernl.sh)
- [Examples](./microprojects/jarvis)
