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
const storage = postgres({ connstr: process.env.DATABASE_URL });

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

## Configuration

Connection options (one of):

| Option | Type | Description |
|--------|------|-------------|
| `connstr` | `string` | PostgreSQL connection string |
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
