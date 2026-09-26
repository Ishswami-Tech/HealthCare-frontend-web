"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground" title={value}>
        {value || "-"}
      </p>
    </div>
  );
}

export function BasicDetailsPanel({ clinicId, visit, patient }: BasicDetailsPanelProps) {
  const queryClient = useQueryClient();
  // Demographics live on the User row but are edited by clinic staff, so they go
  // through the staff-facing, clinic-scoped PUT /patients/:userId route (the
  // /user/:id route only allows self-updates).
  const updatePatient = useUpdatePatient();
  const updateVisit = useUpdatePatientVisit();
  const [editing, setEditing] = useState(false);
  const [demographics, setDemographics] = useState<Record<DemographicKey, string>>({
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
  const savedDemographics = useStableSnapshot<Record<DemographicKey, string>>({
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
    if (!patient?.userId) return;
    try {
      await updatePatient.mutateAsync({ patientId: patient.userId, updates: demographics });
      await queryClient.invalidateQueries({ queryKey: patientVisitKeys.caseSheet(clinicId, visit.id) });
      setEditing(false);
    } catch {
      // The mutation hook already surfaces the error toast; keep the form open
      // so the user can retry without losing their edits.
    }
  };

  const saveVisit = async () => {
    try {
      await updateVisit.mutateAsync({
        clinicId,
        visitId: visit.id,
        input: {
          specialCaseFlags: flags,
          internationalId: internationalId.trim() || null,
          presentIllness: presentIllness.trim() || null,
        },
      });
      setVisitDirty(false);
    } catch {
      // Error toast is shown by the mutation hook; keep the unsaved edits.
    }
  };

  const toggleFlag = (flag: SpecialCaseFlag) => {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
    setVisitDirty(true);
  };

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">Basic Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            OPD <span className="font-semibold text-foreground">{visit.opdNumber}</span> · registered{" "}
            {formatDateInIST(visit.registrationDate)}
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              <X className="mr-1 size-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => void saveDemographics()} disabled={updatePatient.isPending}>
              <Save className="mr-1 size-4" />
              {updatePatient.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={!patient}>
            <Pencil className="mr-1 size-4" />
            Edit details
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Name" value={patient?.name ?? "-"} />
          <Field label="Mobile" value={patient?.phone ?? "-"} />
          <Field
            label="Age / Gender"
            value={`${computeAge(patient?.dateOfBirth ?? null, patient?.age ?? null)}${patient?.gender ? ` · ${patient.gender}` : ""}`}
          />
          <Field label="Email" value={patient?.email ?? "-"} />
        </div>

        {editing ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {DEMOGRAPHIC_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-y-1">
                <Label htmlFor={`demo-${field.key}`}>{field.label}</Label>
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
              <Field key={field.key} label={field.label} value={patient?.[field.key] ?? "-"} />
            ))}
          </div>
        )}

        <div className="rounded-xl border border-border/70 bg-background/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">This visit</p>
            <Button size="sm" onClick={() => void saveVisit()} disabled={updateVisit.isPending || !visitDirty}>
              <Save className="mr-1 size-4" />
              {updateVisit.isPending ? "Saving..." : "Save visit"}
            </Button>
          </div>
          <div className="flex flex-col gap-y-3">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Special case
              </p>
              <div className="flex flex-wrap gap-2">
                {SPECIAL_CASE_OPTIONS.map((option) => {
                  const active = flags.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleFlag(option.value)}
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-y-1">
                <Label htmlFor="visit-international-id">International ID</Label>
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
              <div className="flex flex-col gap-y-1">
                <Label htmlFor="visit-present-illness">Present illness</Label>
                <Textarea
                  id="visit-present-illness"
                  rows={2}
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
              <Badge variant="outline" className="w-fit rounded-md text-xs">
                Assigned doctor set
              </Badge>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
