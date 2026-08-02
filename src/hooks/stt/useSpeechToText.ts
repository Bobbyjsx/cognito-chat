"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Analytics } from "@/lib/analytics";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

// Check support once at module level (safe for SSR — runs only when imported client-side)
function checkSpeechSupport(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export const isSpeechRecognitionSupported = checkSpeechSupport();

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Separate stream used only for the visualizer — acquired AFTER recognition starts
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // "aborted" fires when we call stop() ourselves — not a real error
      if (event.error === "aborted") return;

      console.error("Speech recognition error:", event.error);
      Analytics.captureError(
        new Error(`Speech recognition error: ${event.error}`),
      );
      setError(event.error);
      setIsListening(false);
      setMediaStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };

    recognition.onend = () => {
      setIsListening(false);
      setMediaStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };

    return () => {
      recognition.abort();
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    setError(null);
    setTranscript("");

    try {
      // Start recognition first — it manages its own mic access
      recognitionRef.current.start();
      setIsListening(true);

      // Then acquire a separate stream purely for the visualizer
      // This will reuse the same mic track the browser already opened
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
    } catch (err: unknown) {
      console.error("Error starting speech recognition:", err);
      Analytics.captureError(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
      // Clean up if visualizer stream acquisition failed
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
    setMediaStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    error,
    mediaStream,
    startListening,
    stopListening,
    resetTranscript,
  };
}
