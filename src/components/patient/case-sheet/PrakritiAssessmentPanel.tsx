"use client";

import { runSave } from "./run-save";
import { useId, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Divider, Note, Pill } from "@/components/tbd";
import { formatDateInIST } from "@/lib/utils/date-time";
import { PRAKRITI_QUESTIONS, type PrakritiDosha } from "@/lib/constants/case-sheet-fixed-lists";
import { useCreatePrakritiAssessment, usePrakritiAssessments } from "@/hooks/query/usePatientVisits";
import type { PrakritiAssessment } from "@/types/patient-visit.types";
import {
  ExamEyebrow,
  ExamOptionChip,
  ExamPanel,
  ExamPanelHead,
  ExamSaveButton,
  ExamTile,
} from "./ExamParts";

interface PrakritiAssessmentPanelProps {
  clinicId: string;
  patientId: string;
}

const DOSHAS: readonly PrakritiDosha[] = ["V", "P", "K"];
const DOSHA_LABEL: Record<PrakritiDosha, string> = { V: "Vata", P: "Pitta", K: "Kapha" };

function encodeAnswers(answers: Record<string, PrakritiDosha>): Record<string, number> {
  const encoded: Record<string, number> = {};
  for (const question of PRAKRITI_QUESTIONS) {
    const chosen = answers[question.key];
    encoded[`v_${question.key}`] = chosen === "V" ? 3 : 0;
    encoded[`p_${question.key}`] = chosen === "P" ? 3 : 0;
    encoded[`k_${question.key}`] = chosen === "K" ? 3 : 0;
  }
  return encoded;
}

/** "PITTA" → "Pitta". Anything that is not a plain upper-case code is shown as stored. */
function doshaName(value: string): string {
  return /^[A-Z]+$/.test(value) ? value.charAt(0) + value.slice(1).toLowerCase() : value;
}

export interface PrakritiAssessmentViewProps {
  /** Most recent saved assessment, or null when there is none. */
  latest: PrakritiAssessment | null;
  /** State of the list of earlier assessments. */
  status: "loading" | "error" | "ready";
  onRetry: () => void;
  showForm: boolean;
  onOpenForm: () => void;
  answers: Record<string, PrakritiDosha>;
  onAnswer: (questionKey: string, dosha: PrakritiDosha) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

/** Props-driven layout of the Prakruti panel (no data fetching). */
export function PrakritiAssessmentView({
  latest,
  status,
  onRetry,
  showForm,
  onOpenForm,
  answers,
  onAnswer,
  notes,
  onNotesChange,
  onSave,
  isSaving,
}: PrakritiAssessmentViewProps) {
  const headingId = useId();
  const answeredCount = Object.keys(answers).length;
  const complete = answeredCount === PRAKRITI_QUESTIONS.length;

  const liveTally = useMemo(() => {
    const tally = { V: 0, P: 0, K: 0 };
    for (const value of Object.values(answers)) tally[value] += 1;
    return tally;
  }, [answers]);
  const leading = Math.max(liveTally.V, liveTally.P, liveTally.K);

  const scores: readonly [string, number][] = latest
    ? [
        ["Vata", latest.vataScore],
        ["Pitta", latest.pittaScore],
        ["Kapha", latest.kaphaScore],
      ]
    : [];

  return (
    <ExamPanel labelledBy={headingId}>
      <ExamPanelHead
        id={headingId}
        title="प्रकृति (Prakruti)"
        description={
          latest
            ? `${doshaName(latest.primaryDosha)}${latest.secondaryDosha ? `–${doshaName(latest.secondaryDosha)}` : ""} · assessed ${formatDateInIST(latest.assessedAt)}`
            : status === "loading"
              ? "Loading…"
              : status === "error"
                ? "Earlier assessments could not be loaded"
                : "Not assessed yet"
        }
        aside={
          showForm ? (
            <ExamSaveButton
              onClick={onSave}
              disabled={!complete || isSaving}
              saving={isSaving}
              label={`Save (${answeredCount}/${PRAKRITI_QUESTIONS.length})`}
            />
          ) : (
            <Button variant="outline" className="h-[38px] px-3.5" onClick={onOpenForm}>
              {latest ? "Re-assess" : "Assess now"}
            </Button>
          )
        }
      />

      {latest ? (
        <div className="flex flex-col gap-2">
          <ExamEyebrow>Last assessment</ExamEyebrow>
          <dl className="m-0 grid grid-cols-3 gap-3">
            {scores.map(([label, score]) => (
              <ExamTile key={label} className="gap-1">
                <dt>
                  <ExamEyebrow>{label}</ExamEyebrow>
                </dt>
                <dd className="m-0 truncate text-2xl font-extrabold leading-tight text-ink">{score}</dd>
              </ExamTile>
            ))}
          </dl>
        </div>
      ) : status === "loading" ? (
        <div className="grid grid-cols-3 gap-3" aria-busy="true" aria-label="Loading the last assessment">
          {DOSHAS.map((dosha) => (
            <Skeleton key={dosha} className="h-[70px] rounded-[14px]" />
          ))}
        </div>
      ) : status === "error" ? (
        <Note tone="rose" icon={AlertTriangle}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>We could not load earlier assessments. You can still record a new one.</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        </Note>
      ) : !showForm ? (
        <Note tone="green">
          No Prakruti assessment yet. Choose “Assess now” and answer {PRAKRITI_QUESTIONS.length} short questions.
        </Note>
      ) : null}

      {showForm ? (
        <>
          {latest || status !== "ready" ? <Divider /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <ExamEyebrow>This assessment</ExamEyebrow>
            {DOSHAS.map((dosha) => (
              <Pill key={dosha} tone={leading > 0 && liveTally[dosha] === leading ? "green" : "slate"}>
                {DOSHA_LABEL[dosha]} {liveTally[dosha]}
              </Pill>
            ))}
          </div>
          <div className="grid grid-cols-1 items-stretch gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
            {PRAKRITI_QUESTIONS.map((question) => {
              const questionId = `${headingId}-${question.key}`;
              return (
                <ExamTile key={question.key} labelledBy={questionId}>
                  <span id={questionId} className="text-sm font-bold text-ink">
                    {question.label}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option) => (
                      <ExamOptionChip
                        key={option.dosha}
                        size="sm"
                        label={option.label}
                        active={answers[question.key] === option.dosha}
                        onClick={() => onAnswer(question.key, option.dosha)}
                      />
                    ))}
                  </div>
                </ExamTile>
              );
            })}
          </div>
          <Textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Notes"
            aria-label="Notes"
            rows={2}
            className="min-h-16 border-line py-[11px] leading-normal"
          />
        </>
      ) : null}
    </ExamPanel>
  );
}

export function PrakritiAssessmentPanel({ clinicId, patientId }: PrakritiAssessmentPanelProps) {
  const query = usePrakritiAssessments(clinicId, patientId);
  const create = useCreatePrakritiAssessment();
  const [answers, setAnswers] = useState<Record<string, PrakritiDosha>>({});
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const latest = query.data?.[0] ?? null;

  const handleSave = async () => {
    const saved = await runSave(() =>
      create.mutateAsync({
        clinicId,
        input: {
          patientId,
          questionnaireAnswers: encodeAnswers(answers),
          ...(notes.trim() ? { patientNotes: notes.trim() } : {}),
        },
      }),
    );
    if (!saved) return;
    setAnswers({});
    setNotes("");
    setShowForm(false);
  };

  return (
    <PrakritiAssessmentView
      latest={latest}
      status={query.data ? "ready" : query.isPending ? "loading" : query.error ? "error" : "ready"}
      onRetry={() => void query.refetch()}
      showForm={showForm}
      onOpenForm={() => setShowForm(true)}
      answers={answers}
      onAnswer={(questionKey, dosha) => setAnswers((prev) => ({ ...prev, [questionKey]: dosha }))}
      notes={notes}
      onNotesChange={setNotes}
      isSaving={create.isPending}
      onSave={() => void handleSave()}
    />
  );
}
