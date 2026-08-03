"use client";

import { useEffect, useRef } from "react";

interface LiveAudioVisualizerProps {
  mediaRecorder: MediaRecorder;
  width?: number | string;
  height?: number | string;
  barWidth?: number;
  gap?: number;
  backgroundColor?: string;
  barColor?: string;
  fftSize?: number;
  maxDecibels?: number;
  minDecibels?: number;
  smoothingTimeConstant?: number;
}

const DEFAULT_BACKGROUND = "transparent";
const DEFAULT_BAR_COLOR = "rgb(160, 198, 255)";

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
}

export function LiveAudioVisualizer({
  mediaRecorder,
  width = "100%",
  height = "100%",
  barWidth = 2,
  gap = 1,
  backgroundColor = DEFAULT_BACKGROUND,
  barColor = DEFAULT_BAR_COLOR,
  fftSize = 1024,
  maxDecibels = -10,
  minDecibels = -90,
  smoothingTimeConstant = 0.4,
}: LiveAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const attrWidth = typeof width === "number" ? width : 300;
  const attrHeight = typeof height === "number" ? height : 150;
  const styleWidth = typeof width === "number" ? `${width}px` : width;
  const styleHeight = typeof height === "number" ? `${height}px` : height;

  useEffect(() => {
    if (typeof window === "undefined" || !mediaRecorder) return;

    const AudioContextCtor =
      window.AudioContext ??
      (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextCtor) return;

    const audioContext = new AudioContextCtor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    const source = audioContext.createMediaStreamSource(mediaRecorder.stream);
    source.connect(analyser);
    analyserRef.current = analyser;

    return () => {
      analyserRef.current = null;
      dataRef.current = null;
      source.disconnect();
      void audioContext.close();
    };
  }, [mediaRecorder, fftSize, minDecibels, maxDecibels, smoothingTimeConstant]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (backgroundColor && backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (mediaRecorder.state !== "recording") return;
      const analyser = analyserRef.current;
      const data = dataRef.current;
      if (!analyser || !data) return;

      analyser.getByteFrequencyData(data);

      const barStep = barWidth + gap;
      const barCount = Math.max(1, Math.floor(canvas.width / barStep));
      const sampleStep = Math.max(1, Math.floor(data.length / barCount));

      ctx.fillStyle = barColor;
      for (let i = 0; i < barCount; i += 1) {
        const value = data[Math.min(i * sampleStep, data.length - 1)];
        const barHeight = Math.max(3, (value / 255) * canvas.height);
        const x = i * barStep;
        const y = canvas.height - barHeight;
        drawRoundRect(ctx, x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }
    };
    draw();

    return () => cancelAnimationFrame(raf);
  }, [mediaRecorder, barWidth, gap, barColor, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      width={attrWidth}
      height={attrHeight}
      style={{
        width: styleWidth,
        height: styleHeight,
        aspectRatio: "unset",
      }}
      aria-hidden
    />
  );
}
