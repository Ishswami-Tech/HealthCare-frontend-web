"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Mic, MicOff, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  DICTATION_LANGUAGES,
  DICTATION_PRIVACY_NOTICE,
  useSpeechRecognition,
  type DictationLanguage,
} from "@/hooks/utils/useSpeechRecognition";
import type { Medicine } from "@/types/pharmacy.types";
import { createMedicationRow, type PrescriptionMedicationRow } from "./rx-form.logic";
import { describeParsedLine, parseSpokenPrescription, type ParsedVoiceLine } from "./voice-parse";
import { kitForPhrase, type RxKit } from "./rx-shortcuts.logic";

const UNSUPPORTED_TITLE = "Voice typing is not available in this browser. Type instead.";

/**
 * Mic button for a text field (diagnosis, complaint, advice): press, speak, press again; the words
 * are handed to `onText` to append. Disabled with an explanation where the browser cannot dictate.
 */
export function DictationButton({
  onText,
  language = "en-IN",
  label = "Dictate",
  className,
}: {
  onText: (text: string) => void;
  language?: DictationLanguage;
  label?: string;
  className?: string;
}) {
  const speech = useSpeechRecognition(language);
  const wasListening = useRef(false);
  const { listening, finalText, reset } = speech;

  // When listening stops, hand over what was heard once.
  useEffect(() => {
    if (wasListening.current && !listening) {
      if (finalText.trim()) onText(finalText.trim());
      reset();
    }
    wasListening.current = listening;
  }, [finalText, listening, onText, reset]);

  return (
    <span className={cn("inline-flex flex-col items-end gap-1", className)}>
      <Button
        type="button"
        variant={listening ? "default" : "outline"}
        size="sm"
        disabled={!speech.supported}
        title={speech.supported ? undefined : UNSUPPORTED_TITLE}
        aria-pressed={listening}
        aria-label={listening ? "Stop dictation" : label}
        onClick={() => (listening ? speech.stop() : speech.start(language))}
        className="rounded-xl"
      >
        {speech.supported ? (
          listening ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />
        ) : (
          <MicOff aria-hidden="true" />
        )}
        {listening ? "Stop" : label}
      </Button>
      {speech.supported ? <span className="text-[11px] text-ink-muted">{DICTATION_PRIVACY_NOTICE}</span> : null}
      {listening && speech.interimText ? (
        <span className="max-w-[280px] truncate text-[11px] italic text-ink-muted" aria-live="polite">
          {speech.interimText}
        </span>
      ) : null}
      {speech.error ? (
        <span className="max-w-[280px] text-[11px] font-semibold text-[#be123c] dark:text-rose-300" role="alert">
          {speech.error}
        </span>
      ) : null}
    </span>
  );
}

function confidenceTone(confidence: number): "green" | "amber" | "rose" {
  if (confidence >= 0.75) return "green";
  if (confidence >= 0.5) return "amber";
  return "rose";
}

type VoiceMedicineOptions = {
  medicines: readonly Medicine[];
  kits: readonly RxKit[];
  disabled?: boolean;
  onAddRows: (rows: PrescriptionMedicationRow[]) => void;
  onAddKit: (kit: RxKit) => void;
};

/**
 * Speak whole medicine lines ("Paracetamol 650, twice a day after food, five days, next ...").
 * Heard lines are matched to the stock list and shown for confirmation; nothing is added until the
 * doctor presses Add. Saying a kit's phrase offers that kit.
 *
 * Returns two pieces so the screen can place them: `controls` (mic + language toggle, compact enough
 * to sit inside the medicine search box) and `panel` (what was heard, shown under the search box).
 */
export function useVoiceMedicineInput({
  medicines,
  kits,
  disabled = false,
  onAddRows,
  onAddKit,
}: VoiceMedicineOptions): { controls: ReactNode; panel: ReactNode; supported: boolean } {
  const [language, setLanguage] = useState<DictationLanguage>("en-IN");
  const speech = useSpeechRecognition(language);
  const [dismissed, setDismissed] = useState<Set<number>>(() => new Set());

  const lines = useMemo(() => parseSpokenPrescription(speech.finalText, medicines), [medicines, speech.finalText]);
  const kit = useMemo(() => kitForPhrase(speech.finalText, kits), [kits, speech.finalText]);
  const pending = lines.filter((line, index) => line.medicine && !dismissed.has(index));

  const rowOf = (line: ParsedVoiceLine) =>
    createMedicationRow(line.medicine ?? undefined, {
      ...(line.dosage ? { dosage: line.dosage } : {}),
      ...(line.frequency ? { frequency: line.frequency } : {}),
      ...(line.days ? { days: line.days } : {}),
    });

  const addLine = (index: number) => {
    const line = lines[index];
    if (!line?.medicine) return;
    onAddRows([rowOf(line)]);
    setDismissed((current) => new Set(current).add(index));
  };
  const addAll = () => {
    onAddRows(pending.map(rowOf));
    speech.reset();
    setDismissed(new Set());
  };

  if (!speech.supported) {
    return {
      supported: false,
      controls: (
        <span
          className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted"
          title="Voice prescribing needs Chrome, Edge or Safari. Type the medicine name instead."
          aria-label="Voice prescribing is not available in this browser"
          role="img"
        >
          <MicOff className="size-4" aria-hidden="true" />
        </span>
      ),
      panel: null,
    };
  }

  const heard = `${speech.finalText} ${speech.interimText}`.trim();
  const showPanel = speech.listening || heard !== "" || speech.error;

  const controls = (
    <>
      <span className="inline-flex items-center rounded-lg bg-well p-0.5" role="group" aria-label="Voice language">
        {DICTATION_LANGUAGES.map((option) => (
          <button
            key={option.value}
            type="button"
            title={option.name}
            aria-pressed={language === option.value}
            disabled={speech.listening}
            onClick={(event) => {
              event.preventDefault();
              setLanguage(option.value);
            }}
            className={cn(
              "h-7 rounded-md px-2 text-[11px] font-bold transition-colors disabled:opacity-60",
              language === option.value ? "bg-card text-brand shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={speech.listening}
        aria-label={speech.listening ? "Stop listening" : "Speak medicines"}
        title={speech.listening ? "Stop listening" : "Speak medicines"}
        onClick={(event) => {
          event.preventDefault();
          if (speech.listening) {
            speech.stop();
          } else {
            setDismissed(new Set());
            speech.start(language);
          }
        }}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
          speech.listening
            ? "bg-[#e11d48] text-white shadow-sm"
            : "bg-mint-soft text-brand hover:bg-brand hover:text-white dark:bg-emerald-950/40",
        )}
      >
        {speech.listening ? <Square className="size-3.5" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
      </button>
    </>
  );

  const panel = showPanel ? (
    <section
      aria-label="Voice prescription"
      className="flex flex-col gap-2.5 rounded-[14px] border border-[#a7f3d0] bg-[#f0fdf8] p-3 dark:border-emerald-800 dark:bg-emerald-950/20"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.5px] text-brand-dark">
          {speech.listening ? <span className="tbd-pulse size-2 rounded-full bg-[#e11d48]" aria-hidden="true" /> : null}
          {speech.listening ? "Listening" : "Heard"}
        </span>
        <button
          type="button"
          aria-label="Clear what was heard"
          className="inline-flex size-7 items-center justify-center rounded-lg text-ink-muted hover:bg-well hover:text-ink"
          onClick={() => {
            speech.reset();
            setDismissed(new Set());
          }}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <p className="m-0 text-sm text-ink" aria-live="polite">
        {heard || "Say a medicine, how often and for how many days. Say “next” before the next medicine."}
      </p>
      {speech.error ? (
        <span className="text-xs font-semibold text-[#be123c] dark:text-rose-300" role="alert">
          {speech.error}
        </span>
      ) : null}

      {kit ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-line bg-card px-3 py-2">
          <span className="text-[13px] font-bold text-ink">
            {kit.name} <span className="font-medium text-ink-muted">· {kit.items.length} medicines</span>
          </span>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onAddKit(kit)}>
            Add kit
          </Button>
        </div>
      ) : null}

      {lines.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {lines.map((line, index) =>
            dismissed.has(index) ? null : (
              <li
                key={`${index}-${line.text}`}
                className="flex flex-wrap items-center gap-2 rounded-[12px] border border-line bg-card px-3 py-2"
              >
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink">
                  {line.medicine ? describeParsedLine(line) : (
                    <span className="text-ink-muted">Not found in stock: “{line.text}”. Search it by name instead.</span>
                  )}
                </span>
                {line.medicine ? (
                  <>
                    <Pill tone={confidenceTone(line.confidence)}>{Math.round(line.confidence * 100)}% match</Pill>
                    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => addLine(index)}>
                      <Check aria-hidden="true" />
                      Add
                    </Button>
                  </>
                ) : null}
              </li>
            ),
          )}
        </ul>
      ) : null}

      {pending.length > 1 ? (
        <Button type="button" size="sm" disabled={disabled || speech.listening} onClick={addAll} className="self-start">
          Add all {pending.length}
        </Button>
      ) : null}
      <span className="text-[11px] text-ink-muted">Nothing is added until you confirm. Check each line before saving.</span>
    </section>
  ) : null;

  return { supported: true, controls, panel };
}

/** Stand-alone voice block (mic row + heard panel) for screens without a search box. */
export function VoiceMedicinePanel(props: VoiceMedicineOptions) {
  const { controls, panel, supported } = useVoiceMedicineInput(props);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {controls}
        {supported ? <span className="text-[11px] text-ink-muted">{DICTATION_PRIVACY_NOTICE}</span> : null}
      </div>
      {panel}
    </div>
  );
}
