---
layout: docs
---

# Function: isSimpleQuery()

```ts
function isSimpleQuery(input: QueryInput): input is RankingSignal;
```

Defined in: [retrieval/src/query.ts:199](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L199)

Check if query input is a simple single-field query.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`QueryInput`](../type-aliases/QueryInput.md) |

## Returns

`input is RankingSignal`
