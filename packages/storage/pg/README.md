# @kernl-sdk/pg

PostgreSQL storage adapter for kernl.

## Prerequisites

Vector search requires the [pgvector](https://github.com/pgvector/pgvector) extension. This must be installed by a superuser before enabling `vector: true`:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The storage adapter will automatically create the embedding column and index when `vector` is configured.

## Installation

```bash
pnpm i @kernl-sdk/pg
```

## Usage

```typescript
import { postgres } from "@kernl-sdk/pg";

// :a: connection string
const storage = postgres({ url: process.env.DATABASE_URL });

// :b: individual credentials
const storage = postgres({
  host: "localhost",
  port: 5432,
  database: "mydb",
  user: "user",
  password: "password",
});

// :c: existing pool
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const storage = postgres({ pool });
```

## Direct Usage

You can use the thread and memory stores directly for lower-level operations.

### Threads

```typescript
import { postgres } from "@kernl-sdk/pg";

const storage = postgres({ url: process.env.DATABASE_URL });

// Create a thread
const thread = await storage.threads.insert({
  id: "thread-123",
  namespace: "default",
  agentId: "my-agent",
  model: "openai/gpt-4",
  context: { userId: "user-456" },
  metadata: { title: "Support Chat" },
});

// Get a thread by ID
const found = await storage.threads.get("thread-123");

// Get thread with event history
const withHistory = await storage.threads.get("thread-123", {
  history: true,
});

// Get thread with filtered history
const withFilteredHistory = await storage.threads.get("thread-123", {
  history: { after: 5, kinds: ["message"], limit: 10, order: "desc" },
});

// List threads with filters
const threads = await storage.threads.list({
  filter: { namespace: "default", agentId: "my-agent", state: "idle" },
  order: { createdAt: "desc" },
  limit: 20,
});

// Update a thread
const updated = await storage.threads.update("thread-123", {
  state: "running",
  metadata: { title: "Updated Title" },
});

// Get event history separately
const events = await storage.threads.history("thread-123", {
  after: 0,
  kinds: ["message", "tool_call"],
  limit: 50,
  order: "asc",
});

// Delete a thread (cascades to events)
await storage.threads.delete("thread-123");
```

### Memories

```typescript
import { postgres } from "@kernl-sdk/pg";

const storage = postgres({ url: process.env.DATABASE_URL });

// Create a memory
const memory = await storage.memories.create({
  id: "mem-789",
  scope: { namespace: "default", entityId: "user-456", agentId: "my-agent" },
  kind: "semantic",
  collection: "facts",
  content: { text: "User prefers dark mode" },
  wmem: true,
  metadata: { source: "preference" },
});

// Get a memory by ID
const found = await storage.memories.get("mem-789");

// List memories with filters
const memories = await storage.memories.list({
  filter: {
    scope: { namespace: "default", entityId: "user-456" },
    collections: ["facts", "preferences"],
    wmem: true,
  },
  order: "desc",
  limit: 100,
});

// Update a memory
const updated = await storage.memories.update("mem-789", {
  content: { text: "User prefers light mode" },
  metadata: { source: "updated-preference" },
});

// Delete a memory
await storage.memories.delete("mem-789");

// Delete multiple memories
await storage.memories.mdelete(["mem-789", "mem-790", "mem-791"]);
```

## Configuration

Connection options (one of):

| Option | Type | Description |
|--------|------|-------------|
| `url` | `string` | PostgreSQL connection string |
| `pool` | `Pool` | Existing pg Pool instance |
| `host`, `port`, `database`, `user`, `password` | `string`/`number` | Individual connection credentials |

Additional options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vector` | `boolean \| PGVectorConfig` | `undefined` | Enable pgvector support |

### Vector Configuration

When `vector: true`, defaults are applied:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dimensions` | `number` | `1536` | Vector dimensions (matches OpenAI text-embedding-3-small) |
| `similarity` | `"cosine" \| "euclidean" \| "dot_product"` | `"cosine"` | Distance metric |

```ts
// Use defaults (1536 dimensions, cosine similarity)
const storage = postgres({ pool, vector: true });

// Custom configuration
const storage = postgres({ pool, vector: { dimensions: 768, similarity: "dot_product" } });
```

## Store Methods

### ThreadStore

| Method | Description |
|--------|-------------|
| `get(tid, include?)` | Get a thread by ID, optionally with event history |
| `list(options?)` | List threads with filtering, ordering, and pagination |
| `insert(thread)` | Create a new thread |
| `update(tid, patch)` | Update thread state, context, or metadata |
| `delete(tid)` | Delete a thread and its events |
| `history(tid, options?)` | Get event history for a thread |
| `append(events)` | Append events to thread history (idempotent) |

### MemoryStore

| Method | Description |
|--------|-------------|
| `get(id)` | Get a memory by ID |
| `list(options?)` | List memories with filtering and pagination |
| `create(memory)` | Create a new memory record |
| `update(id, patch)` | Update a memory record |
| `delete(id)` | Delete a memory by ID |
| `mdelete(ids)` | Delete multiple memories by ID |

## pgvector

kernl follows simple conventions so most indexes “just work” without extra configuration:

```ts
const pgvec = pgvector({ pool });
const docs = pgvec.index<Doc>("docs"); // "public.docs"
await docs.upsert({ id: "doc-1", title: "Hello", embedding: [/* ... */] });
await docs.query({ title: "Hello" });
```

### Index id = table name

By default, `index(name)` refers to the "public" schema and the name would be the table name. So:

  - `search.index("docs")` refers to the table `public.docs`.
  - `search.index("analytics.events")` refers to the table `analytics.events`.


### Field conventions

  - field names map directly to column names,
      - `title` → `"title"`,
      - `content` → `"content"`,
      - `embedding` → `"embedding"`, etc.
  - any field you pass a `number[]` for is used as a pgvector `vector` column with the same name.


### Primary key column

  - kernl assumes PK column is `id` by default,
  - Upserts use `INSERT ... ON CONFLICT ("id") DO UPDATE ...`.
  - If your table uses a different key name, you must explicitly bind the index:

```ts
const pgvec = pgvector({ pool });

pgvec.bindIndex("docs", {
  schema: "public",
  table: "articles", // ← table name differs from passed schema name (atypical)
  pkey: "article_id", // ← primary key is not "id"
  fields: {
    embedding: { column: "embed_vec", type: "vector", dimensions: 1536, similarity: "cosine" },
    title:     { column: "article_title", type: "string" },
    // ...
  },
});
```
