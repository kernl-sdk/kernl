---
layout: docs
---

# Type Alias: QueryInput

```ts
type QueryInput = 
  | RankingSignal
  | RankingSignal[]
  | SearchQuery;
```

Defined in: [retrieval/src/query.ts:160](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L160)

Query input - flexible format supporting multiple patterns.

## Example

```ts
// simple single-field query
{ content: "quick fox" }
{ embedding: [0.1, 0.2, ...] }

// hybrid sum fusion (array shorthand)
[
  { content: "quick fox", weight: 0.7 },
  { embedding: [...], weight: 0.3 },
]

// full query with max fusion and filter
{
  max: [
    { content: "quick fox", weight: 0.7 },
    { embedding: [...], weight: 0.3 },
  ],
  filter: { published: true, views: { $gt: 1000 } },
  limit: 20,
}

// filter-only query
{
  filter: { status: "active" },
  orderBy: { field: "createdAt", direction: "desc" },
  limit: 100,
}
```
