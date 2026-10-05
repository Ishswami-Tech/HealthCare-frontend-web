"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pill, SectionTitle } from "@/components/tbd";
import { formatDateInIST } from "@/lib/utils/date-time";
import { SPECIAL_CASE_OPTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import { useUpdatePatient } from "@/hooks/query/usePatients";
import { useStableSnapshot } from "./use-stable-snapshot";
import { patientVisitKeys, useUpdatePatientVisit } from "@/hooks/query/usePatientVisits";
import type {
  PatientVisit,
  SpecialCaseFlag,
  VisitPatientSummary,
} from "@/types/patient-visit.types";
import {
  CaseSheetCard,
  ChoiceChip,
  FactTile,
  FieldLabel,
  GroupLabel,
  SaveButton,
} from "./case-sheet-parts";

interface BasicDetailsPanelProps {
  clinicId: string;
  visit: PatientVisit;
  patient: VisitPatientSummary | null;
}

const DEMOGRAPHIC_FIELDS = [
  { key: "address", label: "Address" },
  { key: "area", label: "Area" },
  { key: "district", label: "District" },
  { key: "occupation", label: "Occupation" },
  { key: "organization", label: "Organization" },
] as const;

type DemographicKey = (typeof DEMOGRAPHIC_FIELDS)[number]["key"];

export type BasicDetailsDemographics = Record<DemographicKey, string>;

export interface BasicDetailsVisitInput {
  specialCaseFlags: SpecialCaseFlag[];
  internationalId: string | null;
  presentIllness: string | null;
}

function computeAge(dateOfBirth: string | null, age: number | null): string {
  if (age) return `${age} y`;
  if (!dateOfBirth) return "-";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "-";
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1;
  return `${years} y`;
}

export interface BasicDetailsPanelViewProps {
  visit: PatientVisit;
  patient: VisitPatientSummary | null;
  /** Saves the patient's address details. Resolves true when saved. */
  onSaveDemographics: (demographics: BasicDetailsDemographics) => Promise<boolean>;
  isSavingDemographics: boolean;
  /** Saves the details of this OPD visit. Resolves true when saved. */
  onSaveVisit: (input: BasicDetailsVisitInput) => Promise<boolean>;
  isSavingVisit: boolean;
}

/** Layout and draft state of Basic Details. Data and saving come in through props. */
export function BasicDetailsPanelView({
  visit,
  patient,
  onSaveDemographics,
  isSavingDemographics,
  onSaveVisit,
  isSavingVisit,
}: BasicDetailsPanelViewProps) {
  const [editing, setEditing] = useState(false);
  const [demographics, setDemographics] = useState<BasicDetailsDemographics>({
    address: "",
    area: "",
    district: "",
    occupation: "",
    organization: "",
  });
  const [flags, setFlags] = useState<SpecialCaseFlag[]>(visit.specialCaseFlags);
  const [internationalId, setInternationalId] = useState(visit.internationalId ?? "");
  const [presentIllness, setPresentIllness] = useState(visit.presentIllness ?? "");
  const [visitDirty, setVisitDirty] = useState(false);

  // Snapshots so a background refetch with identical data doesn't reset the drafts.
  const savedDemographics = useStableSnapshot<BasicDetailsDemographics>({
    address: patient?.address ?? "",
    area: patient?.area ?? "",
    district: patient?.district ?? "",
    occupation: patient?.occupation ?? "",
    organization: patient?.organization ?? "",
  });
  const savedVisitDetails = useStableSnapshot({
    specialCaseFlags: visit.specialCaseFlags,
    internationalId: visit.internationalId ?? "",
    presentIllness: visit.presentIllness ?? "",
  });

  useEffect(() => {
    setDemographics(savedDemographics);
  }, [savedDemographics]);

  useEffect(() => {
    setFlags(savedVisitDetails.specialCaseFlags);
    setInternationalId(savedVisitDetails.internationalId);
    setPresentIllness(savedVisitDetails.presentIllness);
    setVisitDirty(false);
  }, [savedVisitDetails]);

  const saveDemographics = async () => {
    // On failure the form stays open so the user can retry without losing edits.
    if (await onSaveDemographics(demographics)) setEditing(false);
  };

  const saveVisit = async () => {
    const saved = await onSaveVisit({
      specialCaseFlags: flags,
      internationalId: internationalId.trim() || null,
      presentIllness: presentIllness.trim() || null,
    });
    if (saved) setVisitDirty(false);
  };

  const toggleFlag = (flag: SpecialCaseFlag) => {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
    setVisitDirty(true);
  };

  return (
    <CaseSheetCard
      title="Basic Details"
      description={
        <>
          OPD <b className="font-bold text-ink">{visit.opdNumber}</b> · registered{" "}
          {formatDateInIST(visit.registrationDate)}
        </>
      }
      action={
        editing ? (
          <>
            <Button variant="outline" className="h-[38px] px-3.5 has-[>svg]:px-3.5" onClick={() => setEditing(false)}>
              <X aria-hidden="true" />
              Cancel
            </Button>
            <Button
              className="h-[38px] px-3.5 has-[>svg]:px-3.5"
              onClick={() => void saveDemographics()}
              disabled={isSavingDemographics}
            >
              <Save aria-hidden="true" />
              {isSavingDemographics ? "Saving..." : "Save"}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className="h-[38px] px-3.5 has-[>svg]:px-3.5"
            onClick={() => setEditing(true)}
            disabled={!patient}
          >
            <Pencil aria-hidden="true" />
            Edit details
          </Button>
        )
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <FactTile label="Name" value={patient?.name ?? "-"} />
        <FactTile label="Mobile" value={patient?.phone ?? "-"} />
        <FactTile
          label="Age / Gender"
          value={`${computeAge(patient?.dateOfBirth ?? null, patient?.age ?? null)}${patient?.gender ? ` · ${patient.gender}` : ""}`}
        />
        <FactTile label="Email" value={patient?.email ?? "-"} />
      </div>

      {editing ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOGRAPHIC_FIELDS.map((field) => (
            <div key={field.key} className="flex min-w-0 flex-col gap-1.5">
              <FieldLabel htmlFor={`demo-${field.key}`}>{field.label}</FieldLabel>
              <Input
                id={`demo-${field.key}`}
                value={demographics[field.key]}
                onChange={(event) =>
                  setDemographics((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {DEMOGRAPHIC_FIELDS.map((field) => (
            <FactTile key={field.key} label={field.label} value={patient?.[field.key] ?? "-"} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-[#fbfdfc] p-[18px] dark:bg-white/[0.03]">
        <SectionTitle
          title="This visit"
          description="Details that apply to this OPD visit only"
          action={
            <SaveButton
              label="Save visit"
              saving={isSavingVisit}
              disabled={isSavingVisit || !visitDirty}
              onClick={() => void saveVisit()}
            />
          }
        />
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
            <FieldLabel htmlFor="visit-international-id">International ID</FieldLabel>
            <Input
              id="visit-international-id"
              placeholder="Passport / foreign ID"
              value={internationalId}
              onChange={(event) => {
                setInternationalId(event.target.value);
                setVisitDirty(true);
              }}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel htmlFor="visit-present-illness">Present illness</FieldLabel>
            <Textarea
              id="visit-present-illness"
              rows={2}
              className="min-h-16"
              placeholder="Why the patient came today"
              value={presentIllness}
              onChange={(event) => {
                setPresentIllness(event.target.value);
                setVisitDirty(true);
              }}
            />
          </div>
        </div>
        {visit.doctorId ? (
          <div>
            <Pill tone="green" dot>
              Assigned doctor set
            </Pill>
          </div>
        ) : null}
      </div>
    </CaseSheetCard>
  );
}

export function BasicDetailsPanel({ clinicId, visit, patient }: BasicDetailsPanelProps) {
  const queryClient = useQueryClient();
  // Demographics live on the User row but are edited by clinic staff, so they go
  // through the staff-facing, clinic-scoped PUT /patients/:userId route (the
  // /user/:id route only allows self-updates).
  const updatePatient = useUpdatePatient();
  const updateVisit = useUpdatePatientVisit();

  const saveDemographics = async (demographics: BasicDetailsDemographics) => {
    if (!patient?.userId) return false;
    try {
      await updatePatient.mutateAsync({ patientId: patient.userId, updates: demographics });
      await queryClient.invalidateQueries({ queryKey: patientVisitKeys.caseSheet(clinicId, visit.id) });
      return true;
    } catch {
      // The mutation hook already surfaces the error toast; the form stays open
      // so the user can retry without losing their edits.
      return false;
    }
  };

  const saveVisit = async (input: BasicDetailsVisitInput) => {
    try {
      await updateVisit.mutateAsync({ clinicId, visitId: visit.id, input });
      return true;
    } catch {
      // Error toast is shown by the mutation hook; keep the unsaved edits.
      return false;
    }
  };

  return (
    <BasicDetailsPanelView
      visit={visit}
      patient={patient}
      onSaveDemographics={saveDemographics}
      isSavingDemographics={updatePatient.isPending}
      onSaveVisit={saveVisit}
      isSavingVisit={updateVisit.isPending}
    />
  );
}
