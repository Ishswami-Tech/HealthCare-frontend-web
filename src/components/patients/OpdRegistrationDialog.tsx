"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ClipboardPlus, Search, UserPlus, Users } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SPECIAL_CASE_OPTIONS, FAMILY_RELATION_SUGGESTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import { useDoctorPatients } from "@/hooks/query/useDoctors";
import { useQuickRegisterPatient } from "@/hooks/query/usePatients";
import {
  useCreateFamilyMember,
  useCreatePatientVisit,
  useFamilyMembers,
} from "@/hooks/query/usePatientVisits";
import type { FamilyMember, PatientVisit, SpecialCaseFlag } from "@/types/patient-visit.types";

type PatientRow = {
  id: string;
  userId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  user?: { id?: string; name?: string; firstName?: string; lastName?: string; phone?: string };
};

function extractPatients(value: unknown): PatientRow[] {
  if (Array.isArray(value)) return value as PatientRow[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["patients", "data", "items", "records"]) {
      if (Array.isArray(record[key])) return record[key] as PatientRow[];
    }
  }
  return [];
}

function patientName(row: PatientRow): string {
  return (
    row.name ||
    `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() ||
    row.user?.name ||
    `${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""}`.trim() ||
    "Unknown patient"
  );
}

const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

const EMPTY_NEW_PATIENT = {
  firstName: "",
  lastName: "",
  phone: "",
  gender: "" as "" | (typeof GENDERS)[number],
  dateOfBirth: "",
  address: "",
  area: "",
  district: "",
  occupation: "",
  organization: "",
};

const EMPTY_DEPENDENT = { firstName: "", lastName: "", relation: "", gender: "", dateOfBirth: "", phone: "" };

type Who =
  | { kind: "existing"; patientId: string; label: string }
  | { kind: "dependent"; patientId: string; label: string }
  | { kind: "new" };

interface OpdRegistrationDialogProps {
  clinicId: string;
  trigger?: React.ReactNode;
  onRegistered?: (visit: PatientVisit) => void;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/70 bg-background text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

/**
 * OPD registration: pick an existing patient (or one of their family
 * members), or quick-register a new one, then open a visit with an OPD number.
 */
export function OpdRegistrationDialog({ clinicId, trigger, onRegistered }: OpdRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [who, setWho] = useState<Who | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [newPatient, setNewPatient] = useState(EMPTY_NEW_PATIENT);
  const [showDependentForm, setShowDependentForm] = useState(false);
  const [dependent, setDependent] = useState(EMPTY_DEPENDENT);
  const [presentIllness, setPresentIllness] = useState("");
  const [flags, setFlags] = useState<SpecialCaseFlag[]>([]);
  const [internationalId, setInternationalId] = useState("");

  const patientsQuery = useDoctorPatients(
    clinicId,
    { search: deferredSearch, limit: 8, offset: 0 },
    { enabled: open && !!clinicId && deferredSearch.trim().length >= 2 },
  );
  const results = useMemo(() => extractPatients(patientsQuery.data), [patientsQuery.data]);
  const familyQuery = useFamilyMembers(clinicId, selectedPatient?.id ?? "");
  const register = useQuickRegisterPatient();
  const createVisit = useCreatePatientVisit();
  const createDependent = useCreateFamilyMember();

  const reset = () => {
    setSearch("");
    setWho(null);
    setSelectedPatient(null);
    setNewPatient(EMPTY_NEW_PATIENT);
    setShowDependentForm(false);
    setDependent(EMPTY_DEPENDENT);
    setPresentIllness("");
    setFlags([]);
    setInternationalId("");
  };

  const pickExisting = (row: PatientRow) => {
    setSelectedPatient(row);
    setWho({ kind: "existing", patientId: row.id, label: patientName(row) });
    setShowDependentForm(false);
  };

  const addDependent = async () => {
    if (!selectedPatient) return;
    let created: FamilyMember;
    try {
      created = await createDependent.mutateAsync({
        clinicId,
        input: {
          primaryPatientId: selectedPatient.id,
          firstName: dependent.firstName.trim(),
          lastName: dependent.lastName.trim(),
          relation: dependent.relation.trim(),
          ...(dependent.gender ? { gender: dependent.gender } : {}),
          ...(dependent.dateOfBirth ? { dateOfBirth: dependent.dateOfBirth } : {}),
          ...(dependent.phone.trim() ? { phone: dependent.phone.trim() } : {}),
        },
      });
    } catch {
      return; // Error toast is shown by the mutation hook; keep the form open.
    }
    setDependent(EMPTY_DEPENDENT);
    setShowDependentForm(false);
    if (created.dependentPatientId) {
      setWho({ kind: "dependent", patientId: created.dependentPatientId, label: `${created.name} (${created.relation})` });
    }
  };

  const newPatientValid =
    newPatient.firstName.trim().length > 0 &&
    newPatient.lastName.trim().length > 0 &&
    newPatient.phone.replace(/\D/g, "").length >= 10;
  const canRegister = who?.kind === "new" ? newPatientValid : Boolean(who);
  const busy = register.isPending || createVisit.isPending;

  const submit = async () => {
    if (!who) return;
    const visitDetails = {
      ...(presentIllness.trim() ? { presentIllness: presentIllness.trim() } : {}),
      ...(flags.length > 0 ? { specialCaseFlags: flags } : {}),
      ...(internationalId.trim() ? { internationalId: internationalId.trim() } : {}),
    };

    let visit: PatientVisit;
    try {
      if (who.kind === "new") {
        const digits = newPatient.phone.replace(/\D/g, "");
        const { user } = await register.mutateAsync({
          firstName: newPatient.firstName.trim(),
          lastName: newPatient.lastName.trim(),
          phone: newPatient.phone.trim(),
          password: `Temp@${digits.slice(-4)}Aa`,
          ...(newPatient.gender ? { gender: newPatient.gender } : {}),
          ...(newPatient.dateOfBirth ? { dateOfBirth: newPatient.dateOfBirth } : {}),
          ...(newPatient.address.trim() ? { address: newPatient.address.trim() } : {}),
          ...(newPatient.area.trim() ? { area: newPatient.area.trim() } : {}),
          ...(newPatient.district.trim() ? { district: newPatient.district.trim() } : {}),
          ...(newPatient.occupation.trim() ? { occupation: newPatient.occupation.trim() } : {}),
          ...(newPatient.organization.trim() ? { organization: newPatient.organization.trim() } : {}),
        });
        const userId = String((user as { id?: string; userId?: string })?.id ?? (user as { userId?: string })?.userId ?? "");
        visit = await createVisit.mutateAsync({ clinicId, input: { patientUserId: userId, ...visitDetails } });
      } else {
        visit = await createVisit.mutateAsync({ clinicId, input: { patientId: who.patientId, ...visitDetails } });
      }
    } catch {
      return; // Error toast is shown by the mutation hook; keep the dialog open for retry.
    }
    onRegistered?.(visit);
    setOpen(false);
    reset();
  };

  const field = (
    key: keyof typeof EMPTY_NEW_PATIENT,
    label: string,
    props: Partial<React.ComponentProps<typeof Input>> = {},
  ) => (
    <div className="flex flex-col gap-y-1">
      <Label htmlFor={`opd-${key}`}>{label}</Label>
      <Input
        id={`opd-${key}`}
        value={newPatient[key]}
        onChange={(event) => setNewPatient((prev) => ({ ...prev, [key]: event.target.value }))}
        {...props}
      />
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <ClipboardPlus className="mr-1 size-4" />
          OPD Registration
        </Button>
      )}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>OPD Registration</DialogTitle>
          <DialogDescription>
            Choose who is visiting, then register the visit to get an OPD number.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-y-5">
          <section className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">1 · Who is visiting?</p>
              <Button
                size="sm"
                variant={who?.kind === "new" ? "default" : "outline"}
                onClick={() => {
                  setSelectedPatient(null);
                  setWho({ kind: "new" });
                }}
              >
                <UserPlus className="mr-1 size-4" />
                New patient
              </Button>
            </div>

            {who?.kind === "new" ? (
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-background/60 p-4 md:grid-cols-2">
                {field("firstName", "First name")}
                {field("lastName", "Last name")}
                {field("phone", "Mobile", { placeholder: "+91 98765 43210", inputMode: "tel" })}
                {field("dateOfBirth", "Date of birth", { type: "date" })}
                <div className="flex flex-col gap-y-1">
                  <Label>Gender</Label>
                  <div className="flex gap-2">
                    {GENDERS.map((gender) => (
                      <Chip
                        key={gender}
                        label={gender.charAt(0) + gender.slice(1).toLowerCase()}
                        active={newPatient.gender === gender}
                        onClick={() =>
                          setNewPatient((prev) => ({ ...prev, gender: prev.gender === gender ? "" : gender }))
                        }
                      />
                    ))}
                  </div>
                </div>
                {field("address", "Address")}
                {field("area", "Area")}
                {field("district", "District")}
                {field("occupation", "Occupation")}
                {field("organization", "Organization")}
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search existing patient by name or phone"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                {deferredSearch.trim().length >= 2 ? (
                  <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/70 bg-background/60">
                    {patientsQuery.isPending ? (
                      <p className="p-3 text-sm text-muted-foreground">Searching…</p>
                    ) : results.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No matching patient — use “New patient”.</p>
                    ) : (
                      results.map((row) => {
                        const active = selectedPatient?.id === row.id;
                        return (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => pickExisting(row)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                              active && "bg-primary/10",
                            )}
                          >
                            <span className="font-medium text-foreground">{patientName(row)}</span>
                            <span className="text-xs text-muted-foreground">{row.phone || row.user?.phone || ""}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </>
            )}
          </section>

          {selectedPatient ? (
            <section className="flex flex-col gap-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">2 · Patient or family member</p>
                <Button size="sm" variant="outline" onClick={() => setShowDependentForm((v) => !v)}>
                  <Users className="mr-1 size-4" />
                  Add family member
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label={`${patientName(selectedPatient)} (self)`}
                  active={who?.kind === "existing"}
                  onClick={() => pickExisting(selectedPatient)}
                />
                {(familyQuery.data ?? []).map((member) => (
                  <Chip
                    key={member.id}
                    label={`${member.name} (${member.relation})`}
                    active={who?.kind === "dependent" && who.patientId === member.dependentPatientId}
                    onClick={() =>
                      member.dependentPatientId &&
                      setWho({
                        kind: "dependent",
                        patientId: member.dependentPatientId,
                        label: `${member.name} (${member.relation})`,
                      })
                    }
                  />
                ))}
              </div>
              {showDependentForm ? (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-background/60 p-4 md:grid-cols-3">
                  <Input placeholder="First name" value={dependent.firstName} onChange={(e) => setDependent((p) => ({ ...p, firstName: e.target.value }))} />
                  <Input placeholder="Last name" value={dependent.lastName} onChange={(e) => setDependent((p) => ({ ...p, lastName: e.target.value }))} />
                  <Input list="opd-relation-suggestions" placeholder="Relation" value={dependent.relation} onChange={(e) => setDependent((p) => ({ ...p, relation: e.target.value }))} />
                  <datalist id="opd-relation-suggestions">
                    {FAMILY_RELATION_SUGGESTIONS.map((relation) => (
                      <option key={relation} value={relation} />
                    ))}
                  </datalist>
                  <Input type="date" value={dependent.dateOfBirth} onChange={(e) => setDependent((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                  <Input placeholder="Phone (optional)" value={dependent.phone} onChange={(e) => setDependent((p) => ({ ...p, phone: e.target.value }))} />
                  <div className="flex items-center gap-2">
                    {GENDERS.map((gender) => (
                      <Chip
                        key={gender}
                        label={gender.charAt(0)}
                        active={dependent.gender === gender}
                        onClick={() => setDependent((p) => ({ ...p, gender: p.gender === gender ? "" : gender }))}
                      />
                    ))}
                  </div>
                  <div className="md:col-span-3">
                    <Button
                      size="sm"
                      onClick={() => void addDependent()}
                      disabled={
                        createDependent.isPending ||
                        !dependent.firstName.trim() ||
                        !dependent.lastName.trim() ||
                        !dependent.relation.trim()
                      }
                    >
                      {createDependent.isPending ? "Adding..." : "Add & select"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {who ? (
            <section className="flex flex-col gap-y-3">
              <p className="text-sm font-semibold text-foreground">
                {selectedPatient ? "3" : "2"} · Visit details
                {who.kind !== "new" ? <span className="ml-2 font-normal text-muted-foreground">for {who.label}</span> : null}
              </p>
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
                <div className="flex flex-col gap-y-1">
                  <Label htmlFor="opd-present-illness">Present illness</Label>
                  <Textarea
                    id="opd-present-illness"
                    rows={2}
                    value={presentIllness}
                    onChange={(event) => setPresentIllness(event.target.value)}
                    placeholder="Why the patient came today"
                  />
                </div>
                <div className="flex flex-col gap-y-1">
                  <Label>Special case</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIAL_CASE_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        active={flags.includes(option.value)}
                        onClick={() =>
                          setFlags((prev) =>
                            prev.includes(option.value)
                              ? prev.filter((f) => f !== option.value)
                              : [...prev, option.value],
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-y-1">
                  <Label htmlFor="opd-international-id">International ID (if any)</Label>
                  <Input
                    id="opd-international-id"
                    value={internationalId}
                    onChange={(event) => setInternationalId(event.target.value)}
                    placeholder="Passport / foreign ID"
                  />
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!canRegister || busy}>
            <ClipboardPlus className="mr-1 size-4" />
            {busy ? "Registering..." : "Register visit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
