---
layout: docs
---

# Interface: LanguageModelResponseJSON

Defined in: [packages/protocol/src/language-model/request.ts:69](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L69)

JSON response format.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="description"></a> `description?` | `public` | `string` | Description of the output that should be generated. Used by some providers for additional LLM guidance. | [packages/protocol/src/language-model/request.ts:85](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L85) |
| <a id="kind"></a> `kind` | `readonly` | `"json"` | - | [packages/protocol/src/language-model/request.ts:70](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L70) |
| <a id="name"></a> `name?` | `public` | `string` | Name of output that should be generated. Used by some providers for additional LLM guidance. | [packages/protocol/src/language-model/request.ts:80](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L80) |
| <a id="schema"></a> `schema?` | `public` | `JSONSchema7` | JSON schema that the generated output should conform to. | [packages/protocol/src/language-model/request.ts:75](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L75) |
