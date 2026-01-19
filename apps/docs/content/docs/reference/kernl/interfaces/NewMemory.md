---
layout: docs
---

# Interface: NewMemory

Defined in: [packages/kernl/src/memory/types.ts:133](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L133)

Input for creating a new memory.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="collection"></a> `collection?` | `string` | [packages/kernl/src/memory/types.ts:137](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L137) |
| <a id="content"></a> `content` | [`MemoryByte`](MemoryByte.md) | [packages/kernl/src/memory/types.ts:138](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L138) |
| <a id="id"></a> `id` | `string` | [packages/kernl/src/memory/types.ts:134](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L134) |
| <a id="kind"></a> `kind` | [`MemoryKind`](../type-aliases/MemoryKind.md) | [packages/kernl/src/memory/types.ts:136](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L136) |
| <a id="metadata"></a> `metadata?` | [`JSONObject`](../../protocol/type-aliases/JSONObject.md) \| `null` | [packages/kernl/src/memory/types.ts:142](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L142) |
| <a id="scope"></a> `scope` | [`MemoryScope`](MemoryScope.md) | [packages/kernl/src/memory/types.ts:135](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L135) |
| <a id="smem"></a> `smem?` | \{ `expiresAt`: `number` \| `null`; \} | [packages/kernl/src/memory/types.ts:140](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L140) |
| `smem.expiresAt` | `number` \| `null` | [packages/kernl/src/memory/types.ts:140](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L140) |
| <a id="timestamp"></a> `timestamp?` | `number` | [packages/kernl/src/memory/types.ts:141](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L141) |
| <a id="wmem"></a> `wmem?` | `boolean` | [packages/kernl/src/memory/types.ts:139](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L139) |
