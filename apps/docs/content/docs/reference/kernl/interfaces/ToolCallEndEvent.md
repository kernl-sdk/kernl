---
layout: docs
---

# Interface: ToolCallEndEvent\<TContext\>

Defined in: [packages/kernl/src/lifecycle.ts:216](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L216)

Emitted when a tool call ends.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId` | `public` | `string` | The agent that executed this tool. | [packages/kernl/src/lifecycle.ts:227](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L227) |
| <a id="callid"></a> `callId` | `public` | `string` | Unique identifier for this call. | [packages/kernl/src/lifecycle.ts:244](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L244) |
| <a id="context"></a> `context` | `public` | [`Context`](../classes/Context.md)\<`TContext`\> | The context for this execution. NOTE: Includes `context.agent` reference for tools - may be optimized in future. | [packages/kernl/src/lifecycle.ts:234](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L234) |
| <a id="error"></a> `error` | `public` | `string` \| `null` | Error message if state is "failed", null if successful. | [packages/kernl/src/lifecycle.ts:259](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L259) |
| <a id="kind"></a> `kind` | `readonly` | `"tool.call.end"` | - | [packages/kernl/src/lifecycle.ts:217](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L217) |
| <a id="result"></a> `result?` | `public` | `string` | Result if state is "completed". | [packages/kernl/src/lifecycle.ts:254](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L254) |
| <a id="state"></a> `state` | `public` | [`ToolCallState`](../../protocol/type-aliases/ToolCallState.md) | Final state of the tool call. | [packages/kernl/src/lifecycle.ts:249](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L249) |
| <a id="threadid"></a> `threadId` | `public` | `string` | The thread ID. | [packages/kernl/src/lifecycle.ts:222](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L222) |
| <a id="toolid"></a> `toolId` | `public` | `string` | The tool that was called. | [packages/kernl/src/lifecycle.ts:239](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L239) |
