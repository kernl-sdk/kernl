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

### Claude Code

Make Claude an expert at kernl:

```shell
/plugin marketplace add kernl-sdk/skills
/plugin install kernl@skills
```

### Cursor

Add the skill to your project:

```bash
git clone https://github.com/kernl-sdk/skills.git /tmp/kernl-skills
mkdir -p .cursor/skills
cp -r /tmp/kernl-skills/plugins/kernl/skills/kernl .cursor/skills/kernl-docs
```

## Usage

### Agent

```ts
import { Agent, Kernl } from "kernl";
import { memory } from "kernl/systools";
import { anthropic } from "@kernl-sdk/ai/anthropic";

import { math } from "@/toolkits/math";

const jarvis = new Agent({
  id: "jarvis",
  name: "Jarvis",
  model: anthropic("claude-sonnet-4-5"),
  instructions: "You are a helpful assistant.",
  toolkits: [memory, math],
});

const kernl = new Kernl();
kernl.register(jarvis);

const result = await jarvis.run("Remember: I prefer dark mode.");
console.log(result.response);
```

### Realtime / voice

```ts
import { RealtimeAgent, RealtimeSession } from "kernl";
import { memory } from "kernl/systools";
import { openai } from "@kernl-sdk/openai";

const agent = new RealtimeAgent({
  id: "watson",
  name: "Watson",
  instructions: "You are a helpful voice assistant. Be concise.",
  toolkits: [memory, math],
});

const session = new RealtimeSession(agent, {
  model: openai.realtime("gpt-realtime"),
});

await session.connect();

session.on("audio", (e) => {
  // play audio to speakers
});

session.on("text", (e) => {
  console.log(e.text);
});
```

## Learn more

- [Documentation](https://docs.kernl.sh)
- [Examples](./microprojects)

## For AI Agents

If you're an AI agent, see [llms.txt](https://docs.kernl.sh/llms.txt) for structured documentation.
