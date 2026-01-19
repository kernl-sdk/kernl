---
layout: docs
---

# Interface: SearchCapabilities

Defined in: [retrieval/src/types.ts:245](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L245)

Backend capabilities for query planning.

Allows callers to adapt queries based on what the backend supports,
preserving full richness where possible and degrading gracefully.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="filters"></a> `filters?` | `boolean` | Filter support | [retrieval/src/types.ts:255](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L255) |
| <a id="modes"></a> `modes` | `Set`\<[`SearchMode`](../type-aliases/SearchMode.md)\> | Supported query modes | [retrieval/src/types.ts:247](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L247) |
| <a id="multisignal"></a> `multiSignal?` | `boolean` | Multiple ranking signals (fusion) supported? | [retrieval/src/types.ts:249](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L249) |
| <a id="multitext"></a> `multiText?` | `boolean` | Multiple text signals supported? | [retrieval/src/types.ts:253](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L253) |
| <a id="multivector"></a> `multiVector?` | `boolean` | Multiple vector signals supported? | [retrieval/src/types.ts:251](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L251) |
| <a id="orderby"></a> `orderBy?` | `boolean` | OrderBy support | [retrieval/src/types.ts:257](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L257) |
