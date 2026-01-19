---
layout: docs
---

# Interface: RealtimeConnection

Defined in: [packages/protocol/src/realtime/model.ts:67](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L67)

An active bidirectional connection to a realtime model.

One connection per session. Providers implement this interface.

## Extends

- `TypedEmitter`\<[`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md)\>

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="muted"></a> `muted` | `readonly` | `boolean` \| `null` | Whether input audio is muted. null if muting is not handled by the connection. | [packages/protocol/src/realtime/model.ts:78](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L78) |
| <a id="providermetadata"></a> `providerMetadata?` | `readonly` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Provider-specific metadata. | [packages/protocol/src/realtime/model.ts:88](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L88) |
| <a id="sessionid"></a> `sessionId` | `readonly` | `string` \| `null` | Session ID once connected. | [packages/protocol/src/realtime/model.ts:83](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L83) |
| <a id="status"></a> `status` | `readonly` | [`TransportStatus`](../type-aliases/TransportStatus.md) | Current connection status. | [packages/protocol/src/realtime/model.ts:72](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L72) |

## Methods

### close()

```ts
close(): void;
```

Defined in: [packages/protocol/src/realtime/model.ts:98](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L98)

Close the connection.

#### Returns

`void`

***

### emit()

```ts
emit<K>(event: K, ...args: RealtimeConnectionEvents[K]): boolean;
```

Defined in: packages/shared/dist/emitter.d.ts:18

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| ...`args` | [`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md)\[`K`\] |

#### Returns

`boolean`

#### Inherited from

```ts
TypedEmitter.emit
```

***

### interrupt()

```ts
interrupt(): void;
```

Defined in: [packages/protocol/src/realtime/model.ts:114](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L114)

Interrupt the current response.
Convenience for sending response.cancel event.

#### Returns

`void`

***

### mute()

```ts
mute(): void;
```

Defined in: [packages/protocol/src/realtime/model.ts:103](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L103)

Mute input audio.

#### Returns

`void`

***

### off()

```ts
off<K>(event: K, listener: (...args: RealtimeConnectionEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:16

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
TypedEmitter.off
```

***

### on()

```ts
on<K>(event: K, listener: (...args: RealtimeConnectionEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:15

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
TypedEmitter.on
```

***

### once()

```ts
once<K>(event: K, listener: (...args: RealtimeConnectionEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:17

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeConnectionEvents`](../type-aliases/RealtimeConnectionEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
TypedEmitter.once
```

***

### send()

```ts
send(event: RealtimeClientEvent): void;
```

Defined in: [packages/protocol/src/realtime/model.ts:93](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L93)

Send a client event to the model.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`RealtimeClientEvent`](../type-aliases/RealtimeClientEvent.md) |

#### Returns

`void`

***

### unmute()

```ts
unmute(): void;
```

Defined in: [packages/protocol/src/realtime/model.ts:108](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L108)

Unmute input audio.

#### Returns

`void`
