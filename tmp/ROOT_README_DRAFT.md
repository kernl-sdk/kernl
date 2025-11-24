# kernl

An agent runtime for building, coordinating, and observing AI agents.

## What kernl does for you

- **Build agents quickly**: Define agents with clear responsibilities and tools.
- **Coordinate work**: Use threads to manage multi-step conversations and workflows.
- **Observe behavior**: Capture state, events, and history so you can debug and improve agents.
- **Plug into your stack**: Bring your own models, tools, and storage.

## Quick start

Install the CLI:

```bash
npm install -g @kernl-sdk/cli
# or
pnpm i -g @kernl-sdk/cli
```

Create a new kernl app:

```bash
kernl init my-project
```

## Usage

```ts
import { Agent, Kernl } from "kernl";

const jarvis = new Agent({
  id: "jarvis",
  name: "Jarvis",
  description: "Helps answer questions and call tools.",
});

const kernl = new Kernl();
kernl.register(jarvis);

const result = await jarvis.run("Please enumerate the alphabet in reverse order");

console.log(result.response);
```

## Learn more

- **Core docs and API details**: see `packages/kernl/README.md`.
- **Example apps built on kernl**: start with `microprojects/jarvis`.
