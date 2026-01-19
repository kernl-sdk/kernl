---
layout: docs
---

# Interface: Thread

Defined in: [packages/kernl/src/api/models/thread.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L27)

Thread model returned by Kernl APIs.

This represents the persisted state of a thread – what you get back from
`kernl.threads.get()` / `kernl.threads.list()`.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId` | `string` | ID of the agent that owns this thread. | [packages/kernl/src/api/models/thread.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L51) |
| <a id="context"></a> `context` | `Record`\<`string`, `unknown`\> | User-defined context object that was attached to this thread. This is the raw JSON-serializable context, not a `Context` instance. | [packages/kernl/src/api/models/thread.ts:63](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L63) |
| <a id="createdat"></a> `createdAt` | `Date` | When the thread record was first created. | [packages/kernl/src/api/models/thread.ts:78](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L78) |
| <a id="history"></a> `history?` | [`ThreadEvent`](../type-aliases/ThreadEvent.md)[] | Event history for this thread, when requested via options. Only present when you call APIs like `kernl.threads.get(id, { history: true })` or `kernl.threads.get(id, { history: { ... } })`. For list endpoints, history is omitted to keep responses lightweight. | [packages/kernl/src/api/models/thread.ts:92](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L92) |
| <a id="model"></a> `model` | `MThreadModelInfo` | Language model used for this thread. | [packages/kernl/src/api/models/thread.ts:56](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L56) |
| <a id="namespace"></a> `namespace` | `string` | Logical namespace this thread belongs to, e.g. `"kernl"` or `"org-a"`. Namespaces let you partition threads by tenant, environment, or product. | [packages/kernl/src/api/models/thread.ts:41](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L41) |
| <a id="parenttaskid"></a> `parentTaskId` | `string` \| `null` | Optional parent task ID that spawned this thread, if any. | [packages/kernl/src/api/models/thread.ts:68](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L68) |
| <a id="state"></a> `state` | [`ThreadState`](../type-aliases/ThreadState.md) | Current lifecycle state of the thread (running, stopped, etc.). | [packages/kernl/src/api/models/thread.ts:73](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L73) |
| <a id="tid"></a> `tid` | `string` | Globally-unique thread identifier. You can pass this back into agents (via `threadId`) to resume execution or into storage APIs to fetch history. | [packages/kernl/src/api/models/thread.ts:34](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L34) |
| <a id="title"></a> `title?` | `string` \| `null` | Optional human-readable title for the thread. | [packages/kernl/src/api/models/thread.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L46) |
| <a id="updatedat"></a> `updatedAt` | `Date` | When the thread record was last updated (state, context, etc.). | [packages/kernl/src/api/models/thread.ts:83](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L83) |
