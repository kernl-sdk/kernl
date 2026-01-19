---
layout: docs
---

# Interface: ThreadHistoryParams

Defined in: [packages/kernl/src/api/resources/threads/types.ts:5](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L5)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="after"></a> `after?` | `number` | Only return events with seq greater than this value. | [packages/kernl/src/api/resources/threads/types.ts:9](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L9) |
| <a id="kinds"></a> `kinds?` | `string`[] | Restrict history to specific event kinds, e.g. `["message", "tool-result"]`. | [packages/kernl/src/api/resources/threads/types.ts:26](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L26) |
| <a id="limit"></a> `limit?` | `number` | Maximum number of events to return. | [packages/kernl/src/api/resources/threads/types.ts:14](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L14) |
| <a id="order"></a> `order?` | `"asc"` \| `"desc"` | Sort order by sequence number. Defaults to `"desc"` so callers see the latest events first. | [packages/kernl/src/api/resources/threads/types.ts:21](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L21) |
