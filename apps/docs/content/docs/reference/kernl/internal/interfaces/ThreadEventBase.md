---
layout: docs
---

# Interface: ThreadEventBase

Defined in: [packages/kernl/src/thread/types.ts:118](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L118)

Base fields for all thread events - added to every LanguageModelItem when stored in thread.

## Extended by

- [`ThreadSystemEvent`](ThreadSystemEvent.md)

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | [packages/kernl/src/thread/types.ts:119](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L119) |
| <a id="metadata"></a> `metadata` | `Record`\<`string`, `unknown`\> | [packages/kernl/src/thread/types.ts:123](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L123) |
| <a id="seq"></a> `seq` | `number` | [packages/kernl/src/thread/types.ts:121](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L121) |
| <a id="tid"></a> `tid` | `string` | [packages/kernl/src/thread/types.ts:120](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L120) |
| <a id="timestamp"></a> `timestamp` | `Date` | [packages/kernl/src/thread/types.ts:122](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L122) |
