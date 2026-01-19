---
layout: docs
---

# Interface: LanguageModelFinishReason

Defined in: [packages/protocol/src/language-model/model.ts:99](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L99)

Reason why a language model finished generating a response.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="raw"></a> `raw` | `string` \| `undefined` | Raw finish reason from the provider. | [packages/protocol/src/language-model/model.ts:121](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L121) |
| <a id="unified"></a> `unified` | `"error"` \| `"stop"` \| `"length"` \| `"content-filter"` \| `"tool-calls"` \| `"other"` | Unified finish reason across providers. - `stop`: model generated stop sequence - `length`: model generated maximum number of tokens - `content-filter`: content filter violation stopped the model - `tool-calls`: model triggered tool calls - `error`: model stopped because of an error - `other`: model stopped for other reasons | [packages/protocol/src/language-model/model.ts:110](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L110) |
