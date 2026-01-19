---
layout: docs
---

# Interface: TurnDetectionConfig

Defined in: [packages/protocol/src/realtime/types.ts:231](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L231)

Turn detection / VAD configuration.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="createresponse"></a> `createResponse?` | `boolean` | Auto-create response on speech end. | [packages/protocol/src/realtime/types.ts:255](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L255) |
| <a id="interruptresponse"></a> `interruptResponse?` | `boolean` | Allow interruption of ongoing response. | [packages/protocol/src/realtime/types.ts:260](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L260) |
| <a id="mode"></a> `mode` | `"server_vad"` \| `"manual"` | Detection mode. | [packages/protocol/src/realtime/types.ts:235](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L235) |
| <a id="prefixpaddingms"></a> `prefixPaddingMs?` | `number` | Audio to include before speech start (ms). | [packages/protocol/src/realtime/types.ts:250](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L250) |
| <a id="silencedurationms"></a> `silenceDurationMs?` | `number` | Silence duration to trigger end of speech (ms). | [packages/protocol/src/realtime/types.ts:245](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L245) |
| <a id="threshold"></a> `threshold?` | `number` | VAD threshold (0-1). | [packages/protocol/src/realtime/types.ts:240](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L240) |
