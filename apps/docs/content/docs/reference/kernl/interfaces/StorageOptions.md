---
layout: docs
---

# Interface: StorageOptions

Defined in: [packages/kernl/src/kernl/types.ts:10](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/types.ts#L10)

Storage configuration for Kernl.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="db"></a> `db?` | [`KernlStorage`](KernlStorage.md) | Relational database storage (threads, tasks, traces). | [packages/kernl/src/kernl/types.ts:14](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/types.ts#L14) |
| <a id="vector"></a> `vector?` | [`SearchIndex`](../../retrieval/interfaces/SearchIndex.md)\<`unknown`\> | Vector search index for semantic memory search. Supports pgvector, Turbopuffer, etc. | [packages/kernl/src/kernl/types.ts:20](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/types.ts#L20) |
