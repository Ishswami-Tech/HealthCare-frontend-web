"use client";

import { runSave } from "./run-save";
import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { PRAKRITI_QUESTIONS, type PrakritiDosha } from "@/lib/constants/case-sheet-fixed-lists";
import { useCreatePrakritiAssessment, usePrakritiAssessments } from "@/hooks/query/usePatientVisits";

interface PrakritiAssessmentPanelProps {
  clinicId: string;
  patientId: string;
}

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

export function PrakritiAssessmentPanel({ clinicId, patientId }: PrakritiAssessmentPanelProps) {
  const query = usePrakritiAssessments(clinicId, patientId);
  const create = useCreatePrakritiAssessment();
  const [answers, setAnswers] = useState<Record<string, PrakritiDosha>>({});
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const latest = query.data?.[0] ?? null;
  const answeredCount = Object.keys(answers).length;
  const complete = answeredCount === PRAKRITI_QUESTIONS.length;

  const liveTally = useMemo(() => {
    const tally = { V: 0, P: 0, K: 0 };
    for (const value of Object.values(answers)) tally[value] += 1;
    return tally;
  }, [answers]);

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
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">प्रकृति (Prakruti)</CardTitle>
          <p className="text-sm text-muted-foreground">
            {latest
              ? `${latest.primaryDosha}${latest.secondaryDosha ? `–${latest.secondaryDosha}` : ""} · assessed ${formatDateInIST(latest.assessedAt)}`
              : query.isPending
                ? "Loading…"
                : "Not assessed yet"}
          </p>
        </div>
        {showForm ? (
          <Button size="sm" onClick={() => void handleSave()} disabled={!complete || create.isPending}>
            <Save className="mr-1 size-4" />
            {create.isPending ? "Saving..." : `Save (${answeredCount}/${PRAKRITI_QUESTIONS.length})`}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            {latest ? "Re-assess" : "Assess now"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        {latest ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Vata", latest.vataScore],
              ["Pitta", latest.pittaScore],
              ["Kapha", latest.kaphaScore],
            ].map(([label, score]) => (
              <div key={String(label)} className="rounded-xl border border-border/70 bg-background/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{score}</p>
              </div>
            ))}
          </div>
        ) : null}

        {showForm ? (
          <div className="flex flex-col gap-y-3">
            <div className="flex gap-2">
              {(["V", "P", "K"] as PrakritiDosha[]).map((dosha) => (
                <Badge key={dosha} variant="outline" className="rounded-md">
                  {DOSHA_LABEL[dosha]} {liveTally[dosha]}
                </Badge>
              ))}
            </div>
            {PRAKRITI_QUESTIONS.map((question) => (
              <div key={question.key} className="rounded-xl border border-border/70 bg-background/60 p-3">
                <p className="mb-2 text-sm font-semibold text-foreground">{question.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {question.options.map((option) => {
                    const active = answers[question.key] === option.dosha;
                    return (
                      <button
                        key={option.dosha}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [question.key]: option.dosha }))
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/70 bg-background text-foreground hover:bg-muted",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes"
              rows={2}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
