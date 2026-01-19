---
layout: docs
---

# Interface: VectorFieldSchema

Defined in: [retrieval/src/types.ts:115](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L115)

Schema for vector fields.

## Extends

- `BaseFieldSchema`

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="dimensions"></a> `dimensions` | `number` | - | [retrieval/src/types.ts:117](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L117) |
| <a id="filterable"></a> `filterable?` | `boolean` | `BaseFieldSchema.filterable` | [retrieval/src/types.ts:99](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L99) |
| <a id="fts"></a> `fts?` | `boolean` \| [`FTSOptions`](FTSOptions.md) | `BaseFieldSchema.fts` | [retrieval/src/types.ts:102](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L102) |
| <a id="optional"></a> `optional?` | `boolean` | `BaseFieldSchema.optional` | [retrieval/src/types.ts:101](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L101) |
| <a id="pk"></a> `pk?` | `boolean` | `BaseFieldSchema.pk` | [retrieval/src/types.ts:98](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L98) |
| <a id="quantization"></a> `quantization?` | `"f32"` \| `"f16"` \| `"int8"` \| `"binary"` | - | [retrieval/src/types.ts:119](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L119) |
| <a id="similarity"></a> `similarity?` | `"cosine"` \| `"euclidean"` \| `"dot_product"` | - | [retrieval/src/types.ts:118](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L118) |
| <a id="sortable"></a> `sortable?` | `boolean` | `BaseFieldSchema.sortable` | [retrieval/src/types.ts:100](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L100) |
| <a id="type"></a> `type` | `VectorType` | - | [retrieval/src/types.ts:116](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L116) |
