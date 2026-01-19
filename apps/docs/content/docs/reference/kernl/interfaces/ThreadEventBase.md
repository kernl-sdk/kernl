---
layout: docs
---

# Interface: ThreadEventBase

Defined in: [packages/kernl/src/api/models/thread.ts:101](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L101)

Common metadata for all thread events.

These fields are added on top of the underlying `LanguageModelItem`
when events are persisted to storage.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | Globally-unique event identifier within the thread. | [packages/kernl/src/api/models/thread.ts:105](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L105) |
| <a id="metadata"></a> `metadata` | `Record`\<`string`, `unknown`\> | Arbitrary metadata attached to the event (implementation-specific). | [packages/kernl/src/api/models/thread.ts:127](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L127) |
| <a id="seq"></a> `seq` | `number` | Monotonically-increasing sequence number within the thread. `seq` defines the total order of events for a given thread. | [packages/kernl/src/api/models/thread.ts:117](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L117) |
| <a id="tid"></a> `tid` | `string` | ID of the thread this event belongs to. | [packages/kernl/src/api/models/thread.ts:110](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L110) |
| <a id="timestamp"></a> `timestamp` | `Date` | Timestamp when the event was recorded (wall-clock time). | [packages/kernl/src/api/models/thread.ts:122](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L122) |
