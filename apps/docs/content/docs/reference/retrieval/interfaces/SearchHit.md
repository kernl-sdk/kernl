---
layout: docs
---

# Interface: SearchHit\<TDocument\>

Defined in: [retrieval/src/types.ts:217](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L217)

A search result hit.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDocument` | [`UnknownDocument`](../type-aliases/UnknownDocument.md) |

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="document"></a> `document?` | `Partial`\<`TDocument`\> | Projected document fields (can be partial due to `include`/`exclude`) | [retrieval/src/types.ts:227](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L227) |
| <a id="id"></a> `id` | `string` | Document identifier | [retrieval/src/types.ts:219](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L219) |
| <a id="index"></a> `index` | `string` | Index the document belongs to | [retrieval/src/types.ts:221](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L221) |
| <a id="namespace"></a> `namespace?` | `string` | Optional namespace within the index | [retrieval/src/types.ts:223](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L223) |
| <a id="score"></a> `score` | `number` | Relevance score for the hit | [retrieval/src/types.ts:225](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L225) |
