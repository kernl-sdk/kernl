---
layout: docs
---

# Interface: ModelCallEndEvent\<TContext\>

Defined in: [packages/kernl/src/lifecycle.ts:131](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L131)

Emitted when a model call ends.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId?` | `public` | `string` | Agent ID if called within an agent context. | [packages/kernl/src/lifecycle.ts:162](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L162) |
| <a id="context"></a> `context?` | `public` | [`Context`](../classes/Context.md)\<`TContext`\> | Execution context if available. NOTE: Includes `context.agent` reference for tools - may be optimized in future. | [packages/kernl/src/lifecycle.ts:169](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L169) |
| <a id="finishreason"></a> `finishReason` | `public` | [`LanguageModelFinishReason`](../../protocol/interfaces/LanguageModelFinishReason.md) | Reason the model stopped generating. | [packages/kernl/src/lifecycle.ts:147](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L147) |
| <a id="kind"></a> `kind` | `readonly` | `"model.call.end"` | - | [packages/kernl/src/lifecycle.ts:132](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L132) |
| <a id="modelid"></a> `modelId` | `public` | `string` | The model ID. | [packages/kernl/src/lifecycle.ts:142](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L142) |
| <a id="provider"></a> `provider` | `public` | `string` | The model provider. | [packages/kernl/src/lifecycle.ts:137](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L137) |
| <a id="threadid"></a> `threadId?` | `public` | `string` | Thread ID if called within a thread context. | [packages/kernl/src/lifecycle.ts:157](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L157) |
| <a id="usage"></a> `usage?` | `public` | [`LanguageModelUsage`](../../protocol/interfaces/LanguageModelUsage.md) | Token usage for this call. | [packages/kernl/src/lifecycle.ts:152](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L152) |
