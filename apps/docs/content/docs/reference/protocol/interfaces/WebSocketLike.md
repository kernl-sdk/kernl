---
layout: docs
---

# Interface: WebSocketLike

Defined in: [packages/protocol/src/realtime/types.ts:107](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L107)

Minimal WebSocket interface matching the standard WebSocket API.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="readystate"></a> `readyState` | `readonly` | `number` | [packages/protocol/src/realtime/types.ts:108](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L108) |

## Methods

### addEventListener()

```ts
addEventListener(type: string, listener: (event: unknown) => void): void;
```

Defined in: [packages/protocol/src/realtime/types.ts:111](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L111)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `string` |
| `listener` | (`event`: `unknown`) => `void` |

#### Returns

`void`

***

### close()

```ts
close(code?: number, reason?: string): void;
```

Defined in: [packages/protocol/src/realtime/types.ts:110](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L110)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code?` | `number` |
| `reason?` | `string` |

#### Returns

`void`

***

### removeEventListener()

```ts
removeEventListener(type: string, listener: (event: unknown) => void): void;
```

Defined in: [packages/protocol/src/realtime/types.ts:112](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L112)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `string` |
| `listener` | (`event`: `unknown`) => `void` |

#### Returns

`void`

***

### send()

```ts
send(data: string | ArrayBuffer): void;
```

Defined in: [packages/protocol/src/realtime/types.ts:109](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L109)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` \| `ArrayBuffer` |

#### Returns

`void`
