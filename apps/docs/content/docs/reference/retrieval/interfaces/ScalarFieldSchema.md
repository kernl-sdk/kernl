---
layout: docs
---

# Interface: ScalarFieldSchema

Defined in: [retrieval/src/types.ts:108](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L108)

Schema for scalar/complex fields.

## Extends

- `BaseFieldSchema`

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="filterable"></a> `filterable?` | `boolean` | `BaseFieldSchema.filterable` | [retrieval/src/types.ts:99](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L99) |
| <a id="fts"></a> `fts?` | `boolean` \| [`FTSOptions`](FTSOptions.md) | `BaseFieldSchema.fts` | [retrieval/src/types.ts:102](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L102) |
| <a id="optional"></a> `optional?` | `boolean` | `BaseFieldSchema.optional` | [retrieval/src/types.ts:101](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L101) |
| <a id="pk"></a> `pk?` | `boolean` | `BaseFieldSchema.pk` | [retrieval/src/types.ts:98](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L98) |
| <a id="sortable"></a> `sortable?` | `boolean` | `BaseFieldSchema.sortable` | [retrieval/src/types.ts:100](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L100) |
| <a id="type"></a> `type` | \| `ScalarType` \| `ComplexType` \| `"string[]"` \| `"bigint[]"` \| `"boolean[]"` \| `"int[]"` \| `"float[]"` \| `"date[]"` \| `"object[]"` \| `"geopoint[]"` | - | [retrieval/src/types.ts:109](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L109) |
