---
layout: docs
---

# Interface: ThreadStopEvent\<TContext, TOutput\>

Defined in: [packages/kernl/src/lifecycle.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L46)

Emitted when a thread stops execution.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId` | `public` | `string` | The agent that executed this thread. | [packages/kernl/src/lifecycle.ts:57](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L57) |
| <a id="context"></a> `context` | `public` | [`Context`](../classes/Context.md)\<`TContext`\> | The context for this execution. NOTE: Includes `context.agent` reference for tools - may be optimized in future. | [packages/kernl/src/lifecycle.ts:69](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L69) |
| <a id="error"></a> `error?` | `public` | `string` | Error message (present on error). | [packages/kernl/src/lifecycle.ts:84](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L84) |
| <a id="kind"></a> `kind` | `readonly` | `"thread.stop"` | - | [packages/kernl/src/lifecycle.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L47) |
| <a id="namespace"></a> `namespace` | `public` | `string` | The namespace of the thread. | [packages/kernl/src/lifecycle.ts:62](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L62) |
| <a id="result"></a> `result?` | `public` | `TOutput` | The result of execution (present on success). | [packages/kernl/src/lifecycle.ts:79](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L79) |
| <a id="state"></a> `state` | `public` | [`ThreadState`](../type-aliases/ThreadState.md) | Final state of the thread. | [packages/kernl/src/lifecycle.ts:74](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L74) |
| <a id="threadid"></a> `threadId` | `public` | `string` | The thread ID. | [packages/kernl/src/lifecycle.ts:52](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L52) |
