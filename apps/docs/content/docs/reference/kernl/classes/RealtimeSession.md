---
layout: docs
---

# Class: RealtimeSession\<TContext\>

Defined in: [packages/kernl/src/realtime/session.ts:36](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L36)

A realtime session manages the connection to a realtime model.

Handles the bidirectional communication between an agent and a model,
including audio I/O (via channels), tool execution, and event routing.

## Extends

- `Emitter`\<`RealtimeSessionEvents`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `UnknownContext` |

## Constructors

### Constructor

```ts
new RealtimeSession<TContext>(agent: RealtimeAgent<TContext>, options: RealtimeSessionOptions<TContext>): RealtimeSession<TContext>;
```

Defined in: [packages/kernl/src/realtime/session.ts:74](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L74)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agent` | [`RealtimeAgent`](RealtimeAgent.md)\<`TContext`\> |
| `options` | [`RealtimeSessionOptions`](../interfaces/RealtimeSessionOptions.md)\<`TContext`\> |

#### Returns

`RealtimeSession`\<`TContext`\>

#### Overrides

```ts
Emitter<RealtimeSessionEvents>.constructor
```

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="agent"></a> `agent` | `readonly` | [`RealtimeAgent`](RealtimeAgent.md)\<`TContext`\> | `undefined` | The agent definition. | [packages/kernl/src/realtime/session.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L47) |
| <a id="channel"></a> `channel` | `readonly` | \| [`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md) \| `null` | `undefined` | The audio I/O channel (if any). | [packages/kernl/src/realtime/session.ts:57](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L57) |
| <a id="context"></a> `context` | `readonly` | [`Context`](Context.md)\<`TContext`\> | `undefined` | The session context. | [packages/kernl/src/realtime/session.ts:62](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L62) |
| <a id="id"></a> `id` | `public` | `string` \| `null` | `null` | Session ID. Null until connected. | [packages/kernl/src/realtime/session.ts:42](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L42) |
| <a id="model"></a> `model` | `readonly` | [`RealtimeModel`](../../protocol/interfaces/RealtimeModel.md) | `undefined` | The realtime model. | [packages/kernl/src/realtime/session.ts:52](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L52) |

## Methods

### close()

```ts
close(): void;
```

Defined in: [packages/kernl/src/realtime/session.ts:185](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L185)

Close the session and release resources.

#### Returns

`void`

***

### commit()

```ts
commit(): void;
```

Defined in: [packages/kernl/src/realtime/session.ts:146](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L146)

Commit the audio buffer (signal end of speech).

#### Returns

`void`

***

### connect()

```ts
connect(): Promise<void>;
```

Defined in: [packages/kernl/src/realtime/session.ts:96](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L96)

Connect to the realtime model.

#### Returns

`Promise`\<`void`\>

***

### emit()

```ts
emit<K>(event: K, ...args: RealtimeSessionEvents[K]): boolean;
```

Defined in: packages/shared/dist/emitter.d.ts:28

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `RealtimeSessionEvents` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| ...`args` | `RealtimeSessionEvents`\[`K`\] |

#### Returns

`boolean`

#### Inherited from

```ts
Emitter.emit
```

***

### interrupt()

```ts
interrupt(): void;
```

Defined in: [packages/kernl/src/realtime/session.ts:163](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L163)

Interrupt the current response.

#### Returns

`void`

***

### mute()

```ts
mute(): void;
```

Defined in: [packages/kernl/src/realtime/session.ts:171](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L171)

Mute audio input.

#### Returns

`void`

***

### off()

```ts
off<K>(event: K, listener: (...args: RealtimeSessionEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:26

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `RealtimeSessionEvents` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `RealtimeSessionEvents`\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
Emitter.off
```

***

### on()

```ts
on<K>(event: K, listener: (...args: RealtimeSessionEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:25

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `RealtimeSessionEvents` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `RealtimeSessionEvents`\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
Emitter.on
```

***

### once()

```ts
once<K>(event: K, listener: (...args: RealtimeSessionEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:27

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `RealtimeSessionEvents` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `RealtimeSessionEvents`\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
Emitter.once
```

***

### sendAudio()

```ts
sendAudio(audio: string): void;
```

Defined in: [packages/kernl/src/realtime/session.ts:139](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L139)

Send audio to the model.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `audio` | `string` |

#### Returns

`void`

***

### sendMessage()

```ts
sendMessage(text: string): void;
```

Defined in: [packages/kernl/src/realtime/session.ts:153](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L153)

Send a text message to the model.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`void`

***

### unmute()

```ts
unmute(): void;
```

Defined in: [packages/kernl/src/realtime/session.ts:178](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/session.ts#L178)

Unmute audio input.

#### Returns

`void`
