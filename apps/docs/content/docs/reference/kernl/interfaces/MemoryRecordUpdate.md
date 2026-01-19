---
layout: docs
---

# Interface: MemoryRecordUpdate

Defined in: [packages/kernl/src/memory/types.ts:219](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L219)

Update payload for a memory record.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="collection"></a> `collection?` | `string` | [packages/kernl/src/memory/types.ts:222](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L222) |
| <a id="content"></a> `content?` | [`MemoryByte`](MemoryByte.md) | [packages/kernl/src/memory/types.ts:223](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L223) |
| <a id="id"></a> `id` | `string` | [packages/kernl/src/memory/types.ts:220](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L220) |
| <a id="metadata"></a> `metadata?` | [`JSONObject`](../../protocol/type-aliases/JSONObject.md) \| `null` | [packages/kernl/src/memory/types.ts:228](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L228) |
| <a id="scope"></a> `scope?` | [`MemoryScope`](MemoryScope.md) | [packages/kernl/src/memory/types.ts:221](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L221) |
| <a id="smem"></a> `smem?` | \{ `expiresAt`: `number` \| `null`; \} | [packages/kernl/src/memory/types.ts:225](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L225) |
| `smem.expiresAt` | `number` \| `null` | [packages/kernl/src/memory/types.ts:225](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L225) |
| <a id="timestamp"></a> `timestamp?` | `number` | [packages/kernl/src/memory/types.ts:226](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L226) |
| <a id="updatedat"></a> `updatedAt?` | `number` | [packages/kernl/src/memory/types.ts:227](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L227) |
| <a id="wmem"></a> `wmem?` | `boolean` | [packages/kernl/src/memory/types.ts:224](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L224) |
