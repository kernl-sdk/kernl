---
layout: docs
---

# Interface: ThreadListOptions

Defined in: [packages/kernl/src/storage/thread.ts:131](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L131)

Options for listing threads.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="cursor"></a> `cursor?` | `string` | [packages/kernl/src/storage/thread.ts:140](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L140) |
| <a id="filter"></a> `filter?` | [`ThreadFilter`](ThreadFilter.md) | [packages/kernl/src/storage/thread.ts:132](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L132) |
| <a id="include"></a> `include?` | [`ThreadInclude`](ThreadInclude.md) | [packages/kernl/src/storage/thread.ts:133](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L133) |
| <a id="limit"></a> `limit?` | `number` | [packages/kernl/src/storage/thread.ts:138](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L138) |
| <a id="offset"></a> `offset?` | `number` | [packages/kernl/src/storage/thread.ts:139](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L139) |
| <a id="order"></a> `order?` | \{ `createdAt?`: [`SortOrder`](../type-aliases/SortOrder.md); `updatedAt?`: [`SortOrder`](../type-aliases/SortOrder.md); \} | [packages/kernl/src/storage/thread.ts:134](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L134) |
| `order.createdAt?` | [`SortOrder`](../type-aliases/SortOrder.md) | [packages/kernl/src/storage/thread.ts:135](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L135) |
| `order.updatedAt?` | [`SortOrder`](../type-aliases/SortOrder.md) | [packages/kernl/src/storage/thread.ts:136](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L136) |
