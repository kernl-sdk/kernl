---
layout: docs
---

# Interface: ListIndexesParams

Defined in: [retrieval/src/types.ts:144](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L144)

Parameters for listing indexes.

## Extends

- `CursorPageParams`

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="cursor"></a> `cursor?` | `string` | Pagination cursor returned from a previous page. If omitted, starts from the beginning of the collection. | `CursorPageParams.cursor` | shared/dist/pagination/cursor.d.ts:10 |
| <a id="limit"></a> `limit?` | `number` | Maximum number of items to return in a single page. | `CursorPageParams.limit` | shared/dist/pagination/base.d.ts:8 |
| <a id="prefix"></a> `prefix?` | `string` | - | - | [retrieval/src/types.ts:145](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L145) |
