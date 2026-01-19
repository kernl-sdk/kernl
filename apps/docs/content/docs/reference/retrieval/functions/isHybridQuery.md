---
layout: docs
---

# Function: isHybridQuery()

```ts
function isHybridQuery(input: QueryInput): input is RankingSignal[];
```

Defined in: [retrieval/src/query.ts:206](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L206)

Check if query input is an array (hybrid sum fusion).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`QueryInput`](../type-aliases/QueryInput.md) |

## Returns

`input is RankingSignal[]`
