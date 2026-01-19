---
layout: docs
---

# Interface: PlannedQuery

Defined in: [retrieval/src/query.ts:231](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L231)

Result of planning a query against backend capabilities.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="degraded"></a> `degraded` | `boolean` | Whether the query was degraded from the original | [retrieval/src/query.ts:235](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L235) |
| <a id="input"></a> `input` | [`SearchQuery`](SearchQuery.md) | Adapted query input | [retrieval/src/query.ts:233](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L233) |
| <a id="warnings"></a> `warnings?` | `string`[] | Warnings about adaptations made | [retrieval/src/query.ts:237](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L237) |
