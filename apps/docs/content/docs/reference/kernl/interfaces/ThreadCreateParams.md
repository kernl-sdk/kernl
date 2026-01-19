---
layout: docs
---

# Interface: ThreadCreateParams

Defined in: [packages/kernl/src/api/resources/threads/types.ts:70](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L70)

Parameters for creating a new thread via the public Threads resource.

Note: low-level API requires explicit agent + model. For most callers,
prefer the agent-scoped helpers (agent.threads.create) which infer these.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId` | `string` | Owning agent id for the new thread. | [packages/kernl/src/api/resources/threads/types.ts:74](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L74) |
| <a id="context"></a> `context?` | `Record`\<`string`, `unknown`\> | Initial context object for the thread. | [packages/kernl/src/api/resources/threads/types.ts:98](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L98) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | Arbitrary JSON-serializable metadata to attach to the thread. | [packages/kernl/src/api/resources/threads/types.ts:115](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L115) |
| <a id="model"></a> `model` | \{ `modelId`: `string`; `provider`: `string`; \} | Language model backing this thread. | [packages/kernl/src/api/resources/threads/types.ts:107](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L107) |
| `model.modelId` | `string` | - | [packages/kernl/src/api/resources/threads/types.ts:109](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L109) |
| `model.provider` | `string` | - | [packages/kernl/src/api/resources/threads/types.ts:108](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L108) |
| <a id="namespace"></a> `namespace?` | `string` | Logical namespace to create the thread in. Defaults to `"kernl"` when not provided. | [packages/kernl/src/api/resources/threads/types.ts:88](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L88) |
| <a id="parenttaskid"></a> `parentTaskId?` | `string` \| `null` | Optional parent task id that spawned this thread, if any. | [packages/kernl/src/api/resources/threads/types.ts:103](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L103) |
| <a id="tid"></a> `tid?` | `string` | Optional explicit thread id. If omitted, a new id will be generated. | [packages/kernl/src/api/resources/threads/types.ts:81](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L81) |
| <a id="title"></a> `title?` | `string` | Optional human-readable title for the thread. | [packages/kernl/src/api/resources/threads/types.ts:93](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L93) |
