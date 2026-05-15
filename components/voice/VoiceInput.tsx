"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MicrophoneIcon, ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { COPY } from "@/lib/copy";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type RecordingState = "idle" | "recording" | "processing" | "error";

interface Language {
  code: string;
  label: string;
}

export interface RestructureResult {
  listing: {
    title:              string;
    category:           string;
    description:        string;
    tags:               string[];
    priceRange:         { minPrice: number; maxPrice: number };
    userProvidedPrice?: number;
    currency:           "NGN";
    confidence:         number;
  };
  transcript:            string;
  detectedLanguage?:     string;
  neighbourhoodLabel?:   string;
  coordinates?:          { lat: number; lng: number };
  marketplaceType:       "services";
}

export interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onResult?: (result: RestructureResult) => void;
  coordinates?: { lat: number; lng: number };
  language?: string;
}

const LANGUAGES: Language[] = [
  { code: "yo-NG", label: "Yoruba"  },
  { code: "ig-NG", label: "Igbo"    },
  { code: "ha-NG", label: "Hausa"   },
  { code: "pcm-NG", label: "Pidgin" },
  { code: "en-NG", label: "English" },
];

const SILENCE_THRESHOLD = 12;
const SILENCE_DURATION_MS = 10_000;
const CHECK_INTERVAL_MS = 100;

export function VoiceInput({ onTranscript, onResult, coordinates, language: languageProp }: VoiceInputProps) {  const [state, setState] = useState<RecordingState>("idle");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(languageProp ?? "pcm-NG");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [silenceSeconds, setSilenceSeconds] = useState<number>(0);

  const mediaRecorderRef    = useRef<MediaRecorder | null>(null);
  const chunksRef           = useRef<Blob[]>([]);
  const streamRef           = useRef<MediaStream | null>(null);
  const audioContextRef     = useRef<AudioContext | null>(null);
  const silenceIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceCountRef     = useRef<number>(0);

  const selectedLanguageRef = useRef<string>(selectedLanguage);
  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  useEffect(() => {
    if (languageProp) setSelectedLanguage(languageProp);
  }, [languageProp]);

  const cleanup = useCallback(() => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    silenceCountRef.current = 0;
    setSilenceSeconds(0);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanup();
  }, [cleanup]);

  const stopRecordingRef = useRef(stopRecording);
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  function startSilenceDetection(stream: MediaStream): void {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = ctx;

    const data = new Uint8Array(analyser.frequencyBinCount);
    silenceCountRef.current = 0;

    silenceIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;

      if (avg < SILENCE_THRESHOLD) {
        silenceCountRef.current += CHECK_INTERVAL_MS;
        setSilenceSeconds(Math.floor(silenceCountRef.current / 1000));

        if (silenceCountRef.current >= SILENCE_DURATION_MS) {
          stopRecordingRef.current();
        }
      } else {
        silenceCountRef.current = 0;
        setSilenceSeconds(0);
      }
    }, CHECK_INTERVAL_MS);
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read audio blob"));
      reader.readAsDataURL(blob);
    });
  }

  async function handleAudioReady(blob: Blob, mimeType: string, lang: string): Promise<void> {
    setState("processing");

    try {
      const audio = await blobToBase64(blob);

      const res = await fetch("/api/ai/restructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio,
          language: lang,
          mimeType,
          lat: coordinates?.lat,
          lng: coordinates?.lng,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Server error ${res.status}`);
      }

      const data = await res.json() as RestructureResult;
      if (!data.transcript) throw new Error("No transcript returned from server");

      onTranscript(data.transcript);
      onResult?.(data);

      setState("idle");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setState("error");
    }
  }

  async function startRecording(): Promise<void> {
    setErrorMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Audio recording is not supported on this browser.");
      setState("error");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setErrorMessage("Your device does not support voice recording.");
      setState("error");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setErrorMessage(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone blocked. Allow mic access in your browser and try again."
          : "Cannot access microphone. Check your device settings."
      );
      setState("error");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const lang     = selectedLanguageRef.current;

    streamRef.current  = stream;
    chunksRef.current  = [];

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      void handleAudioReady(blob, mimeType, lang);
    };

    recorder.start(100);
    setState("recording");
    startSilenceDetection(stream);
  }

  function handleMicClick(): void {
    if (state === "idle" || state === "error") {
      void startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
  }

  const silenceProgress     = Math.min((silenceSeconds / 10) * 100, 100);
  const showLanguageSelector = state === "idle" || state === "error";

  const micAriaLabel: Record<RecordingState, string> = {
    idle:       COPY.VOICE.MIC_LABEL_IDLE,
    recording:  COPY.VOICE.MIC_LABEL_RECORDING,
    processing: COPY.VOICE.MIC_LABEL_PROCESSING,
    error:      COPY.VOICE.MIC_LABEL_ERROR,
  };

  const statusText: Record<RecordingState, string> = {
    idle:       COPY.VOICE.IDLE,
    recording:  COPY.VOICE.RECORDING,
    processing: COPY.VOICE.PROCESSING,
    error:      errorMessage || COPY.VOICE.ERROR,
  };

  const buttonColour: Record<RecordingState, string> = {
    idle:       "bg-primary hover:bg-[var(--primary-hover)] active:scale-95",
    recording:  "bg-[var(--negative)] scale-110 hover:bg-[var(--negative-deep)]",
    processing: "bg-muted cursor-not-allowed",
    error:      "bg-[var(--warning)] hover:bg-[var(--warning-deep)] active:scale-95",
  };

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none">

      {showLanguageSelector && (
        <div
          role="group"
          aria-label="Select your language before speaking"
          className="flex gap-2 flex-wrap justify-center"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              aria-pressed={selectedLanguage === lang.code}
              aria-label={`Speak in ${lang.label}`}
              className={[
                "px-3 py-1.5 rounded-full text-sm font-semibold",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                selectedLanguage === lang.code
                  ? "bg-primary text-primary-foreground shadow scale-105"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              ].join(" ")}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative flex items-center justify-center w-32 h-32"
        aria-hidden="false"
      >
        {state === "recording" && (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[var(--negative)] opacity-25 animate-ping"
            />
            <span
              aria-hidden="true"
              className="absolute inset-2 rounded-full bg-[var(--negative)] opacity-15 animate-ping"
              style={{ animationDelay: "300ms" }}
            />
          </>
        )}

        <button
          onClick={handleMicClick}
          disabled={state === "processing"}
          aria-label={micAriaLabel[state]}
          aria-live="polite"
          className={[
            "relative z-10 flex items-center justify-center",
            "w-20 h-20 rounded-full shadow-xl",
            "transition-all duration-300",
            "focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-2",
            buttonColour[state],
          ].join(" ")}
        >
          {state === "processing" && (
            <ArrowPathIcon className="w-9 h-9 text-white animate-spin" aria-hidden="true" />
          )}
          {state === "recording" && (
            <MicrophoneIcon className="w-9 h-9 text-white opacity-50" aria-hidden="true" />
          )}
          {state === "error" && (
            <ExclamationCircleIcon className="w-9 h-9 text-white" aria-hidden="true" />
          )}
          {state === "idle" && (
            <MicrophoneIcon className="w-9 h-9 text-white" aria-hidden="true" />
          )}
        </button>
      </div>

      {state === "recording" && silenceSeconds > 0 && (
        <div className="flex flex-col items-center gap-1 w-44">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              role="progressbar"
              aria-valuenow={silenceSeconds}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-label={`${10 - silenceSeconds} seconds until auto-send`}
              className="h-full bg-[var(--negative)] rounded-full transition-all duration-500"
              style={{ width: `${silenceProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {COPY.VOICE.SILENCE_COUNTDOWN(10 - silenceSeconds)}
          </p>
        </div>
      )}

      <p
        role="status"
        aria-live="polite"
        className={[
          "text-sm font-medium text-center leading-snug max-w-[220px]",
          state === "recording"  ? "text-[var(--negative)]"       : "",
          state === "processing" ? "text-muted-foreground"        : "",
          state === "error"      ? "text-[var(--warning-deep)]"   : "",
          state === "idle"       ? "text-muted-foreground"        : "",
        ].join(" ")}
      >
        {statusText[state]}
      </p>

    </div>
  );
}
