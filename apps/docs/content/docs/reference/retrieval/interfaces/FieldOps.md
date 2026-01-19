---
layout: docs
---

# Interface: FieldOps

Defined in: [retrieval/src/query.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L19)

Field-level operators for filtering.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="contains"></a> `$contains?` | `string` | String contains | [retrieval/src/query.ts:38](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L38) |
| <a id="endswith"></a> `$endsWith?` | `string` | String ends with | [retrieval/src/query.ts:42](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L42) |
| <a id="eq"></a> `$eq?` | [`ScalarValue`](../type-aliases/ScalarValue.md) | Equal | [retrieval/src/query.ts:21](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L21) |
| <a id="exists"></a> `$exists?` | `boolean` | Field exists | [retrieval/src/query.ts:44](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L44) |
| <a id="gt"></a> `$gt?` | [`ScalarValue`](../type-aliases/ScalarValue.md) | Greater than | [retrieval/src/query.ts:25](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L25) |
| <a id="gte"></a> `$gte?` | [`ScalarValue`](../type-aliases/ScalarValue.md) | Greater than or equal | [retrieval/src/query.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L27) |
| <a id="in"></a> `$in?` | [`ScalarValue`](../type-aliases/ScalarValue.md)[] | In set | [retrieval/src/query.ts:33](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L33) |
| <a id="lt"></a> `$lt?` | [`ScalarValue`](../type-aliases/ScalarValue.md) | Less than | [retrieval/src/query.ts:29](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L29) |
| <a id="lte"></a> `$lte?` | [`ScalarValue`](../type-aliases/ScalarValue.md) | Less than or equal | [retrieval/src/query.ts:31](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L31) |
| <a id="neq"></a> `$neq?` | [`ScalarValue`](../type-aliases/ScalarValue.md) | Not equal | [retrieval/src/query.ts:23](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L23) |
| <a id="nin"></a> `$nin?` | [`ScalarValue`](../type-aliases/ScalarValue.md)[] | Not in set | [retrieval/src/query.ts:35](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L35) |
| <a id="startswith"></a> `$startsWith?` | `string` | String starts with | [retrieval/src/query.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L40) |
