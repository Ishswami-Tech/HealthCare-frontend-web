"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceChip, FIELD_LABEL } from "@/components/tbd";
import { SPECIAL_CASE_OPTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import type {
  PatientVisit,
  SpecialCaseFlag,
} from "@/types/patient-visit.types";
import { CaseSheetCard, GroupLabel, SaveButton } from "./case-sheet-parts";
import { useStableSnapshot } from "./use-stable-snapshot";
import { runSave } from "./run-save";

/**
 * The details that apply to this OPD visit only: special-case flags, an
 * international ID, and why the patient came today. Shown at the top of the
 * Complaints section, so the doctor lands on the consultation itself.
 *
 * Props only: the save hook lives in the consumer (it knows the clinic id and
 * shares one mutation with the complaint fields below).
 */
interface ThisVisitPanelProps {
  visit: PatientVisit;
  /** Saves the three per-visit fields. `saveVisit` of the owning screen. */
  onSave: (input: {
    specialCaseFlags: SpecialCaseFlag[];
    internationalId: string | null;
    presentIllness: string | null;
  }) => Promise<unknown>;
  isSaving: boolean;
}

export function ThisVisitPanel({ visit, onSave, isSaving }: ThisVisitPanelProps) {
  // Snapshots so a background refetch with identical data doesn't reset the drafts.
  const saved = useStableSnapshot({
    specialCaseFlags: visit.specialCaseFlags,
    internationalId: visit.internationalId ?? "",
    presentIllness: visit.presentIllness ?? "",
  });
  const [flags, setFlags] = useState<SpecialCaseFlag[]>(saved.specialCaseFlags);
  const [internationalId, setInternationalId] = useState(saved.internationalId);
  const [presentIllness, setPresentIllness] = useState(saved.presentIllness);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setFlags(saved.specialCaseFlags);
    setInternationalId(saved.internationalId);
    setPresentIllness(saved.presentIllness);
    setDirty(false);
  }, [saved]);

  const toggleFlag = (flag: SpecialCaseFlag) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag],
    );
    setDirty(true);
  };

  const handleSave = async () => {
    // On failure the panel keeps the drafts so nothing the doctor typed is lost.
    const savedOk = await runSave(() =>
      onSave({
        specialCaseFlags: flags,
        internationalId: internationalId.trim() || null,
        presentIllness: presentIllness.trim() || null,
      }),
    );
    if (savedOk) setDirty(false);
  };

  return (
    <CaseSheetCard
      title="This visit"
      description="Details that apply to this OPD visit only"
      action={
        <SaveButton
          saving={isSaving}
          disabled={isSaving || !dirty}
          onClick={() => void handleSave()}
        />
      }
    >
      <div className="flex flex-col gap-2" role="group" aria-labelledby="visit-special-case">
        <GroupLabel id="visit-special-case">Special case</GroupLabel>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_CASE_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              active={flags.includes(option.value)}
              onClick={() => toggleFlag(option.value)}
            >
              {option.label}
            </ChoiceChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[1fr_2fr]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="visit-international-id" className={FIELD_LABEL}>International ID</label>
          <Input
            id="visit-international-id"
            placeholder="Passport / foreign ID"
            value={internationalId}
            onChange={(event) => {
              setInternationalId(event.target.value);
              setDirty(true);
            }}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="visit-present-illness" className={FIELD_LABEL}>Present illness</label>
          <Textarea
            id="visit-present-illness"
            rows={2}
            className="min-h-16"
            placeholder="Why the patient came today"
            value={presentIllness}
            onChange={(event) => {
              setPresentIllness(event.target.value);
              setDirty(true);
            }}
          />
        </div>
      </div>
    </CaseSheetCard>
  );
}
