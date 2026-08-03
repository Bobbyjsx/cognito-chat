"use client";

import { useEffect, useRef, useState } from "react";
import { LiveAudioVisualizer } from "./LiveAudioVisualizer";

interface AudioVisualizerProps {
  mediaRecorder: MediaRecorder | null;
  className?: string;
  barColor?: string;
  height?: number;
}

export function AudioVisualizer({
  mediaRecorder,
  className = "",
  barColor = "rgb(59, 130, 246)",
  height = 32,
}: AudioVisualizerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Measure the container so the canvas is crisp (react-audio-visualize
  // renders bars from the attribute size, so we feed it real pixels).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(Math.floor(el.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`h-8 w-full min-w-0 ${className}`}
      aria-hidden
    >
      {mediaRecorder && width > 0 && (
        <LiveAudioVisualizer
          mediaRecorder={mediaRecorder}
          width={width}
          height={height}
          barWidth={3}
          gap={2}
          barColor={barColor}
          backgroundColor="transparent"
          fftSize={128}
          minDecibels={-90}
          maxDecibels={-10}
          smoothingTimeConstant={0.4}
        />
      )}
    </div>
  );
}
