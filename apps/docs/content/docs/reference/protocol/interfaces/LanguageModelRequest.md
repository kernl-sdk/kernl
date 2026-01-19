---
layout: docs
---

# Interface: LanguageModelRequest

Defined in: [packages/protocol/src/language-model/request.ts:15](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L15)

A request to a large language model.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="abort"></a> `abort?` | `AbortSignal` | Abort signal for cancelling the operation. | [packages/protocol/src/language-model/request.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L46) |
| <a id="includerawchunks"></a> `includeRawChunks?` | `boolean` | Include raw chunks in the stream. Only applicable for streaming calls. | [packages/protocol/src/language-model/request.ts:41](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L41) |
| <a id="input"></a> `input` | [`LanguageModelItem`](../type-aliases/LanguageModelItem.md)[] | The input to the model. | [packages/protocol/src/language-model/request.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L19) |
| <a id="responsetype"></a> `responseType?` | [`LanguageModelResponseType`](../type-aliases/LanguageModelResponseType.md) | Response format. The output can either be text or JSON. Default is text. If JSON is selected, a schema can optionally be provided to guide the LLM. | [packages/protocol/src/language-model/request.ts:31](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L31) |
| <a id="settings"></a> `settings` | [`LanguageModelRequestSettings`](LanguageModelRequestSettings.md) | The model settings to use for the request. | [packages/protocol/src/language-model/request.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L24) |
| <a id="tools"></a> `tools?` | [`LanguageModelTool`](../type-aliases/LanguageModelTool.md)[] | The tools that are available for the model. | [packages/protocol/src/language-model/request.ts:36](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L36) |
