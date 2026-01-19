---
layout: docs
---

# Function: normalizeQuery()

```ts
function normalizeQuery(input: QueryInput): SearchQuery;
```

Defined in: [retrieval/src/query.ts:171](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L171)

Normalize query input to full QueryOptions.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`QueryInput`](../type-aliases/QueryInput.md) |

## Returns

[`SearchQuery`](../interfaces/SearchQuery.md)

## Throws

Error if explicit empty ranking signals are provided
