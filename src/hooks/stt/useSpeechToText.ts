"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Analytics } from "@/lib/analytics";
import { api } from "@/lib/axios";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

export type SttMode = "browser" | "ai";

// Check support once at module level (safe for SSR — runs only when imported client-side)
function checkSpeechSupport(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export const isSpeechRecognitionSupported = checkSpeechSupport();

/** Send recorded audio to the backend Gemini STT endpoint. */
async function transcribeAudio(
  audioBlob: Blob,
  mimeType: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("mime_type", mimeType);
  const { data } = await api.post<{ transcript: string }>(
    "/stt/transcribe",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data.transcript;
}

const SUPPORTED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

export function useSpeechToText(mode: SttMode = "browser") {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Separate stream used only for the visualizer — acquired AFTER recording starts
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  // Active (recording) MediaRecorder exposed to the visualizer.
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  /** Stops every track on the shared mic stream so the mic is never left open. */
  const releaseMediaStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMediaStream(null);
    setMediaRecorder(null);
  }, []);

  const stopRecorder = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {}
    }
  }, []);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  // ---------------------------------------------------------------------------
  // Browser Web Speech API setup
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (mode !== "browser" || !isSpeechRecognitionSupported) return;

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
      releaseMediaStream();
    };

    recognition.onend = () => {
      setIsListening(false);
      releaseMediaStream();
    };

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, [mode, releaseMediaStream]);

  // ---------------------------------------------------------------------------
  // Lifecycle cleanup — close mic on unmount / page leave, cancel, or done
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const teardown = () => {
      stopRecognition();
      stopRecorder();
      releaseMediaStream();
    };

    const onPageHide = () => {
      try {
        recognitionRef.current?.abort();
      } catch {}
      teardown();
    };

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      teardown();
    };
  }, [releaseMediaStream, stopRecognition, stopRecorder]);

  const handleStartError = useCallback(
    (err: unknown) => {
      console.error("Error starting speech recognition:", err);
      Analytics.captureError(err);
      setError(err instanceof Error ? err.message : String(err));
      stopRecognition();
      releaseMediaStream();
      setIsListening(false);
    },
    [releaseMediaStream, stopRecognition],
  );

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");

    if (mode === "browser") {
      if (!recognitionRef.current) return;
      try {
        // Start recognition first — it manages its own mic access
        recognitionRef.current.start();
        setIsListening(true);

        // Then acquire a separate stream purely for the visualizer
        // This will reuse the same mic track the browser already opened
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        setMediaStream(stream);

        // Start a discardable recorder on that stream — react-audio-visualize's
        // LiveAudioVisualizer only animates while the recorder is "recording".
        const visualizerRecorder = new MediaRecorder(stream);
        recorderRef.current = visualizerRecorder;
        setMediaRecorder(visualizerRecorder);
        visualizerRecorder.start();
      } catch (err: unknown) {
        handleStartError(err);
      }
      return;
    }

    // AI mode — record locally, transcribe on the backend
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMediaStream(stream);

      const mimeType =
        SUPPORTED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ??
        "";
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;
      setMediaRecorder(recorder);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      setIsListening(true);
    } catch (err: unknown) {
      handleStartError(err);
    }
  }, [mode, handleStartError]);

  const stopListening = useCallback(
    async (discard = false): Promise<string | undefined> => {
      if (mode === "browser") {
        stopRecognition();
        stopRecorder();
        setIsListening(false);
        releaseMediaStream();
        return undefined;
      }

      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsListening(false);
        releaseMediaStream();
        return undefined;
      }

      try {
        const audio = await new Promise<Blob>((resolve, reject) => {
          const onStop = () => {
            resolve(
              new Blob(chunksRef.current, {
                type: recorder.mimeType || "audio/webm",
              }),
            );
          };
          recorder.addEventListener("stop", onStop, { once: true });
          try {
            recorder.stop();
          } catch (err) {
            reject(err);
          }
        });

        setIsListening(false);
        releaseMediaStream();

        if (discard) return undefined;

        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(
            audio,
            recorder.mimeType || "audio/webm",
          );
          setTranscript(text);
          return text;
        } finally {
          setIsTranscribing(false);
        }
      } catch (err: unknown) {
        console.error("Error stopping speech recognition:", err);
        setIsListening(false);
        releaseMediaStream();
        return undefined;
      }
    },
    [mode, releaseMediaStream, stopRecognition, stopRecorder],
  );

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    isTranscribing,
    transcript,
    error,
    mediaStream,
    mediaRecorder,
    startListening,
    stopListening,
    resetTranscript,
  };
}
