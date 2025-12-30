/**
 * AudioWorklet processor for capturing and resampling audio.
 *
 * This runs on the audio rendering thread for low-latency processing.
 * Resamples from device sample rate to target rate (24kHz for realtime API).
 */

// This code runs inside an AudioWorkletGlobalScope
const workletCode = `
const TARGET_SAMPLE_RATE = 24000;

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.resampleBuffer = [];
    this.resampleRatio = sampleRate / TARGET_SAMPLE_RATE;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const inputData = input[0];

    // Resample using linear interpolation
    const resampled = this.resample(inputData);

    // Convert to PCM16
    const pcm16 = new Int16Array(resampled.length);
    for (let i = 0; i < resampled.length; i++) {
      const s = Math.max(-1, Math.min(1, resampled[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Send to main thread
    this.port.postMessage({ pcm16: pcm16.buffer }, [pcm16.buffer]);

    return true;
  }

  resample(input) {
    // Add input to buffer
    for (let i = 0; i < input.length; i++) {
      this.resampleBuffer.push(input[i]);
    }

    // Calculate how many output samples we can produce
    const outputLength = Math.floor(this.resampleBuffer.length / this.resampleRatio);
    if (outputLength === 0) return new Float32Array(0);

    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * this.resampleRatio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, this.resampleBuffer.length - 1);
      const t = srcIndex - srcIndexFloor;

      // Linear interpolation
      output[i] = this.resampleBuffer[srcIndexFloor] * (1 - t) +
                  this.resampleBuffer[srcIndexCeil] * t;
    }

    // Remove consumed samples from buffer
    const consumed = Math.floor(outputLength * this.resampleRatio);
    this.resampleBuffer = this.resampleBuffer.slice(consumed);

    return output;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
`;

/**
 * Create a blob URL for the audio worklet processor.
 * This allows loading the worklet without a separate file.
 */
export function createWorkletUrl(): string {
  const blob = new Blob([workletCode], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}
