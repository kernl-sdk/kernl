---
layout: docs
---

# Interface: RealtimeResponseConfig

Defined in: [packages/protocol/src/realtime/types.ts:276](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L276)

Configuration for creating a response (for response.create event).

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="instructions"></a> `instructions?` | `string` | Override session instructions for this response. | [packages/protocol/src/realtime/types.ts:280](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L280) |
| <a id="modalities"></a> `modalities?` | [`RealtimeModality`](../type-aliases/RealtimeModality.md)[] | Override modalities for this response. | [packages/protocol/src/realtime/types.ts:290](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L290) |
| <a id="tools"></a> `tools?` | [`LanguageModelTool`](../type-aliases/LanguageModelTool.md)[] | Override tools for this response. | [packages/protocol/src/realtime/types.ts:285](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L285) |
