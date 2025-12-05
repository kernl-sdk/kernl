# Memory :: Overview

## Hierarchy

kernl distinguishes between a couple of layers in the memory hierarchy:

- L1 :: Working memory - Active manipulation of information during thread execution.
- L2 :: Short-term memory - Temporally bounded storage of small amounts of information.
- L3 :: Long-term memory - Explicit + implicit memory: episodic, semantic, procedural (skills), archival.


```
           /\
          /  \     L1 :: Working memory
         /____\
        /      \     L2 :: Short-term memory
       /________\
      /          \     L3 :: Long-term memory
     /____________\
```

## Getting started

There are two primary modes of interacting with memory in kernl:

- **:a:** - Manual: you call `agent.memories.*` yourself with explicit control.
- **:b:** - Agent systools: the agent calls memory [system tools](../systools) during its run.

### :a: Manual "intervention"

No therapy here, but maybe just some forced rewriting of an agent's memory for bad behavior - whatever suits you:

```ts
import { Agent } from "kernl";

const jarvis = new Agent({
  id: "jarvis",
  name: "Jarvis",
  instructions: "Assist Tony Stark in saving the world from destruction.",
  memory: { enabled: true }, // make sure that the agent has memory enabled
});

// implant a new memory in jarvis
const mem = await jarvis.memories.create({
  collection: "preferences",
  content: {
    text: "Tony prefers his coffee extra strong, two shots of espresso, no sugar after late-night Avengers debriefs.",
  },
});

// list jarvis's memories
const prefs = await jarvis.memories.list({
  collection: "preferences",
  limit: 10,
});

// "forced rewrite" of a specific memory
await jarvis.memories.update({
  id: mem.id,
  content: {
    text: "Tony now prefers one shot of espresso with oat milk. Pepper requested reduced caffeine before 10am. He's really gone valley girl..",
  },
});
```

### :b: Agent systools

The agent determines how + when it wants to make changes to its own memory. Prompting is useful here for modulating its behavior.

For those of you who - like me - are too curious for your own good, here are the concrete tools the agent has:

  - `list_memories`
  - `create_memory`
  - `update_memory`
  - `search_memories`

```ts
await jarvis.run(
  "JARVIS, from now on I want my coffee extra strong, two shots of espresso, no sugar.",
);

/*
Jarvis would then call `create_memory`:

{
  tool: "create_memory",
  arguments: {
    content: "Tony prefers his coffee extra strong, two shots of espresso, no sugar.",
    collection: "preferences",
  }
}
*/

const res = await jarvis.run("Remind me how I like my coffee, JARVIS.");

/*
During this follow-up, Jarvis might call `search_memories` like this:

{
  tool: "search_memories",
  arguments: {
    query: "Tony's coffee preference",
    limit: 5
  }
}

// tool result would be something like:
[
  { id: "mem_abc123", text: "Tony prefers his coffee extra strong, two shots of espresso, no sugar.", score: 0.97 }
]

...and then JARVIS uses that to answer the question.
*/
```

## Configuration

kernl infers the memory storage layers to use based on the global storage config you create when instantiating a new Kernl:

```ts
import { Kernl } from "kernl";
import { postgres } from "@kernl-sdk/pg";
import { turbopuffer } from "@kernl-sdk/turbopuffer";

const tpuf = turbopuffer({
  apiKey: TURBOPUFFER_API_KEY,
  region: TURBOPUFFER_REGION,
})

const kernl = new Kernl({
  storage: {
    db: postgres({ connstr: process.env.DATABASE_URL }),
    vector: tpuf // kernl knows to use this as the search index for the memory system
  },
});
```

Only `db` storage is strictly necessary in all cases. The `vector` store acts as an index projection of the primary DB.
