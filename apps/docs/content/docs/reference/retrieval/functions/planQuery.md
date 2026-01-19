---
layout: docs
---

# Function: planQuery()

```ts
function planQuery(input: QueryInput, caps: SearchCapabilities): PlannedQuery;
```

Defined in: [retrieval/src/query.ts:247](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L247)

Plan a query against backend capabilities.

Preserves full richness where possible, degrades gracefully otherwise.
- Hybrid not supported → drop text, keep vector
- Multi-signal not supported → keep first signal only

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`QueryInput`](../type-aliases/QueryInput.md) |
| `caps` | [`SearchCapabilities`](../interfaces/SearchCapabilities.md) |

## Returns

[`PlannedQuery`](../interfaces/PlannedQuery.md)
