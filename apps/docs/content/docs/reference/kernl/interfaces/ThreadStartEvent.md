---
layout: docs
---

# Interface: ThreadStartEvent\<TContext\>

Defined in: [packages/kernl/src/lifecycle.ts:17](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L17)

Emitted when a thread starts execution.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId` | `public` | `string` | The agent executing this thread. | [packages/kernl/src/lifecycle.ts:28](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L28) |
| <a id="context"></a> `context` | `public` | [`Context`](../classes/Context.md)\<`TContext`\> | The context for this execution. NOTE: Includes `context.agent` reference for tools - may be optimized in future. | [packages/kernl/src/lifecycle.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L40) |
| <a id="kind"></a> `kind` | `readonly` | `"thread.start"` | - | [packages/kernl/src/lifecycle.ts:18](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L18) |
| <a id="namespace"></a> `namespace` | `public` | `string` | The namespace of the thread. | [packages/kernl/src/lifecycle.ts:33](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L33) |
| <a id="threadid"></a> `threadId` | `public` | `string` | The thread ID. | [packages/kernl/src/lifecycle.ts:23](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L23) |
