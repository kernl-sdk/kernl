---
layout: docs
---

# Class: BrowserChannel

Defined in: [react/src/lib/browser-channel.ts:22](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/lib/browser-channel.ts#L22)

Browser-based audio channel for realtime voice sessions.

Uses the standard wire format (24kHz PCM16 base64) for audio I/O.
Captures microphone audio and plays received audio through Web Audio API.
Resamples from device sample rate to wire format using AudioWorklet.

## Extends

- `Emitter`\<[`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md)\>

## Implements

- [`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md)

## Constructors

### Constructor

```ts
new BrowserChannel(): BrowserChannel;
```

#### Returns

`BrowserChannel`

#### Inherited from

```ts
Emitter<RealtimeChannelEvents>.constructor
```

## Accessors

### input

#### Get Signature

```ts
get input(): AnalyserNode | null;
```

Defined in: [react/src/lib/browser-channel.ts:101](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/lib/browser-channel.ts#L101)

Analyser node for mic input (user audio).

##### Returns

`AnalyserNode` \| `null`

***

### output

#### Get Signature

```ts
get output(): AnalyserNode | null;
```

Defined in: [react/src/lib/browser-channel.ts:94](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/lib/browser-channel.ts#L94)

Analyser node for speaker output (model audio).

##### Returns

`AnalyserNode` \| `null`

## Methods

### close()

```ts
close(): void;
```

Defined in: [react/src/lib/browser-channel.ts:161](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/lib/browser-channel.ts#L161)

Clean up resources.

#### Returns

`void`

#### Implementation of

[`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md).[`close`](../../protocol/interfaces/RealtimeChannel.md#close)

***

### emit()

```ts
emit<K>(event: K, ...args: RealtimeChannelEvents[K]): boolean;
```

Defined in: shared/dist/emitter.d.ts:28

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| ...`args` | [`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md)\[`K`\] |

#### Returns

`boolean`

#### Implementation of

[`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md).[`emit`](../../protocol/interfaces/RealtimeChannel.md#emit)

#### Inherited from

```ts
Emitter.emit
```

***

### init()

```ts
init(): Promise<void>;
```

Defined in: [react/src/lib/browser-channel.ts:38](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/lib/browser-channel.ts#L38)

Initialize audio context and start capturing from the microphone.

#### Returns

`Promise`\<`void`\>

***

### interrupt()

```ts
interrupt(): void;
```

Defined in: [react/src/lib/browser-channel.ts:146](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/lib/browser-channel.ts#L146)

Interrupt audio playback.

#### Returns

`void`

#### Implementation of

[`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md).[`interrupt`](../../protocol/interfaces/RealtimeChannel.md#interrupt)

***

### off()

```ts
off<K>(event: K, listener: (...args: RealtimeChannelEvents[K]) => void): this;
```

Defined in: shared/dist/emitter.d.ts:26

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Implementation of

[`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md).[`off`](../../protocol/interfaces/RealtimeChannel.md#off)

#### Inherited from

```ts
Emitter.off
```

***

### on()

```ts
on<K>(event: K, listener: (...args: RealtimeChannelEvents[K]) => void): this;
```

Defined in: shared/dist/emitter.d.ts:25

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Implementation of

[`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md).[`on`](../../protocol/interfaces/RealtimeChannel.md#on)

#### Inherited from

```ts
Emitter.on
```

***

### once()

```ts
once<K>(event: K, listener: (...args: RealtimeChannelEvents[K]) => void): this;
```

Defined in: shared/dist/emitter.d.ts:27

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: [`RealtimeChannelEvents`](../../protocol/type-aliases/RealtimeChannelEvents.md)\[`K`\]) => `void` |

#### Returns

`this`

#### Implementation of

[`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md).[`once`](../../protocol/interfaces/RealtimeChannel.md#once)

#### Inherited from

```ts
Emitter.once
```

***

### sendAudio()

```ts
sendAudio(audio: string): void;
```

Defined in: [react/src/lib/browser-channel.ts:109](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/lib/browser-channel.ts#L109)

Send audio to be played through speakers.
Audio is in wire format (24kHz PCM16), Web Audio resamples to device rate.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `audio` | `string` |

#### Returns

`void`

#### Implementation of

[`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md).[`sendAudio`](../../protocol/interfaces/RealtimeChannel.md#sendaudio)
