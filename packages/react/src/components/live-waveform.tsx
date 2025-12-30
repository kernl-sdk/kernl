"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

/**
 * Audio source interface for LiveWaveform visualization.
 */
export interface AudioSource {
  /** Analyser for speaker output (model audio). */
  readonly output: AnalyserNode | null;
  /** Analyser for mic input (user audio). */
  readonly input: AnalyserNode | null;
}

export type LiveWaveformProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  processing?: boolean;
  /**
   * Audio source for visualization (e.g., BrowserChannel).
   */
  audio?: AudioSource | null;
  barWidth?: number;
  barHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  sensitivity?: number;
  historySize?: number;
  updateRate?: number;
  mode?: "scrolling" | "static";
};

export function LiveWaveform({
  active = false,
  processing = false,
  audio,
  barWidth = 3,
  barGap = 1,
  barRadius = 1.5,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  barHeight: baseBarHeight = 4,
  height = 64,
  sensitivity = 1,
  historySize = 60,
  updateRate = 30,
  mode = "static",
  className,
  style,
  ...props
}: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<number[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const processingAnimationRef = useRef<number | null>(null);
  const lastActiveDataRef = useRef<number[]>([]);
  const transitionProgressRef = useRef(0);
  const staticBarsRef = useRef<number[]>([]);
  const needsRedrawRef = useRef(true);
  const gradientCacheRef = useRef<CanvasGradient | null>(null);
  const lastWidthRef = useRef(0);

  // Listening state refs
  const listeningBlendRef = useRef(0); // 0 = speaking, 1 = listening
  const listeningTimeRef = useRef(0);
  const silenceCountRef = useRef(0);

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      gradientCacheRef.current = null;
      lastWidthRef.current = rect.width;
      needsRedrawRef.current = true;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (processing && !active) {
      let time = 0;
      transitionProgressRef.current = 0;

      const animateProcessing = () => {
        time += 0.03;
        transitionProgressRef.current = Math.min(
          1,
          transitionProgressRef.current + 0.02,
        );

        const processingData = [];
        const barCount = Math.floor(
          (containerRef.current?.getBoundingClientRect().width || 200) /
            (barWidth + barGap),
        );

        if (mode === "static") {
          const halfCount = Math.floor(barCount / 2);

          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - halfCount) / halfCount;
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4;

            const wave1 = Math.sin(time * 1.5 + normalizedPosition * 3) * 0.25;
            const wave2 = Math.sin(time * 0.8 - normalizedPosition * 2) * 0.2;
            const wave3 = Math.cos(time * 2 + normalizedPosition) * 0.15;
            const combinedWave = wave1 + wave2 + wave3;
            const processingValue = (0.2 + combinedWave) * centerWeight;

            let finalValue = processingValue;
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const lastDataIndex = Math.min(
                i,
                lastActiveDataRef.current.length - 1,
              );
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0;
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current;
            }

            processingData.push(Math.max(0.05, Math.min(1, finalValue)));
          }
        } else {
          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - barCount / 2) / (barCount / 2);
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4;

            const wave1 = Math.sin(time * 1.5 + i * 0.15) * 0.25;
            const wave2 = Math.sin(time * 0.8 - i * 0.1) * 0.2;
            const wave3 = Math.cos(time * 2 + i * 0.05) * 0.15;
            const combinedWave = wave1 + wave2 + wave3;
            const processingValue = (0.2 + combinedWave) * centerWeight;

            let finalValue = processingValue;
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const lastDataIndex = Math.floor(
                (i / barCount) * lastActiveDataRef.current.length,
              );
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0;
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current;
            }

            processingData.push(Math.max(0.05, Math.min(1, finalValue)));
          }
        }

        if (mode === "static") {
          staticBarsRef.current = processingData;
        } else {
          historyRef.current = processingData;
        }

        needsRedrawRef.current = true;
        processingAnimationRef.current =
          requestAnimationFrame(animateProcessing);
      };

      animateProcessing();

      return () => {
        if (processingAnimationRef.current) {
          cancelAnimationFrame(processingAnimationRef.current);
        }
      };
    } else if (!active && !processing) {
      // Reset listening state
      listeningBlendRef.current = 0;
      listeningTimeRef.current = 0;
      silenceCountRef.current = 0;

      const hasData =
        mode === "static"
          ? staticBarsRef.current.length > 0
          : historyRef.current.length > 0;

      if (hasData) {
        let fadeProgress = 0;
        const fadeToIdle = () => {
          fadeProgress += 0.03;
          if (fadeProgress < 1) {
            if (mode === "static") {
              staticBarsRef.current = staticBarsRef.current.map(
                (value) => value * (1 - fadeProgress),
              );
            } else {
              historyRef.current = historyRef.current.map(
                (value) => value * (1 - fadeProgress),
              );
            }
            needsRedrawRef.current = true;
            requestAnimationFrame(fadeToIdle);
          } else {
            if (mode === "static") {
              staticBarsRef.current = [];
            } else {
              historyRef.current = [];
            }
          }
        };
        fadeToIdle();
      }
    }
  }, [processing, active, barWidth, barGap, mode]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const animate = (currentTime: number) => {
      // Read analysers directly each frame (properties populate after init)
      const outputAnalyser = audio?.output;
      const inputAnalyser = audio?.input;

      // Render waveform
      const rect = canvas.getBoundingClientRect();

      // Update audio data if active
      if (active && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime;

        const barCount = Math.floor(rect.width / (barWidth + barGap));
        const halfCount = Math.floor(barCount / 2);

        // Threshold for detecting silence (agent not speaking)
        const silenceThreshold = 0.08;
        const silenceFramesRequired = 2;
        const transitionSpeed = 0.18;

        if (outputAnalyser) {
          const dataArray = new Uint8Array(outputAnalyser.frequencyBinCount);
          outputAnalyser.getByteFrequencyData(dataArray);

          // Calculate average audio level
          const startFreq = Math.floor(dataArray.length * 0.05);
          const endFreq = Math.floor(dataArray.length * 0.4);
          const relevantData = dataArray.slice(startFreq, endFreq);

          let sum = 0;
          for (let i = 0; i < relevantData.length; i++) {
            sum += relevantData[i];
          }
          const avgLevel = sum / relevantData.length / 255;

          // Update silence detection with hysteresis
          if (avgLevel < silenceThreshold) {
            silenceCountRef.current++;
          } else {
            silenceCountRef.current = 0;
          }

          const isListening = silenceCountRef.current >= silenceFramesRequired;

          // Smoothly transition listening blend
          if (isListening) {
            listeningBlendRef.current = Math.min(
              1,
              listeningBlendRef.current + transitionSpeed,
            );
          } else {
            listeningBlendRef.current = Math.max(
              0,
              listeningBlendRef.current - transitionSpeed * 2,
            );
          }

          if (mode === "static") {
            const newBars: number[] = [];

            // Generate speaking bars from audio data
            const speakingBars: number[] = [];
            for (let i = halfCount - 1; i >= 0; i--) {
              const dataIndex = Math.floor(
                (i / halfCount) * relevantData.length,
              );
              const value = Math.min(
                1,
                (relevantData[dataIndex] / 255) * sensitivity,
              );
              speakingBars.push(Math.max(0.05, value));
            }
            for (let i = 0; i < halfCount; i++) {
              const dataIndex = Math.floor(
                (i / halfCount) * relevantData.length,
              );
              const value = Math.min(
                1,
                (relevantData[dataIndex] / 255) * sensitivity,
              );
              speakingBars.push(Math.max(0.05, value));
            }

            // Generate listening pattern (U-shape modulated by mic input)
            listeningTimeRef.current += 0.05;

            // Get mic input level for modulation
            let micLevel = 0;
            if (inputAnalyser) {
              const inputData = new Uint8Array(
                inputAnalyser.frequencyBinCount,
              );
              inputAnalyser.getByteFrequencyData(inputData);
              let inputSum = 0;
              for (let j = 0; j < inputData.length; j++) {
                inputSum += inputData[j];
              }
              micLevel = inputSum / inputData.length / 255;
            }

            // Modulation: mic input drives the pulse, with subtle idle animation
            const idleBreath =
              0.6 + Math.sin(listeningTimeRef.current * 0.8) * 0.1;
            const micBoost = micLevel * 1.5; // amplify mic response
            const breathe = Math.min(1, idleBreath + micBoost);
            const secondaryBreath = micLevel * 0.2;

            for (let i = 0; i < barCount; i++) {
              // Distance from center (0 at center, 1 at edges)
              const distFromCenter = Math.abs(i - halfCount) / halfCount;

              // U-shape: higher at edges, lower at center
              // Use smoothstep for nice curve
              const t = distFromCenter;
              const uShape = t * t * (3 - 2 * t); // smoothstep

              // Listening value: base + u-shape, with mic-driven breathing
              const listeningValue =
                (0.05 + uShape * 0.55) * breathe + secondaryBreath * uShape;

              // Blend between speaking and listening
              const blend = listeningBlendRef.current;
              const speakingValue = speakingBars[i] || 0.05;
              const blendedValue =
                speakingValue * (1 - blend) + listeningValue * blend;

              newBars.push(Math.max(0.05, Math.min(1, blendedValue)));
            }

            staticBarsRef.current = newBars;
            lastActiveDataRef.current = newBars;
          } else {
            // Scrolling mode - original behavior
            const average = (sum / relevantData.length / 255) * sensitivity;
            historyRef.current.push(Math.min(1, Math.max(0.05, average)));
            lastActiveDataRef.current = [...historyRef.current];

            if (historyRef.current.length > historySize) {
              historyRef.current.shift();
            }
          }
          needsRedrawRef.current = true;
        } else if (active) {
          // No analyser but active - show listening pattern
          listeningBlendRef.current = Math.min(
            1,
            listeningBlendRef.current + transitionSpeed,
          );
          listeningTimeRef.current += 0.05;

          // Get mic input level for modulation
          let micLevel = 0;
          if (inputAnalyser) {
            const inputData = new Uint8Array(
              inputAnalyser.frequencyBinCount,
            );
            inputAnalyser.getByteFrequencyData(inputData);
            let inputSum = 0;
            for (let j = 0; j < inputData.length; j++) {
              inputSum += inputData[j];
            }
            micLevel = inputSum / inputData.length / 255;
          }

          const idleBreath =
            0.6 + Math.sin(listeningTimeRef.current * 0.8) * 0.1;
          const micBoost = micLevel * 1.5;
          const breathe = Math.min(1, idleBreath + micBoost);
          const secondaryBreath = micLevel * 0.2;

          const newBars: number[] = [];
          for (let i = 0; i < barCount; i++) {
            const distFromCenter = Math.abs(i - halfCount) / halfCount;
            const t = distFromCenter;
            const uShape = t * t * (3 - 2 * t);
            const listeningValue =
              (0.05 + uShape * 0.55) * breathe + secondaryBreath * uShape;
            newBars.push(Math.max(0.05, Math.min(1, listeningValue)));
          }

          staticBarsRef.current = newBars;
          needsRedrawRef.current = true;
        }
      }

      // Only redraw if needed
      if (!needsRedrawRef.current && !active) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      needsRedrawRef.current = active;
      ctx.clearRect(0, 0, rect.width, rect.height);

      const computedBarColor =
        barColor ||
        (() => {
          const style = getComputedStyle(canvas);
          // Try to get the computed color value directly
          const color = style.color;
          return color || "#000";
        })();

      const step = barWidth + barGap;
      const barCount = Math.floor(rect.width / step);
      const centerY = rect.height / 2;

      // Draw bars based on mode
      if (mode === "static") {
        // Static mode - bars in fixed positions
        const dataToRender = processing
          ? staticBarsRef.current
          : active
            ? staticBarsRef.current
            : staticBarsRef.current.length > 0
              ? staticBarsRef.current
              : [];

        for (let i = 0; i < barCount && i < dataToRender.length; i++) {
          const value = dataToRender[i] || 0.1;
          const x = i * step;
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = computedBarColor;
          ctx.globalAlpha = 0.4 + value * 0.6;

          if (barRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      } else {
        // Scrolling mode - original behavior
        for (let i = 0; i < barCount && i < historyRef.current.length; i++) {
          const dataIndex = historyRef.current.length - 1 - i;
          const value = historyRef.current[dataIndex] || 0.1;
          const x = rect.width - (i + 1) * step;
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = computedBarColor;
          ctx.globalAlpha = 0.4 + value * 0.6;

          if (barRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      }

      // Apply edge fading
      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        // Cache gradient if width hasn't changed
        if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
          const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
          const fadePercent = Math.min(0.3, fadeWidth / rect.width);

          // destination-out: removes destination where source alpha is high
          // We want: fade edges out, keep center solid
          // Left edge: start opaque (1) = remove, fade to transparent (0) = keep
          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(fadePercent, "rgba(255,255,255,0)");
          // Center stays transparent = keep everything
          gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)");
          // Right edge: fade from transparent (0) = keep to opaque (1) = remove
          gradient.addColorStop(1, "rgba(255,255,255,1)");

          gradientCacheRef.current = gradient;
          lastWidthRef.current = rect.width;
        }

        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = gradientCacheRef.current;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    audio,
    active,
    processing,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    mode,
  ]);

  return (
    <div
      className={className}
      ref={containerRef}
      style={{
        position: "relative",
        height: heightStyle,
        width: "100%",
        ...style,
      }}
      aria-label={
        active
          ? "Live audio waveform"
          : processing
            ? "Processing audio"
            : "Audio waveform idle"
      }
      role="img"
      {...props}
    >
      {!active && !processing && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            borderTop: "2px dotted rgba(128, 128, 128, 0.2)",
          }}
        />
      )}
      <canvas
        style={{ display: "block", height: "100%", width: "100%" }}
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  );
}
