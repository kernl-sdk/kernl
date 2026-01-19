---
layout: docs
---

# Interface: RankingSignal

Defined in: [retrieval/src/query.ts:91](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L91)

A single ranking signal (text or vector query on a field).

## Indexable

```ts
[field: string]: string | number | number[] | undefined
```

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="weight"></a> `weight?` | `number` | Weight for fusion (default 1.0) | [retrieval/src/query.ts:94](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L94) |
