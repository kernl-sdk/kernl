---
layout: docs
---

# Interface: AudioSource

Defined in: [react/src/components/live-waveform.tsx:8](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L8)

Audio source interface for LiveWaveform visualization.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="input"></a> `input` | `readonly` | `AnalyserNode` \| `null` | Analyser for mic input (user audio). | [react/src/components/live-waveform.tsx:12](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L12) |
| <a id="output"></a> `output` | `readonly` | `AnalyserNode` \| `null` | Analyser for speaker output (model audio). | [react/src/components/live-waveform.tsx:10](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L10) |
