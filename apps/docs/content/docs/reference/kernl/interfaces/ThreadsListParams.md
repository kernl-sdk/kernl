---
layout: docs
---

# Interface: ThreadsListParams

Defined in: [packages/kernl/src/api/resources/threads/types.ts:29](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L29)

## Extends

- `CursorPageParams`

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="after"></a> `after?` | `Date` | Only include threads created after this timestamp. | - | [packages/kernl/src/api/resources/threads/types.ts:38](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L38) |
| <a id="agentid"></a> `agentId?` | `string` | - | - | [packages/kernl/src/api/resources/threads/types.ts:31](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L31) |
| <a id="before"></a> `before?` | `Date` | Only include threads created before this timestamp. | - | [packages/kernl/src/api/resources/threads/types.ts:43](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L43) |
| <a id="cursor"></a> `cursor?` | `string` | Pagination cursor returned from a previous page. If omitted, starts from the beginning of the collection. | `CursorPageParams.cursor` | packages/shared/dist/pagination/cursor.d.ts:10 |
| <a id="limit"></a> `limit?` | `number` | Maximum number of items to return in a single page. | `CursorPageParams.limit` | packages/shared/dist/pagination/base.d.ts:8 |
| <a id="namespace"></a> `namespace?` | `string` | - | - | [packages/kernl/src/api/resources/threads/types.ts:30](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L30) |
| <a id="order"></a> `order?` | \{ `createdAt?`: [`SortOrder`](../type-aliases/SortOrder.md); `updatedAt?`: [`SortOrder`](../type-aliases/SortOrder.md); \} | - | - | [packages/kernl/src/api/resources/threads/types.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L45) |
| `order.createdAt?` | [`SortOrder`](../type-aliases/SortOrder.md) | - | - | [packages/kernl/src/api/resources/threads/types.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L46) |
| `order.updatedAt?` | [`SortOrder`](../type-aliases/SortOrder.md) | - | - | [packages/kernl/src/api/resources/threads/types.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L47) |
| <a id="parenttaskid"></a> `parentTaskId?` | `string` | - | - | [packages/kernl/src/api/resources/threads/types.ts:33](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L33) |
| <a id="state"></a> `state?` | \| [`ThreadState`](../type-aliases/ThreadState.md) \| [`ThreadState`](../type-aliases/ThreadState.md)[] | - | - | [packages/kernl/src/api/resources/threads/types.ts:32](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L32) |
