---
layout: docs
---

# Interface: ModelCallStartEvent\<TContext\>

Defined in: [packages/kernl/src/lifecycle.ts:92](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L92)

Emitted when a model call starts.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId?` | `public` | `string` | Agent ID if called within an agent context. | [packages/kernl/src/lifecycle.ts:118](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L118) |
| <a id="context"></a> `context?` | `public` | [`Context`](../classes/Context.md)\<`TContext`\> | Execution context if available. NOTE: Includes `context.agent` reference for tools - may be optimized in future. | [packages/kernl/src/lifecycle.ts:125](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L125) |
| <a id="kind"></a> `kind` | `readonly` | `"model.call.start"` | - | [packages/kernl/src/lifecycle.ts:93](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L93) |
| <a id="modelid"></a> `modelId` | `public` | `string` | The model ID. | [packages/kernl/src/lifecycle.ts:103](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L103) |
| <a id="provider"></a> `provider` | `public` | `string` | The model provider. | [packages/kernl/src/lifecycle.ts:98](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L98) |
| <a id="settings"></a> `settings` | `public` | [`LanguageModelRequestSettings`](../../protocol/interfaces/LanguageModelRequestSettings.md) | Request settings passed to the model. | [packages/kernl/src/lifecycle.ts:108](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L108) |
| <a id="threadid"></a> `threadId?` | `public` | `string` | Thread ID if called within a thread context. | [packages/kernl/src/lifecycle.ts:113](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L113) |
