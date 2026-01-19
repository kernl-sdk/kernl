---
layout: docs
---

# Interface: ThreadUpdate

Defined in: [packages/kernl/src/storage/thread.ts:87](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L87)

Partial update for thread runtime state.

Only mutable fields are exposed (tick, state, context, metadata).

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="context"></a> `context?` | [`Context`](../classes/Context.md)\<`unknown`\> | [packages/kernl/src/storage/thread.ts:90](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L90) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> \| `null` | [packages/kernl/src/storage/thread.ts:91](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L91) |
| <a id="state"></a> `state?` | [`ThreadState`](../type-aliases/ThreadState.md) | [packages/kernl/src/storage/thread.ts:89](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L89) |
| <a id="tick"></a> `tick?` | `number` | [packages/kernl/src/storage/thread.ts:88](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L88) |
