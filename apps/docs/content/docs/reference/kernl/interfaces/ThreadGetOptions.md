---
layout: docs
---

# Interface: ThreadGetOptions

Defined in: [packages/kernl/src/api/resources/threads/types.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L51)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="history"></a> `history?` | `true` \| [`ThreadHistoryParams`](ThreadHistoryParams.md) | Include the thread's event history on the returned model. - `true` will fetch history with default options (latest-first). - An object lets you override history options (limit, kinds, order, etc.). This is equivalent to calling `kernl.threads.history(tid, opts)` and attaching the result to `thread.history`. | [packages/kernl/src/api/resources/threads/types.ts:61](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L61) |
