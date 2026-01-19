---
layout: docs
---

# Interface: ThreadSystemEvent

Defined in: [packages/kernl/src/thread/types.ts:129](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L129)

System event - runtime state changes (not sent to model).

## Extends

- [`ThreadEventBase`](ThreadEventBase.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `public` | `string` | [`ThreadEventBase`](ThreadEventBase.md).[`id`](ThreadEventBase.md#id) | [packages/kernl/src/thread/types.ts:119](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L119) |
| <a id="kind"></a> `kind` | `readonly` | `"system"` | - | [packages/kernl/src/thread/types.ts:130](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L130) |
| <a id="metadata"></a> `metadata` | `public` | `Record`\<`string`, `unknown`\> | [`ThreadEventBase`](ThreadEventBase.md).[`metadata`](ThreadEventBase.md#metadata) | [packages/kernl/src/thread/types.ts:123](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L123) |
| <a id="seq"></a> `seq` | `public` | `number` | [`ThreadEventBase`](ThreadEventBase.md).[`seq`](ThreadEventBase.md#seq) | [packages/kernl/src/thread/types.ts:121](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L121) |
| <a id="tid"></a> `tid` | `public` | `string` | [`ThreadEventBase`](ThreadEventBase.md).[`tid`](ThreadEventBase.md#tid) | [packages/kernl/src/thread/types.ts:120](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L120) |
| <a id="timestamp"></a> `timestamp` | `public` | `Date` | [`ThreadEventBase`](ThreadEventBase.md).[`timestamp`](ThreadEventBase.md#timestamp) | [packages/kernl/src/thread/types.ts:122](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L122) |
