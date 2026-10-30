"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogError, FIELD_LABEL } from "@/components/tbd";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { useUpdatePatient } from "@/hooks/query/usePatients";
import { genderLabel } from "../../_components/doctorPatients.logic";
import { useStableSnapshot } from "@/components/patient/case-sheet/use-stable-snapshot";

/** The eight blood groups the EHR accepts. */
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/** The api values `useUpdatePatient` accepts for gender. */
const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
type GenderValue = "" | (typeof GENDERS)[number];

/** The address block, all optional free text (the case sheet's Basic Details edits the same fields). */
const TEXT_FIELDS = [
  { key: "address", label: "Address" },
  { key: "area", label: "Area" },
  { key: "district", label: "District" },
  { key: "occupation", label: "Occupation" },
  { key: "organization", label: "Organization" },
] as const;

/** The dialog's draft: only fields `useUpdatePatient` accepts, all empty until prefilled. */
interface DemographicsDraft {
  dateOfBirth: string;
  gender: GenderValue;
  bloodGroup: string;
  address: string;
  area: string;
  district: string;
  occupation: string;
  organization: string;
}

const EMPTY_DRAFT: DemographicsDraft = {
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  area: "",
  district: "",
  occupation: "",
  organization: "",
};

const asText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

/** A date as a `YYYY-MM-DD` day value (what the date input wants), or "" when unset. */
function dateOnly(value: unknown): string {
  const match = asText(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

/** "Male"/"male"/"OTHER" (any case or separator) → the api value; "" when not one of them. */
function genderValue(value: unknown): GenderValue {
  const cleaned = asText(value).trim().toUpperCase().replace(/[\s_-]/g, "");
  const hit = (GENDERS as readonly string[]).find((g) => g === cleaned);
  return hit ? (hit as GenderValue) : "";
}

/** Prefill the draft from the record (flat, or nested under `user`). */
function draftFrom(patient: Record<string, unknown>): DemographicsDraft {
  const user =
    patient.user && typeof patient.user === "object"
      ? (patient.user as Record<string, unknown>)
      : {};
  const blood = asText(patient.bloodGroup ?? user.bloodGroup).trim().toUpperCase();
  return {
    dateOfBirth: dateOnly(patient.dateOfBirth ?? user.dateOfBirth),
    gender: genderValue(patient.gender ?? user.gender),
    bloodGroup: (BLOOD_GROUPS as readonly string[]).includes(blood) ? blood : "",
    address: asText(patient.address ?? user.address),
    area: asText(patient.area ?? user.area),
    district: asText(patient.district ?? user.district),
    occupation: asText(patient.occupation ?? user.occupation),
    organization: asText(patient.organization ?? user.organization),
  };
}

export interface PatientDemographicsDialogProps {
  open: boolean;
  onClose: () => void;
  /** The patient as the record view knows it: id / userId plus the demographic fields, flat
   * or nested under `user` (the EHR's Raw shape). */
  patient: Record<string, unknown>;
  /** The patient's name, for the title. */
  name: string;
  /** The patient's USER id — that is what `PUT /patients/:id` updates. */
  userId: string;
  /** Called after a successful save, so the caller can refresh the header's own sources. */
  onSaved?: () => void;
}

/**
 * The EHR header's "Edit details" dialog: date of birth, gender, blood group and the
 * address block, edited one save at a time. Saves through `useUpdatePatient` (the same
 * clinic-scoped route as the case sheet's Basic Details), which toasts the result and
 * invalidates the shared patient caches; `onSaved` covers what the header reads on its own.
 */
export function PatientDemographicsDialog({
  open,
  onClose,
  patient,
  name,
  userId,
  onSaved,
}: PatientDemographicsDialogProps) {
  const updatePatient = useUpdatePatient();
  const [draft, setDraft] = useState<DemographicsDraft>(EMPTY_DRAFT);
  const [failure, setFailure] = useState("");

  // The saved values as a stable object: background refetches with identical data must
  // not reset the drafts (the same guard the case-sheet panels use).
  const savedDraft = useStableSnapshot(draftFrom(patient));
  useEffect(() => {
    if (!open) return;
    setDraft(savedDraft);
    setFailure("");
  }, [open, savedDraft]);

  const setField = <Key extends keyof DemographicsDraft>(
    key: Key,
    value: DemographicsDraft[Key],
  ) => setDraft((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    // Empty fields are left out of the payload: the api treats missing as "unchanged",
    // so a blank cannot clear a value (the case sheet's Basic Details works the same way).
    const updates: {
      dateOfBirth?: string;
      gender?: (typeof GENDERS)[number];
      bloodGroup?: string;
      address?: string;
      area?: string;
      district?: string;
      occupation?: string;
      organization?: string;
    } = {};
    if (draft.dateOfBirth) updates.dateOfBirth = draft.dateOfBirth;
    // The draft's gender can be "" (unselected); the api accepts only the three values,
    // so pass it only when it is one of them ("" never becomes a real value in practice —
    // the select either holds a choice or nothing — but the guard keeps the types honest).
    const gender =
      draft.gender === "MALE" || draft.gender === "FEMALE" || draft.gender === "OTHER"
        ? draft.gender
        : undefined;
    if (gender) updates.gender = gender;
    if (draft.bloodGroup) updates.bloodGroup = draft.bloodGroup;
    for (const { key } of TEXT_FIELDS) {
      const value = draft[key].trim();
      if (value) updates[key] = value;
    }
    if (Object.keys(updates).length === 0) {
      // Nothing to send: treat as a no-op save and refresh the sources anyway.
      onSaved?.();
      onClose();
      return;
    }
    try {
      await updatePatient.mutateAsync({ patientId: userId, updates });
      setFailure("");
      onSaved?.();
      onClose();
    } catch (error) {
      // The hook already toasted the failure; keep the dialog open with the draft
      // intact so the user can retry, and name the reason here too.
      setFailure(sanitizeErrorMessage(error) || "We could not save these details.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // While the save is in flight the dialog stays open; otherwise X / Escape /
        // overlay close it.
        if (!next && !updatePatient.isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit patient details</DialogTitle>
          <DialogDescription>
            {name ? `${name} · ` : ""}Date of birth, gender, blood group and address. Leave
            a field empty to keep it unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5" htmlFor="patient-dob">
            <span className={FIELD_LABEL}>Date of birth</span>
            <Input
              id="patient-dob"
              type="date"
              value={draft.dateOfBirth}
              onChange={(event) => setField("dateOfBirth", event.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL} id="patient-gender-label">
                Gender
              </span>
              <Select
                value={draft.gender || undefined}
                onValueChange={(value) => setField("gender", value as GenderValue)}
              >
                <SelectTrigger
                  id="patient-gender"
                  aria-labelledby="patient-gender-label"
                  className="w-full"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {genderLabel(gender)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL} id="patient-blood-label">
                Blood group
              </span>
              <Select
                value={draft.bloodGroup || undefined}
                onValueChange={(value) => setField("bloodGroup", value)}
              >
                <SelectTrigger
                  id="patient-blood-group"
                  aria-labelledby="patient-blood-label"
                  className="w-full"
                >
                  <SelectValue placeholder="Unknown" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
            {TEXT_FIELDS.map((field) => (
              <label
                key={field.key}
                className="flex min-w-0 flex-col gap-1.5"
                htmlFor={`patient-${field.key}`}
              >
                <span className={FIELD_LABEL}>{field.label}</span>
                <Input
                  id={`patient-${field.key}`}
                  value={draft[field.key]}
                  onChange={(event) => setField(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>

          <DialogError message={failure} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updatePatient.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={updatePatient.isPending || !userId}>
            {updatePatient.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            {updatePatient.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface PatientDemographicsEditProps {
  /** The patient as the record view knows it (see the dialog's `patient`). */
  patient: Record<string, unknown>;
  name: string;
  userId: string;
  onSaved?: () => void;
}

/**
 * The "Edit details" trigger of the EHR header band plus the dialog it opens, owned
 * here so the header itself stays a props-only render node.
 */
export function PatientDemographicsEdit({
  patient,
  name,
  userId,
  onSaved,
}: PatientDemographicsEditProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="md"
        className="flex-1 lg:flex-none"
        onClick={() => setOpen(true)}
        disabled={!userId}
      >
        <Pencil aria-hidden="true" />
        Edit details
      </Button>
      <PatientDemographicsDialog
        open={open}
        onClose={() => setOpen(false)}
        patient={patient}
        name={name}
        userId={userId}
        onSaved={onSaved}
      />
    </>
  );
}
