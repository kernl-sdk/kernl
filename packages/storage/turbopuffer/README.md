# @kernl-sdk/turbopuffer

[Turbopuffer](https://turbopuffer.com) search index adapter for Kernl.

## Installation

```bash
pnpm i @kernl-sdk/turbopuffer
```

## Quick Start

```ts
import { turbopuffer } from "@kernl-sdk/turbopuffer";

const tpuf = turbopuffer({
  apiKey: process.env.TURBOPUFFER_API_KEY!,
  region: "api", // or "us-east-1", "eu-west-1"
});

// create an index
await tpuf.createIndex({
  id: "my-docs",
  schema: {
    content: { type: "string", fts: true },
    vector: { type: "vector", dimensions: 384 },
    category: { type: "string", filterable: true },
  },
});

// get a handle to the document index
const docs = tpuf.index("my-docs");

// upsert documents
await docs.upsert({
  id: "doc-1",
  fields: {
    content: "Hello world",
    vector: { kind: "vector", values: [0.1, 0.2, ...] },
    category: "greeting",
  },
});

// query with vector search
const hits = await docs.query({
  query: [{ vector: [0.1, 0.2, ...] }],
  topK: 10,
  filter: { category: "greeting" },
  include: ["content", "category"], // fields to include in the response
});
```

## Configuration

| Option   | Type     | Description                     |
| -------- | -------- | ------------------------------- |
| `apiKey` | `string` | Turbopuffer API key (required)  |
| `region` | `string` | Turbopuffer region (required)   |

Available regions: `api` (default), `us-east-1`, `eu-west-1`
