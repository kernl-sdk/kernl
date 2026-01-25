# @kernl-sdk/libsql

LibSQL/SQLite storage adapter for Kernl. Supports local SQLite files, in-memory databases, and remote [Turso](https://turso.tech) databases.

## Installation

```bash
pnpm add @kernl-sdk/libsql
```

## Usage

### Local SQLite File

```typescript
import { Kernl } from "kernl";
import { libsql } from "@kernl-sdk/libsql";

const kernl = new Kernl({
  storage: libsql({ url: "file:./kernl.db" }),
});
```

### In-Memory (Testing)

```typescript
import { libsql } from "@kernl-sdk/libsql";

const storage = libsql({ url: ":memory:" });
```

### Remote Turso

```typescript
import { libsql } from "@kernl-sdk/libsql";

const storage = libsql({
  url: "libsql://your-database.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

### Using an Existing Client

```typescript
import { createClient } from "@libsql/client";
import { libsql } from "@kernl-sdk/libsql";

const client = createClient({ url: "file:./kernl.db" });
const storage = libsql({ client });
```

## Direct Usage

You can use the thread and memory stores directly for lower-level operations.

### Threads

```typescript
import { libsql } from "@kernl-sdk/libsql";

const storage = libsql({ url: "file:./kernl.db" });

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
import { libsql } from "@kernl-sdk/libsql";

const storage = libsql({ url: "file:./kernl.db" });

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

## API

### `libsql(config)`

Creates a LibSQL storage adapter.

**Config options:**

| Option | Type | Description |
|--------|------|-------------|
| `url` | `string` | Database URL. Supports `file:`, `:memory:`, or `libsql://` |
| `authToken` | `string` | Auth token for Turso (optional for local) |
| `client` | `Client` | Existing `@libsql/client` instance |

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

## Differences from PostgreSQL

This adapter provides feature parity with `@kernl-sdk/pg` with the following SQLite-specific adaptations:

- **JSON storage**: Uses `TEXT` columns instead of `JSONB`
- **Booleans**: Stored as `INTEGER` (0/1)
- **Arrays**: `IN (?, ?, ?)` instead of PostgreSQL's `= ANY($1)`
- **Schema**: Table names prefixed with `kernl_` (SQLite has no schema support)

## SQLite Configuration

For local file databases (`file:` URLs), the adapter automatically sets:

- `PRAGMA journal_mode = WAL` - Write-Ahead Logging for better concurrent read/write performance
- `PRAGMA busy_timeout = 5000` - Wait up to 5 seconds when the database is locked

These are not set for remote Turso databases, which manage these settings automatically.

## Tables

The adapter creates the following tables:

- `kernl_migrations` - Migration tracking
- `kernl_threads` - Thread records
- `kernl_thread_events` - Thread event history
- `kernl_memories` - Memory records

## License

MIT
