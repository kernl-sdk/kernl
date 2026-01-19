---
layout: docs
---

# Interface: RealtimeSessionConfig

Defined in: [packages/protocol/src/realtime/types.ts:118](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L118)

Configuration for a realtime session.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="audio"></a> `audio?` | [`AudioConfig`](AudioConfig.md) | Audio format configuration. | [packages/protocol/src/realtime/types.ts:147](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L147) |
| <a id="instructions"></a> `instructions?` | `string` | System instructions for the model. | [packages/protocol/src/realtime/types.ts:122](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L122) |
| <a id="modalities"></a> `modalities?` | [`RealtimeModality`](../type-aliases/RealtimeModality.md)[] | Output modalities (text, audio, or both). | [packages/protocol/src/realtime/types.ts:137](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L137) |
| <a id="provideroptions"></a> `providerOptions?` | [`SharedProviderOptions`](../type-aliases/SharedProviderOptions.md) | Provider-specific options. | [packages/protocol/src/realtime/types.ts:157](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L157) |
| <a id="toolchoice"></a> `toolChoice?` | [`RealtimeToolChoice`](../type-aliases/RealtimeToolChoice.md) | Tool choice behavior. | [packages/protocol/src/realtime/types.ts:132](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L132) |
| <a id="tools"></a> `tools?` | [`LanguageModelTool`](../type-aliases/LanguageModelTool.md)[] | Available tools the model can call. | [packages/protocol/src/realtime/types.ts:127](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L127) |
| <a id="turndetection"></a> `turnDetection?` | [`TurnDetectionConfig`](TurnDetectionConfig.md) | Turn detection / VAD configuration. | [packages/protocol/src/realtime/types.ts:152](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L152) |
| <a id="voice"></a> `voice?` | [`VoiceConfig`](VoiceConfig.md) | Voice configuration for audio output. | [packages/protocol/src/realtime/types.ts:142](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L142) |
