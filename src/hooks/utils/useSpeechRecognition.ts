"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Dictation through the browser's Web Speech API (Chrome, Edge, Safari). Where the API is missing
 * (Firefox, some in-app browsers) `supported` is false and screens fall back to typing: the mic
 * buttons say so instead of failing.
 *
 * This hook calls no app backend, but the audio does leave the device: Chrome and Edge send it to
 * the browser vendor's cloud speech service (Google / Microsoft) to turn it into text, and Safari
 * may use Apple's servers. Screens offering dictation show `DICTATION_PRIVACY_NOTICE` near the mic.
 */

export type DictationLanguage = "en-IN" | "hi-IN" | "mr-IN";

/** One-line notice shown next to every mic button (the audio goes to the browser's speech service). */
export const DICTATION_PRIVACY_NOTICE = "Dictation uses your browser's speech service";

export const DICTATION_LANGUAGES: readonly { value: DictationLanguage; label: string; name: string }[] = [
  { value: "en-IN", label: "EN", name: "English" },
  { value: "hi-IN", label: "हिं", name: "Hindi" },
  { value: "mr-IN", label: "मराठी", name: "Marathi" },
];

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/** True in browsers that can dictate. */
export function isSpeechRecognitionSupported(): boolean {
  return recognitionConstructor() !== null;
}

const ERROR_TEXT: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow the microphone for this site, or type instead.",
  "service-not-allowed": "Voice typing is switched off in this browser. Type instead.",
  "audio-capture": "No microphone was found. Connect one, or type instead.",
  network: "Voice typing needs an internet connection. Type instead, or try again.",
  "language-not-supported": "This browser cannot understand that language yet. Choose English, or type.",
};

export interface SpeechRecognitionState {
  supported: boolean;
  listening: boolean;
  /** Everything recognised for sure since `start`. */
  finalText: string;
  /** What is being heard right now (changes as the doctor speaks). */
  interimText: string;
  error: string | null;
  start: (language?: DictationLanguage) => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(defaultLanguage: DictationLanguage = "en-IN"): SpeechRecognitionState {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);

  // Read after mount: the server render and the first paint agree (no API on the server).
  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    return () => recognitionRef.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
    setFinalText("");
    setInterimText("");
    setError(null);
  }, []);

  const start = useCallback(
    (language: DictationLanguage = defaultLanguage) => {
      const Constructor = recognitionConstructor();
      if (!Constructor) {
        setError("Voice typing is not available in this browser. Type instead, or open the portal in Chrome or Edge.");
        return;
      }
      recognitionRef.current?.abort();
      const recognition = new Constructor();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let interim = "";
        let confirmed = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (!result) continue;
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) confirmed += text;
          else interim += text;
        }
        if (confirmed) setFinalText((current) => `${current} ${confirmed}`.replace(/\s+/g, " ").trim());
        setInterimText(interim.trim());
      };
      recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        setError(ERROR_TEXT[event.error] ?? "Voice typing stopped. Try again, or type instead.");
      };
      recognition.onend = () => {
        setListening(false);
        setInterimText("");
      };
      recognitionRef.current = recognition;
      setError(null);
      setFinalText("");
      setInterimText("");
      try {
        recognition.start();
        setListening(true);
      } catch {
        setError("Voice typing could not start. Try again, or type instead.");
      }
    },
    [defaultLanguage],
  );

  return { supported, listening, finalText, interimText, error, start, stop, reset };
}
