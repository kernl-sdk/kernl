# kernl :: pgvector

## Index conventions

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
