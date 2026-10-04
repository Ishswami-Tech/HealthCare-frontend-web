"use client";

/**
 * OPD registration: pick an existing patient (or one of their family members), or
 * quick-register a new one, then open a visit with an OPD number.
 *
 * `OpdRegistrationDialogView` is the layout (props only); `OpdRegistrationDialog` holds the
 * form state, the patient search and the mutations.
 */
import { useDeferredValue, useId, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, ClipboardPlus, Loader2, Search, UserPlus, UserRoundSearch, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyBlock, Note } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { SPECIAL_CASE_OPTIONS, FAMILY_RELATION_SUGGESTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctorPatients } from "@/hooks/query/useDoctors";
import { useQuickRegisterPatient } from "@/hooks/query/usePatients";
import {
  useCreateFamilyMember,
  useCreatePatientVisit,
  useFamilyMembers,
} from "@/hooks/query/usePatientVisits";
import { showSuccessToast } from "@/hooks/utils/use-toast";
import { Role } from "@/types/auth.types";
import type { CollectFeeMethod, FamilyMember, PatientVisit, SpecialCaseFlag } from "@/types/patient-visit.types";
import {
  ChoiceChip,
  DateInput,
  DialogActionBar,
  DialogCloseButton,
  Field,
  FieldPanel,
  StepTitle,
} from "./RegistrationFields";

export type FeeCollectMode = CollectFeeMethod | "LATER" | "WAIVE";

const FEE_COLLECT_OPTIONS: { value: FeeCollectMode; label: string }[] = [
  { value: "LATER", label: "Pay later" },
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "NET_BANKING", label: "Net banking" },
  { value: "WAIVE", label: "Waive fee" },
];

export type OpdPatientRow = {
  id: string;
  userId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  user?: { id?: string; name?: string; firstName?: string; lastName?: string; phone?: string };
};

function extractPatients(value: unknown): OpdPatientRow[] {
  if (Array.isArray(value)) return value as OpdPatientRow[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["patients", "data", "items", "records"]) {
      if (Array.isArray(record[key])) return record[key] as OpdPatientRow[];
    }
  }
  return [];
}

function patientName(row: OpdPatientRow): string {
  return (
    row.name ||
    `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() ||
    row.user?.name ||
    `${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""}`.trim() ||
    "Unknown patient"
  );
}

const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
type Gender = (typeof GENDERS)[number];

const genderLabel = (gender: Gender) => gender.charAt(0) + gender.slice(1).toLowerCase();

export interface OpdNewPatient {
  firstName: string;
  lastName: string;
  phone: string;
  gender: "" | Gender;
  dateOfBirth: string;
  address: string;
  area: string;
  district: string;
  occupation: string;
  organization: string;
}

export interface OpdDependent {
  firstName: string;
  lastName: string;
  relation: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
}

const EMPTY_NEW_PATIENT: OpdNewPatient = {
  firstName: "",
  lastName: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  area: "",
  district: "",
  occupation: "",
  organization: "",
};

const EMPTY_DEPENDENT: OpdDependent = { firstName: "", lastName: "", relation: "", gender: "", dateOfBirth: "", phone: "" };

export type OpdWho =
  | { kind: "existing"; patientId: string; label: string }
  | { kind: "dependent"; patientId: string; label: string }
  | { kind: "new" };

/** Everything the person types or picks in the dialog. */
export interface OpdRegistrationFormState {
  search: string;
  who: OpdWho | null;
  selectedPatient: OpdPatientRow | null;
  newPatient: OpdNewPatient;
  showDependentForm: boolean;
  dependent: OpdDependent;
  presentIllness: string;
  flags: SpecialCaseFlag[];
  internationalId: string;
  feeAmount: string;
  feeDiscount: string;
  feeCollectMode: FeeCollectMode;
  feeTransactionId: string;
}

export const EMPTY_OPD_REGISTRATION_FORM: OpdRegistrationFormState = {
  search: "",
  who: null,
  selectedPatient: null,
  newPatient: EMPTY_NEW_PATIENT,
  showDependentForm: false,
  dependent: EMPTY_DEPENDENT,
  presentIllness: "",
  flags: [],
  internationalId: "",
  feeAmount: "",
  feeDiscount: "",
  feeCollectMode: "LATER",
  feeTransactionId: "",
};

interface OpdRegistrationDialogProps {
  clinicId: string;
  trigger?: React.ReactNode;
  onRegistered?: (visit: PatientVisit) => void;
  /**
   * Shows the consultation fee block (amount, discount, how it is collected). Doctors see no
   * money amounts, so it is hidden for a doctor unless this is set. Without it the visit is
   * registered with the clinic's default fee and "pay later".
   */
  showFee?: boolean;
}

export interface OpdRegistrationDialogViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The button that opens the dialog. */
  trigger?: ReactNode;
  form: OpdRegistrationFormState;
  onPatch: (patch: Partial<OpdRegistrationFormState>) => void;
  /** The search text has at least 2 letters, so the result list is shown. */
  searchActive: boolean;
  searching: boolean;
  searchFailed?: boolean;
  results: OpdPatientRow[];
  familyMembers: FamilyMember[];
  onPickExisting: (row: OpdPatientRow) => void;
  onStartNew: () => void;
  onBackToSearch: () => void;
  onAddDependent: () => void;
  addingDependent: boolean;
  showFee: boolean;
  canRegister: boolean;
  busy: boolean;
  onSubmit: () => void;
}

const MONEY_INPUT = "pl-8 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** The "OPD registration" dialog. Props only: the data hooks live in `OpdRegistrationDialog`. */
export function OpdRegistrationDialogView({
  open,
  onOpenChange,
  trigger,
  form,
  onPatch,
  searchActive,
  searching,
  searchFailed = false,
  results,
  familyMembers,
  onPickExisting,
  onStartNew,
  onBackToSearch,
  onAddDependent,
  addingDependent,
  showFee,
  canRegister,
  busy,
  onSubmit,
}: OpdRegistrationDialogViewProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const { who, selectedPatient, newPatient, dependent } = form;
  const isNew = who?.kind === "new";
  const feeLocked = form.feeCollectMode === "WAIVE";
  const needsTransactionId =
    form.feeCollectMode !== "LATER" && form.feeCollectMode !== "WAIVE" && form.feeCollectMode !== "CASH";

  const patchNew = (patch: Partial<OpdNewPatient>) => onPatch({ newPatient: { ...newPatient, ...patch } });
  const patchDependent = (patch: Partial<OpdDependent>) => onPatch({ dependent: { ...dependent, ...patch } });

  const newField = (
    key: Exclude<keyof OpdNewPatient, "gender" | "dateOfBirth">,
    label: string,
    props: Partial<React.ComponentProps<typeof Input>> = {},
  ) => (
    <Field label={label} htmlFor={id(`new-${key}`)}>
      <Input
        id={id(`new-${key}`)}
        autoComplete="off"
        value={newPatient[key]}
        onChange={(event) => patchNew({ [key]: event.target.value })}
        {...props}
      />
    </Field>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <span className="contents" onClick={() => onOpenChange(true)}>
          {trigger}
        </span>
      ) : null}
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-[1040px] flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-[1040px]"
        onOpenAutoFocus={(event) => {
          // Start in the search box (or the first name of a new patient), not on a button.
          const first = document.getElementById(isNew ? id("new-firstName") : id("search"));
          if (first) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="flex shrink-0 items-center gap-3.5 px-4 pb-4 pt-[22px] sm:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <DialogTitle>OPD Registration</DialogTitle>
            <DialogDescription>Choose who is visiting, then register the visit to get an OPD number.</DialogDescription>
          </div>
          <DialogCloseButton disabled={busy} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[22px] sm:px-6">
          <div className="grid grid-cols-1 items-start gap-x-6 gap-y-4 lg:grid-cols-2">
            {/* Left: who is visiting */}
            <div className="flex min-w-0 flex-col gap-4">
              <section className="flex min-w-0 flex-col gap-2.5">
                <StepTitle
                  step={1}
                  title="Who is visiting?"
                  action={
                    <Button variant={isNew ? "default" : "outline"} aria-pressed={isNew} onClick={onStartNew}>
                      <UserPlus />
                      New patient
                    </Button>
                  }
                />

                {isNew ? (
                  <>
                    <FieldPanel>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {newField("firstName", "First name")}
                        {newField("lastName", "Last name")}
                        {newField("phone", "Mobile", { placeholder: "+91 98765 43210", inputMode: "tel", type: "tel" })}
                        <Field label="Date of birth" htmlFor={id("new-dateOfBirth")}>
                          <DateInput
                            id={id("new-dateOfBirth")}
                            value={newPatient.dateOfBirth}
                            onChange={(value) => patchNew({ dateOfBirth: value })}
                          />
                        </Field>
                        <Field label="Gender">
                          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Gender">
                            {GENDERS.map((gender) => (
                              <ChoiceChip
                                key={gender}
                                label={genderLabel(gender)}
                                active={newPatient.gender === gender}
                                onClick={() => patchNew({ gender: newPatient.gender === gender ? "" : gender })}
                              />
                            ))}
                          </div>
                        </Field>
                        {newField("address", "Address")}
                        {newField("area", "Area")}
                        {newField("district", "District")}
                        {newField("occupation", "Occupation")}
                        {newField("organization", "Organization")}
                      </div>
                    </FieldPanel>
                    <button
                      type="button"
                      onClick={onBackToSearch}
                      className="inline-flex items-center gap-1 self-start rounded-md text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      Search an existing patient instead
                      <ArrowRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <label className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 text-sm text-ink focus-within:border-brand focus-within:ring-[3px] focus-within:ring-mint">
                      <Search className="size-[18px] shrink-0 text-brand" aria-hidden="true" />
                      <input
                        id={id("search")}
                        type="search"
                        autoComplete="off"
                        value={form.search}
                        onChange={(event) => onPatch({ search: event.target.value })}
                        placeholder="Search existing patient by name or phone"
                        aria-label="Search existing patient by name or phone"
                        className="min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-ink-muted focus-visible:outline-hidden! focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
                      />
                    </label>
                    {searchActive ? (
                      <div
                        className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-card"
                        aria-live="polite"
                        aria-busy={searching}
                      >
                        {searching ? (
                          <p className="m-0 flex items-center gap-2 px-3.5 py-3 text-sm text-ink-muted">
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            Searching…
                          </p>
                        ) : searchFailed ? (
                          <p className="m-0 px-3.5 py-3 text-sm text-[#be123c] dark:text-rose-300" role="alert">
                            The search did not work. Check your connection and type again.
                          </p>
                        ) : results.length === 0 ? (
                          <p className="m-0 px-3.5 py-3 text-sm text-ink-muted">
                            No matching patient. Use “New patient”.
                          </p>
                        ) : (
                          results.map((row) => {
                            const active = selectedPatient?.id === row.id;
                            return (
                              <button
                                key={row.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => onPickExisting(row)}
                                className={cn(
                                  "flex min-h-11 items-center gap-2.5 border-b border-hair px-3.5 text-left text-sm text-ink transition-colors last:border-b-0 hover:bg-mint-soft focus-visible:bg-mint-soft focus-visible:outline-hidden",
                                  active && "bg-mint-soft",
                                )}
                              >
                                <span className={cn("min-w-0 flex-1 truncate", active ? "font-bold" : "font-semibold")}>
                                  {patientName(row)}
                                </span>
                                <span className="shrink-0 text-xs text-ink-muted">{row.phone || row.user?.phone || ""}</span>
                                {active ? (
                                  <Check className="size-4 shrink-0 text-brand" strokeWidth={2.4} aria-hidden="true" />
                                ) : null}
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
                <section className="flex min-w-0 flex-col gap-2.5">
                  <StepTitle
                    step={2}
                    title="Patient or family member"
                    action={
                      <Button
                        variant="outline"
                        aria-expanded={form.showDependentForm}
                        onClick={() => onPatch({ showDependentForm: !form.showDependentForm })}
                      >
                        <Users />
                        Add family member
                      </Button>
                    }
                  />
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Who the visit is for">
                    <ChoiceChip
                      label={`${patientName(selectedPatient)} (self)`}
                      active={who?.kind === "existing"}
                      showCheck
                      onClick={() => onPickExisting(selectedPatient)}
                    />
                    {familyMembers.map((member) => {
                      const dependentPatientId = member.dependentPatientId;
                      const label = `${member.name} (${member.relation})`;
                      return (
                        <ChoiceChip
                          key={member.id}
                          label={label}
                          active={who?.kind === "dependent" && who.patientId === dependentPatientId}
                          showCheck
                          disabled={!dependentPatientId}
                          {...(dependentPatientId ? {} : { title: "This family member has no patient record yet" })}
                          onClick={() => {
                            if (dependentPatientId) {
                              onPatch({ who: { kind: "dependent", patientId: dependentPatientId, label } });
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                  {form.showDependentForm ? (
                    <FieldPanel>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="First name" htmlFor={id("dep-first")}>
                          <Input
                            id={id("dep-first")}
                            autoComplete="off"
                            value={dependent.firstName}
                            onChange={(e) => patchDependent({ firstName: e.target.value })}
                          />
                        </Field>
                        <Field label="Last name" htmlFor={id("dep-last")}>
                          <Input
                            id={id("dep-last")}
                            autoComplete="off"
                            value={dependent.lastName}
                            onChange={(e) => patchDependent({ lastName: e.target.value })}
                          />
                        </Field>
                        <Field label="Relation" htmlFor={id("dep-relation")}>
                          <Input
                            id={id("dep-relation")}
                            list={id("relations")}
                            autoComplete="off"
                            placeholder="e.g. Daughter"
                            value={dependent.relation}
                            onChange={(e) => patchDependent({ relation: e.target.value })}
                          />
                          <datalist id={id("relations")}>
                            {FAMILY_RELATION_SUGGESTIONS.map((relation) => (
                              <option key={relation} value={relation} />
                            ))}
                          </datalist>
                        </Field>
                        <Field label="Date of birth" htmlFor={id("dep-dob")}>
                          <DateInput
                            id={id("dep-dob")}
                            value={dependent.dateOfBirth}
                            onChange={(value) => patchDependent({ dateOfBirth: value })}
                          />
                        </Field>
                        <Field label="Phone" htmlFor={id("dep-phone")}>
                          <Input
                            id={id("dep-phone")}
                            type="tel"
                            inputMode="tel"
                            autoComplete="off"
                            placeholder="Phone (optional)"
                            value={dependent.phone}
                            onChange={(e) => patchDependent({ phone: e.target.value })}
                          />
                        </Field>
                        <Field label="Gender">
                          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Gender">
                            {GENDERS.map((gender) => (
                              <ChoiceChip
                                key={gender}
                                label={genderLabel(gender)}
                                active={dependent.gender === gender}
                                onClick={() => patchDependent({ gender: dependent.gender === gender ? "" : gender })}
                              />
                            ))}
                          </div>
                        </Field>
                      </div>
                      <div>
                        <Button
                          onClick={onAddDependent}
                          disabled={
                            addingDependent ||
                            !dependent.firstName.trim() ||
                            !dependent.lastName.trim() ||
                            !dependent.relation.trim()
                          }
                        >
                          {addingDependent ? <Loader2 className="animate-spin" /> : null}
                          {addingDependent ? "Adding..." : "Add & select"}
                        </Button>
                      </div>
                    </FieldPanel>
                  ) : null}
                </section>
              ) : null}
            </div>

            {/* Right: the visit */}
            <div className="flex min-w-0 flex-col gap-4">
              {who ? (
                <>
                  <section className="flex min-w-0 flex-col gap-2.5">
                    <StepTitle
                      step={selectedPatient ? 3 : 2}
                      title="Visit details"
                      note={who.kind !== "new" ? `for ${who.label}` : undefined}
                    />
                    <FieldPanel>
                      <Field label="Present illness" htmlFor={id("present-illness")}>
                        <Textarea
                          id={id("present-illness")}
                          rows={2}
                          className="min-h-16 resize-none px-3.5 py-2.5"
                          value={form.presentIllness}
                          onChange={(event) => onPatch({ presentIllness: event.target.value })}
                          placeholder="Why the patient came today"
                        />
                      </Field>
                      <Field label="Special case">
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Special case">
                          {SPECIAL_CASE_OPTIONS.map((option) => (
                            <ChoiceChip
                              key={option.value}
                              label={option.label}
                              active={form.flags.includes(option.value)}
                              onClick={() =>
                                onPatch({
                                  flags: form.flags.includes(option.value)
                                    ? form.flags.filter((flag) => flag !== option.value)
                                    : [...form.flags, option.value],
                                })
                              }
                            />
                          ))}
                        </div>
                      </Field>
                      <Field label="International ID (if any)" htmlFor={id("international-id")}>
                        <Input
                          id={id("international-id")}
                          autoComplete="off"
                          value={form.internationalId}
                          onChange={(event) => onPatch({ internationalId: event.target.value })}
                          placeholder="Passport / foreign ID"
                        />
                      </Field>
                    </FieldPanel>
                  </section>

                  {showFee ? (
                    <section className="flex min-w-0 flex-col gap-2.5">
                      <StepTitle title="Consultation fee" />
                      <FieldPanel>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Amount" htmlFor={id("fee-amount")} hint="Leave blank to use default">
                            <div className="relative">
                              <span
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted"
                                aria-hidden="true"
                              >
                                ₹
                              </span>
                              <Input
                                id={id("fee-amount")}
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                className={MONEY_INPUT}
                                value={form.feeAmount}
                                onChange={(event) => onPatch({ feeAmount: event.target.value })}
                                placeholder="e.g. 500"
                                disabled={feeLocked}
                              />
                            </div>
                          </Field>
                          <Field label="Discount" htmlFor={id("fee-discount")}>
                            <div className="relative">
                              <span
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted"
                                aria-hidden="true"
                              >
                                ₹
                              </span>
                              <Input
                                id={id("fee-discount")}
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                className={MONEY_INPUT}
                                value={form.feeDiscount}
                                onChange={(event) => onPatch({ feeDiscount: event.target.value })}
                                placeholder="0"
                                disabled={feeLocked}
                              />
                            </div>
                          </Field>
                        </div>
                        <Field label="Collect now">
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" role="group" aria-label="Collect now">
                            {FEE_COLLECT_OPTIONS.map((option) => (
                              <ChoiceChip
                                key={option.value}
                                label={option.label}
                                active={form.feeCollectMode === option.value}
                                showCheck
                                block
                                onClick={() => onPatch({ feeCollectMode: option.value })}
                              />
                            ))}
                          </div>
                        </Field>
                        {needsTransactionId ? (
                          <Field label="Transaction ID (optional)" htmlFor={id("fee-transaction-id")}>
                            <Input
                              id={id("fee-transaction-id")}
                              autoComplete="off"
                              value={form.feeTransactionId}
                              onChange={(event) => onPatch({ feeTransactionId: event.target.value })}
                              placeholder="UTR / reference number"
                            />
                          </Field>
                        ) : null}
                      </FieldPanel>
                    </section>
                  ) : (
                    <Note tone="green">The front desk collects the fee for this visit.</Note>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-line">
                  <EmptyBlock
                    icon={UserRoundSearch}
                    title="Choose who is visiting"
                    description="Search for a patient on the left or add a new one. The visit details show here."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogActionBar
          hint={
            isNew
              ? "First name, last name and a 10-digit mobile number are needed to register."
              : "Search needs at least 2 letters. No match? Use “New patient”."
          }
        >
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button size="md" onClick={onSubmit} disabled={!canRegister || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <ClipboardPlus />}
            {busy ? "Registering..." : "Register visit"}
          </Button>
        </DialogActionBar>
      </DialogContent>
    </Dialog>
  );
}

export function OpdRegistrationDialog({ clinicId, trigger, onRegistered, showFee }: OpdRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OpdRegistrationFormState>(EMPTY_OPD_REGISTRATION_FORM);
  const patch = (next: Partial<OpdRegistrationFormState>) => setForm((prev) => ({ ...prev, ...next }));
  const { who, selectedPatient, newPatient, dependent } = form;
  const deferredSearch = useDeferredValue(form.search);
  const searchActive = deferredSearch.trim().length >= 2;

  const { session } = useAuth();
  const role = String(session?.user?.role ?? "").toUpperCase();
  const isDoctor = role === Role.DOCTOR || role === Role.ASSISTANT_DOCTOR;
  const feeVisible = showFee ?? !isDoctor;

  const patientsQuery = useDoctorPatients(
    clinicId,
    { search: deferredSearch, limit: 8, offset: 0 },
    { enabled: open && !!clinicId && searchActive },
  );
  const results = useMemo(() => extractPatients(patientsQuery.data), [patientsQuery.data]);
  const familyQuery = useFamilyMembers(clinicId, selectedPatient?.id ?? "");
  const register = useQuickRegisterPatient();
  const createVisit = useCreatePatientVisit();
  const createDependent = useCreateFamilyMember();

  const reset = () => setForm(EMPTY_OPD_REGISTRATION_FORM);

  const pickExisting = (row: OpdPatientRow) => {
    patch({
      selectedPatient: row,
      who: { kind: "existing", patientId: row.id, label: patientName(row) },
      showDependentForm: false,
    });
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
    patch({
      dependent: EMPTY_DEPENDENT,
      showDependentForm: false,
      ...(created.dependentPatientId
        ? {
            who: {
              kind: "dependent" as const,
              patientId: created.dependentPatientId,
              label: `${created.name} (${created.relation})`,
            },
          }
        : {}),
    });
  };

  const newPatientValid =
    newPatient.firstName.trim().length > 0 &&
    newPatient.lastName.trim().length > 0 &&
    newPatient.phone.replace(/\D/g, "").length >= 10;
  const canRegister = who?.kind === "new" ? newPatientValid : Boolean(who);
  const busy = register.isPending || createVisit.isPending;

  const submit = async () => {
    if (!who) return;
    // The fee fields are sent only when the fee block is shown to this person.
    const parsedFeeAmount = feeVisible && form.feeAmount.trim() ? Number(form.feeAmount) : undefined;
    const parsedFeeDiscount = feeVisible && form.feeDiscount.trim() ? Number(form.feeDiscount) : undefined;
    const feeCollectMode: FeeCollectMode = feeVisible ? form.feeCollectMode : "LATER";
    const visitDetails = {
      ...(form.presentIllness.trim() ? { presentIllness: form.presentIllness.trim() } : {}),
      ...(form.flags.length > 0 ? { specialCaseFlags: form.flags } : {}),
      ...(form.internationalId.trim() ? { internationalId: form.internationalId.trim() } : {}),
      ...(parsedFeeAmount !== undefined && Number.isFinite(parsedFeeAmount)
        ? { consultationFee: parsedFeeAmount }
        : {}),
      ...(parsedFeeDiscount !== undefined && Number.isFinite(parsedFeeDiscount)
        ? { feeDiscount: parsedFeeDiscount }
        : {}),
      ...(feeCollectMode === "WAIVE" ? { waiveFee: true } : {}),
      ...(feeCollectMode !== "LATER" && feeCollectMode !== "WAIVE"
        ? {
            collectFee: {
              method: feeCollectMode,
              ...(form.feeTransactionId.trim() ? { transactionId: form.feeTransactionId.trim() } : {}),
            },
          }
        : {}),
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
    if (visit.consultationInvoice) {
      showSuccessToast(
        `OPD ${visit.opdNumber} registered · Bill ${visit.consultationInvoice.invoiceNumber} ${visit.consultationInvoice.status}`,
        { id: "patient-visit-create" },
      );
    }
    onRegistered?.(visit);
    setOpen(false);
    reset();
  };

  return (
    <OpdRegistrationDialogView
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      trigger={
        trigger ?? (
          <Button size="md">
            <ClipboardPlus />
            OPD Registration
          </Button>
        )
      }
      form={form}
      onPatch={patch}
      searchActive={searchActive}
      searching={patientsQuery.isPending}
      searchFailed={Boolean(patientsQuery.error) && !patientsQuery.data}
      results={results}
      familyMembers={familyQuery.data ?? []}
      onPickExisting={pickExisting}
      onStartNew={() => patch({ selectedPatient: null, who: { kind: "new" } })}
      onBackToSearch={() => patch({ who: null, selectedPatient: null })}
      onAddDependent={() => void addDependent()}
      addingDependent={createDependent.isPending}
      showFee={feeVisible}
      canRegister={canRegister}
      busy={busy}
      onSubmit={() => void submit()}
    />
  );
}
