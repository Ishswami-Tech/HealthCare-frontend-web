"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FIELD_LABEL, FactTile } from "@/components/tbd";
import { ageInYears, formatDateInIST } from "@/lib/utils/date-time";
import { useUpdatePatient } from "@/hooks/query/usePatients";
import { useStableSnapshot } from "./use-stable-snapshot";
import { patientVisitKeys } from "@/hooks/query/usePatientVisits";
import type {
  PatientVisit,
  VisitPatientSummary,
} from "@/types/patient-visit.types";
import { CaseSheetCard } from "./case-sheet-parts";

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

function computeAge(dateOfBirth: string | null, age: number | null): string {
  if (age) return `${age} y`;
  const years = ageInYears(dateOfBirth);
  return years === null ? "-" : `${years} y`;
}

export interface BasicDetailsPanelViewProps {
  visit: PatientVisit;
  patient: VisitPatientSummary | null;
  /** Saves the patient's address details. Resolves true when saved. */
  onSaveDemographics: (demographics: BasicDetailsDemographics) => Promise<boolean>;
  isSavingDemographics: boolean;
}

/**
 * The patient's registration record (name, contact, demographics): shown as
 * facts, edited one block at a time. This card holds the patient-level basics
 * only — the per-visit details live in the Complaints section's "This visit"
 * card instead.
 */
export function BasicDetailsPanelView({
  visit,
  patient,
  onSaveDemographics,
  isSavingDemographics,
}: BasicDetailsPanelViewProps) {
  const [editing, setEditing] = useState(false);
  const [demographics, setDemographics] = useState<BasicDetailsDemographics>({
    address: "",
    area: "",
    district: "",
    occupation: "",
    organization: "",
  });

  // Snapshots so a background refetch with identical data doesn't reset the drafts.
  const savedDemographics = useStableSnapshot<BasicDetailsDemographics>({
    address: patient?.address ?? "",
    area: patient?.area ?? "",
    district: patient?.district ?? "",
    occupation: patient?.occupation ?? "",
    organization: patient?.organization ?? "",
  });

  useEffect(() => {
    setDemographics(savedDemographics);
  }, [savedDemographics]);

  const saveDemographics = async () => {
    // On failure the form stays open so the user can retry without losing edits.
    if (await onSaveDemographics(demographics)) setEditing(false);
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
              <label htmlFor={`demo-${field.key}`} className={FIELD_LABEL}>{field.label}</label>
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
    </CaseSheetCard>
  );
}

export function BasicDetailsPanel({ clinicId, visit, patient }: BasicDetailsPanelProps) {
  const queryClient = useQueryClient();
  // Demographics live on the User row but are edited by clinic staff, so they go
  // through the staff-facing, clinic-scoped PUT /patients/:userId route (the
  // /user/:id route only allows self-updates).
  const updatePatient = useUpdatePatient();

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

  return (
    <BasicDetailsPanelView
      visit={visit}
      patient={patient}
      onSaveDemographics={saveDemographics}
      isSavingDemographics={updatePatient.isPending}
    />
  );
}
