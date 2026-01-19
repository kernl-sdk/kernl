---
layout: docs
---

# Interface: RealtimeChannel

Defined in: [packages/protocol/src/realtime/types.ts:21](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L21)

Base interface for audio I/O channels.

Channels bridge between audio sources (browser mic, Twilio, Discord)
and the realtime session. They handle audio capture/playback and emit
events that the session listens to.

## Extends

- `TypedEmitter`\<[`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md)\>

## Methods

### close()

```ts
close(): void;
```

Defined in: [packages/protocol/src/realtime/types.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L37)

Clean up resources and close the channel.

#### Returns

`void`

***

### emit()

```ts
emit<K>(event: K, ...args: RealtimeChannelEvents[K]): boolean;
```

Defined in: packages/shared/dist/emitter.d.ts:18

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| ...`args` | [`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md)\[`K`\] |

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

Defined in: [packages/protocol/src/realtime/types.ts:32](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L32)

Interrupt current audio playback.
Called by session when response is cancelled.

#### Returns

`void`

***

### off()

```ts
off<K>(event: K, listener: (...args: RealtimeChannelEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:16

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
TypedEmitter.off
```

***

### on()

```ts
on<K>(event: K, listener: (...args: RealtimeChannelEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:15

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
TypedEmitter.on
```

***

### once()

```ts
once<K>(event: K, listener: (...args: RealtimeChannelEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:17

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeChannelEvents`](../type-aliases/RealtimeChannelEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
TypedEmitter.once
```

***

### sendAudio()

```ts
sendAudio(audio: string): void;
```

Defined in: [packages/protocol/src/realtime/types.ts:26](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L26)

Send audio to be played/transmitted by the channel.
Called by session when audio is received from the model.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `audio` | `string` |

#### Returns

`void`
