---
layout: docs
---

# Interface: LanguageModelRequestSettings

Defined in: [packages/protocol/src/language-model/request.ts:97](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L97)

Settings to use when calling an LLM.

This class holds optional model configuration parameters (e.g. temperature,
topP, penalties, truncation, etc.).

Not all models/providers support all of these parameters, so please check the API documentation
for the specific model and provider you are using.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="frequencypenalty"></a> `frequencyPenalty?` | `number` | The frequency penalty to use when calling the model. | [packages/protocol/src/language-model/request.ts:111](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L111) |
| <a id="maxtokens"></a> `maxTokens?` | `number` | The maximum number of output tokens to generate. | [packages/protocol/src/language-model/request.ts:137](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L137) |
| <a id="paralleltoolcalls"></a> `parallelToolCalls?` | `boolean` | Whether to use parallel tool calls when calling the model. Defaults to false if not provided. | [packages/protocol/src/language-model/request.ts:127](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L127) |
| <a id="presencepenalty"></a> `presencePenalty?` | `number` | The presence penalty to use when calling the model. | [packages/protocol/src/language-model/request.ts:116](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L116) |
| <a id="provideroptions"></a> `providerOptions?` | [`SharedProviderOptions`](../type-aliases/SharedProviderOptions.md) | Additional provider specific metadata to be passed directly to the model request. | [packages/protocol/src/language-model/request.ts:159](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L159) |
| <a id="reasoning"></a> `reasoning?` | [`ModelSettingsReasoning`](../type-aliases/ModelSettingsReasoning.md) | The reasoning settings to use when calling the model. | [packages/protocol/src/language-model/request.ts:148](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L148) |
| <a id="store"></a> `store?` | `boolean` | Whether to store the generated model response for later retrieval. Defaults to true if not provided. | [packages/protocol/src/language-model/request.ts:143](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L143) |
| <a id="temperature"></a> `temperature?` | `number` | The temperature to use when calling the model. | [packages/protocol/src/language-model/request.ts:101](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L101) |
| <a id="text"></a> `text?` | [`ModelSettingsText`](ModelSettingsText.md) | The text settings to use when calling the model. | [packages/protocol/src/language-model/request.ts:153](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L153) |
| <a id="toolchoice"></a> `toolChoice?` | [`LanguageModelToolChoice`](../type-aliases/LanguageModelToolChoice.md) | The tool choice to use when calling the model. | [packages/protocol/src/language-model/request.ts:121](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L121) |
| <a id="topp"></a> `topP?` | `number` | The topP to use when calling the model. | [packages/protocol/src/language-model/request.ts:106](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L106) |
| <a id="truncation"></a> `truncation?` | `"auto"` \| `"disabled"` | The truncation strategy to use when calling the model. | [packages/protocol/src/language-model/request.ts:132](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L132) |
