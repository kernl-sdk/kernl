---
layout: docs
---

# Interface: SearchQuery

Defined in: [retrieval/src/query.ts:108](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L108)

Full search query options.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="filter"></a> `filter?` | [`Filter`](Filter.md) | MongoDB-style filter | [retrieval/src/query.ts:114](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L114) |
| <a id="include"></a> `include?` | `boolean` \| `string`[] | Fields to include in response | [retrieval/src/query.ts:124](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L124) |
| <a id="limit"></a> `limit?` | `number` | Number of results to return | [retrieval/src/query.ts:118](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L118) |
| <a id="max"></a> `max?` | [`RankingSignal`](RankingSignal.md)[] | Max fusion queries | [retrieval/src/query.ts:112](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L112) |
| <a id="minscore"></a> `minScore?` | `number` | Minimum score threshold | [retrieval/src/query.ts:122](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L122) |
| <a id="offset"></a> `offset?` | `number` | Offset for pagination | [retrieval/src/query.ts:120](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L120) |
| <a id="orderby"></a> `orderBy?` | [`OrderBy`](OrderBy.md) | Sort order (for non-ranked queries) | [retrieval/src/query.ts:116](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L116) |
| <a id="query"></a> `query?` | [`RankingSignal`](RankingSignal.md)[] | Sum/RRF fusion queries (default when using array shorthand) | [retrieval/src/query.ts:110](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L110) |
