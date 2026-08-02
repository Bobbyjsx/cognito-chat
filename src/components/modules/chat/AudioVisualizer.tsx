"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  mediaStream: MediaStream | null;
  className?: string;
}

export function AudioVisualizer({
  mediaStream,
  className = "",
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mediaStream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let audioContext: AudioContext;
    try {
      audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    } catch (e) {
      console.error("AudioContext not supported", e);
      return;
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64; // Smaller fftSize for fewer, chunkier bars
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    const draw = () => {
      if (!canvas || !ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.5; // Multiply by 1.5 to leave some space
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Normalize the frequency data to canvas height
        const barHeight = (dataArray[i] / 255) * height;

        // Use a nice gradient or primary color for the bars
        ctx.fillStyle = `rgb(59, 130, 246)`; // Tailwind Blue 500 for example, we can use currentColor if we draw differently

        // Draw the bar centered vertically
        const y = (height - barHeight) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - 2, barHeight, 4);
        ctx.fill();

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContext.state !== "closed") {
        audioContext.close();
      }
    };
  }, [mediaStream]);

  return (
    <canvas
      ref={canvasRef}
      className={`h-8 w-full min-w-0 ${className}`}
      width={300}
      height={32}
    />
  );
}
