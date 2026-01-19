---
layout: docs
---

# Interface: IndexStats

Defined in: [retrieval/src/types.ts:175](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L175)

Statistics about an index.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="count"></a> `count` | `number` | [retrieval/src/types.ts:177](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L177) |
| <a id="dimensions"></a> `dimensions?` | `number` | [retrieval/src/types.ts:179](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L179) |
| <a id="id"></a> `id` | `string` | [retrieval/src/types.ts:176](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L176) |
| <a id="schema"></a> `schema?` | `Record`\<`string`, [`FieldSchema`](../type-aliases/FieldSchema.md)\> | [retrieval/src/types.ts:181](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L181) |
| <a id="similarity"></a> `similarity?` | `string` | [retrieval/src/types.ts:180](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L180) |
| <a id="sizeb"></a> `sizeb?` | `number` | [retrieval/src/types.ts:178](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L178) |
| <a id="status"></a> `status?` | `"ready"` \| `"initializing"` \| `"error"` | [retrieval/src/types.ts:182](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L182) |
