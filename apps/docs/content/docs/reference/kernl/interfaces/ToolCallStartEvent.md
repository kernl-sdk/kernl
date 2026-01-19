---
layout: docs
---

# Interface: ToolCallStartEvent\<TContext\>

Defined in: [packages/kernl/src/lifecycle.ts:177](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L177)

Emitted when a tool call starts.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId` | `public` | `string` | The agent executing this tool. | [packages/kernl/src/lifecycle.ts:188](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L188) |
| <a id="args"></a> `args` | `public` | `Record`\<`string`, `unknown`\> | Arguments passed to the tool (parsed JSON). | [packages/kernl/src/lifecycle.ts:210](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L210) |
| <a id="callid"></a> `callId` | `public` | `string` | Unique identifier for this call. | [packages/kernl/src/lifecycle.ts:205](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L205) |
| <a id="context"></a> `context` | `public` | [`Context`](../classes/Context.md)\<`TContext`\> | The context for this execution. NOTE: Includes `context.agent` reference for tools - may be optimized in future. | [packages/kernl/src/lifecycle.ts:195](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L195) |
| <a id="kind"></a> `kind` | `readonly` | `"tool.call.start"` | - | [packages/kernl/src/lifecycle.ts:178](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L178) |
| <a id="threadid"></a> `threadId` | `public` | `string` | The thread ID. | [packages/kernl/src/lifecycle.ts:183](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L183) |
| <a id="toolid"></a> `toolId` | `public` | `string` | The tool being called. | [packages/kernl/src/lifecycle.ts:200](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L200) |
