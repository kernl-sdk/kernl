---
layout: docs
---

# Interface: IThread\<TContext, TOutput\>

Defined in: [packages/kernl/src/thread/types.ts:79](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L79)

Thread domain interface.

Represents the complete state of a Thread that can be stored and restored.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |
| `TOutput` *extends* `AgentOutputType` | `"text"` |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="agent"></a> `agent` | [`Agent`](../../classes/Agent.md)\<`TContext`, `TOutput`\> | [packages/kernl/src/thread/types.ts:84](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L84) |
| <a id="context"></a> `context` | [`Context`](../../classes/Context.md)\<`TContext`\> | [packages/kernl/src/thread/types.ts:87](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L87) |
| <a id="createdat"></a> `createdAt` | `Date` | [packages/kernl/src/thread/types.ts:98](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L98) |
| <a id="history"></a> `history` | [`ThreadEvent`](../type-aliases/ThreadEvent.md)[] | [packages/kernl/src/thread/types.ts:89](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L89) |
| <a id="input"></a> `input` | [`LanguageModelItem`](../../../protocol/type-aliases/LanguageModelItem.md)[] | [packages/kernl/src/thread/types.ts:88](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L88) |
| <a id="metadata"></a> `metadata` | `Record`\<`string`, `unknown`\> \| `null` | [packages/kernl/src/thread/types.ts:100](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L100) |
| <a id="model"></a> `model` | [`LanguageModel`](../../../protocol/interfaces/LanguageModel.md) | [packages/kernl/src/thread/types.ts:85](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L85) |
| <a id="namespace"></a> `namespace` | `string` | [packages/kernl/src/thread/types.ts:95](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L95) |
| <a id="state"></a> `state` | [`ThreadState`](../../type-aliases/ThreadState.md) | [packages/kernl/src/thread/types.ts:94](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L94) |
| <a id="task"></a> `task` | `Task`\<`TContext`, `unknown`\> \| `null` | [packages/kernl/src/thread/types.ts:90](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L90) |
| <a id="tick"></a> `tick` | `number` | [packages/kernl/src/thread/types.ts:93](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L93) |
| <a id="tid"></a> `tid` | `string` | [packages/kernl/src/thread/types.ts:83](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L83) |
| <a id="updatedat"></a> `updatedAt` | `Date` | [packages/kernl/src/thread/types.ts:99](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L99) |
