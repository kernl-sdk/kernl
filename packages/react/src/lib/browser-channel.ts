import type {
  RealtimeChannel,
  RealtimeChannelEvents,
} from "@kernl-sdk/protocol";
import { Emitter, base64ToPcm16, pcm16ToFloat32 } from "@kernl-sdk/shared";

import { createWorkletUrl } from "./audio-capture-worklet";

/** Standard wire format sample rate for realtime audio (PCM16). */
const WIRE_FORMAT_SAMPLE_RATE = 24000;

/** Lookahead buffer to prevent gaps from network jitter (seconds). */
const PLAYBACK_LOOKAHEAD = 0.05;

/**
 * Browser-based audio channel for realtime voice sessions.
 *
 * Uses the standard wire format (24kHz PCM16 base64) for audio I/O.
 * Captures microphone audio and plays received audio through Web Audio API.
 * Resamples from device sample rate to wire format using AudioWorklet.
 */
export class BrowserChannel
  extends Emitter<RealtimeChannelEvents>
  implements RealtimeChannel
{
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private workletUrl: string | null = null;
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private _output: AnalyserNode | null = null;
  private _input: AnalyserNode | null = null;

  /**
   * Initialize audio context and start capturing from the microphone.
   */
  async init(): Promise<void> {
    this.audioContext = new AudioContext();

    // resume AudioContext (required after user gesture in some browsers)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // get microphone stream
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Load AudioWorklet processor (resamples from device rate to wire format)
    this.workletUrl = createWorkletUrl();
    await this.audioContext.audioWorklet.addModule(this.workletUrl);

    // Create worklet node
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      "audio-capture-processor",
    );

    // Handle resampled PCM16 audio from worklet
    this.workletNode.port.onmessage = (event) => {
      const pcm16 = new Int16Array(event.data.pcm16);
      if (pcm16.length === 0) return;

      const base64 = base64ToPcm16.decode(pcm16);
      this.emit("audio", base64);
    };

    // Create input analyser for mic visualization
    this._input = this.audioContext.createAnalyser();
    this._input.fftSize = 256;
    this._input.smoothingTimeConstant = 0.5;

    // Connect: mic → input analyser (for viz) and mic → worklet (for sending)
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    source.connect(this._input);
    source.connect(this.workletNode);

    // Create output analyser for visualization
    this._output = this.audioContext.createAnalyser();
    this._output.fftSize = 256;
    this._output.smoothingTimeConstant = 0.8;
    this._output.connect(this.audioContext.destination);
  }

  /**
   * Analyser node for speaker output (model audio).
   */
  get output(): AnalyserNode | null {
    return this._output;
  }

  /**
   * Analyser node for mic input (user audio).
   */
  get input(): AnalyserNode | null {
    return this._input;
  }

  /**
   * Send audio to be played through speakers.
   * Audio is in wire format (24kHz PCM16), Web Audio resamples to device rate.
   */
  sendAudio(audio: string): void {
    if (!this.audioContext || !this._output) return;

    const pcm16 = base64ToPcm16.encode(audio);
    const float32 = pcm16ToFloat32.encode(pcm16);

    // Create buffer at wire format rate - Web Audio resamples automatically
    const buffer = this.audioContext.createBuffer(
      1,
      float32.length,
      WIRE_FORMAT_SAMPLE_RATE,
    );
    buffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    // Route through analyser for visualization (analyser → destination)
    source.connect(this._output);

    // Track source for interruption
    this.activeSources.push(source);
    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) this.activeSources.splice(idx, 1);
    };

    // Schedule playback with lookahead to prevent gaps from network jitter
    const now = this.audioContext.currentTime;
    const minStartTime = now + PLAYBACK_LOOKAHEAD;
    const startTime = Math.max(minStartTime, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
  }

  /**
   * Interrupt audio playback.
   */
  interrupt(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    }
    this.activeSources = [];
    this.nextPlayTime = 0;
  }

  /**
   * Clean up resources.
   */
  close(): void {
    this.interrupt();
    this.workletNode?.disconnect();
    this.workletNode = null;
    this._output?.disconnect();
    this._output = null;
    this._input?.disconnect();
    this._input = null;
    if (this.workletUrl) {
      URL.revokeObjectURL(this.workletUrl);
      this.workletUrl = null;
    }
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.audioContext?.close();
    this.audioContext = null;
  }
}
