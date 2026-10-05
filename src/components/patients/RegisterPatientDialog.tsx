"use client";

/**
 * Register a patient by hand: name and phone are enough, everything else is
 * optional. Any role with CREATE_PATIENTS can use it; doctors get it on their
 * Patients page, receptionists at the front desk. The patient receives a
 * temporary password derived from the phone number, shown once on success.
 *
 * `RegisterPatientDialogView` is the layout (props only); `RegisterPatientDialog`
 * holds the form state and the mutation.
 */
import { useId, useReducer, type ReactNode } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Loader2, Lock, Mail, Phone, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IconBox, Note } from "@/components/tbd";
import { useQuickRegisterPatient } from "@/hooks/query/usePatients";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { DateInput, DialogActionBar, DialogCloseButton, Field } from "./RegistrationFields";

export interface RegisteredPatient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  temporaryPassword: string;
}

interface RegisterPatientDialogProps {
  clinicId?: string | undefined;
  trigger?: React.ReactNode;
  /** Called with the new patient once the server has created them. */
  onRegistered?: (patient: RegisteredPatient) => void;
}

export interface RegisterPatientFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
}

export type RegisterPatientField = keyof RegisterPatientFormValues;

type FormState = RegisterPatientFormValues & {
  open: boolean;
  showMore: boolean;
  /** True after "Register Patient" was pressed with a required field empty. */
  showRequired: boolean;
};

type FormAction =
  | { type: "set"; field: RegisterPatientField; value: string }
  | { type: "open"; value: boolean }
  | { type: "toggleMore" }
  | { type: "showRequired" }
  | { type: "reset" };

const EMPTY: FormState = {
  open: false,
  showMore: false,
  showRequired: false,
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyContact: "",
  emergencyPhone: "",
  medicalHistory: "",
  allergies: "",
  currentMedications: "",
};

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "open":
      return { ...state, open: action.value };
    case "toggleMore":
      return { ...state, showMore: !state.showMore };
    case "showRequired":
      return { ...state, showRequired: true };
    case "reset":
      return EMPTY;
  }
}

function temporaryPassword(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-4) || "1234";
  return `Temp@${digits}Aa`;
}

function normalizeGender(value: string): "MALE" | "FEMALE" | "OTHER" | undefined {
  const upper = value.trim().toUpperCase();
  return upper === "MALE" || upper === "FEMALE" || upper === "OTHER" ? upper : undefined;
}

function listOf(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const NOTES_AREA = "min-h-16 resize-none px-3.5 py-2.5";

export interface RegisterPatientDialogViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The button that opens the dialog. Leave out when the dialog is opened from outside. */
  trigger?: ReactNode;
  values: RegisterPatientFormValues;
  onChange: (field: RegisterPatientField, value: string) => void;
  /** The address, emergency contact and medical notes block is open. */
  showMore: boolean;
  onToggleMore: () => void;
  /** Marks the required fields that are still empty. */
  showRequired?: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

/** The "Register patient" dialog. Props only: the mutation lives in `RegisterPatientDialog`. */
export function RegisterPatientDialogView({
  open,
  onOpenChange,
  trigger,
  values,
  onChange,
  showMore,
  onToggleMore,
  showRequired = false,
  isSubmitting,
  onSubmit,
}: RegisterPatientDialogViewProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const set = (field: RegisterPatientField) => (value: string) => onChange(field, value);
  const missing = (field: "firstName" | "lastName" | "phone") => showRequired && !values[field].trim();
  const moreId = id("more");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-[680px] flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-[680px]"
        onOpenAutoFocus={(event) => {
          // Start in the first name field, not on the close button.
          const first = document.getElementById(id("first"));
          if (first) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="flex shrink-0 items-center gap-3.5 px-4 pb-4 pt-[22px] sm:px-6">
          <IconBox icon={User} tone="mint" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <DialogTitle>Register Patient</DialogTitle>
            <DialogDescription>Name and phone are enough to start. Add the rest when you have it.</DialogDescription>
          </div>
          <DialogCloseButton disabled={isSubmitting} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-[22px] sm:px-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field
              label="First name"
              htmlFor={id("first")}
              required
              error={missing("firstName") ? "Enter the first name" : undefined}
            >
              <Input
                id={id("first")}
                placeholder="e.g. Asha"
                autoComplete="off"
                value={values.firstName}
                onChange={(e) => set("firstName")(e.target.value)}
                aria-invalid={missing("firstName") || undefined}
                required
              />
            </Field>
            <Field
              label="Last name"
              htmlFor={id("last")}
              required
              error={missing("lastName") ? "Enter the last name" : undefined}
            >
              <Input
                id={id("last")}
                placeholder="e.g. Patil"
                autoComplete="off"
                value={values.lastName}
                onChange={(e) => set("lastName")(e.target.value)}
                aria-invalid={missing("lastName") || undefined}
                required
              />
            </Field>
            <Field
              label="Phone"
              htmlFor={id("phone")}
              required
              error={missing("phone") ? "Enter the phone number" : undefined}
            >
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
                <Input
                  id={id("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  className="pl-[38px]"
                  placeholder="+91 98765 43210"
                  value={values.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  aria-invalid={missing("phone") || undefined}
                  required
                />
              </div>
            </Field>
            <Field label="Email" htmlFor={id("email")}>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
                <Input
                  id={id("email")}
                  type="email"
                  autoComplete="off"
                  className="pl-[38px]"
                  placeholder="optional"
                  value={values.email}
                  onChange={(e) => set("email")(e.target.value)}
                />
              </div>
            </Field>
            <Field label="Date of birth" htmlFor={id("dob")}>
              <DateInput id={id("dob")} value={values.dateOfBirth} onChange={set("dateOfBirth")} />
            </Field>
            <Field label="Gender" htmlFor={id("gender")}>
              <Select value={values.gender} onValueChange={set("gender")}>
                <SelectTrigger id={id("gender")} className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <button
            type="button"
            aria-expanded={showMore}
            aria-controls={moreId}
            onClick={onToggleMore}
            className="flex items-center gap-2 self-start rounded-md text-left text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {showMore ? (
              <ChevronUp className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <ChevronDown className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            )}
            {showMore ? "Hide" : "Add"} address, emergency contact and medical notes
          </button>

          {showMore ? (
            <div id={moreId} className="flex min-w-0 flex-col gap-3.5">
              <Field label="Address" htmlFor={id("address")}>
                <Textarea
                  id={id("address")}
                  className={NOTES_AREA}
                  placeholder="Street, city, PIN"
                  value={values.address}
                  onChange={(e) => set("address")(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Emergency contact" htmlFor={id("ec")}>
                  <Input
                    id={id("ec")}
                    placeholder="Name"
                    autoComplete="off"
                    value={values.emergencyContact}
                    onChange={(e) => set("emergencyContact")(e.target.value)}
                  />
                </Field>
                <Field label="Emergency phone" htmlFor={id("ecp")}>
                  <Input
                    id={id("ecp")}
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="+91"
                    value={values.emergencyPhone}
                    onChange={(e) => set("emergencyPhone")(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Medical history" htmlFor={id("history")}>
                <Textarea
                  id={id("history")}
                  className={NOTES_AREA}
                  placeholder="Known conditions, past surgeries"
                  value={values.medicalHistory}
                  onChange={(e) => set("medicalHistory")(e.target.value)}
                />
              </Field>
              <Field label="Allergies" htmlFor={id("allergies")}>
                <Input
                  id={id("allergies")}
                  placeholder="Comma separated"
                  autoComplete="off"
                  value={values.allergies}
                  onChange={(e) => set("allergies")(e.target.value)}
                />
              </Field>
              <Field label="Current medications" htmlFor={id("meds")}>
                <Textarea
                  id={id("meds")}
                  className={NOTES_AREA}
                  placeholder="With dosage"
                  value={values.currentMedications}
                  onChange={(e) => set("currentMedications")(e.target.value)}
                />
              </Field>
            </div>
          ) : null}

          <Note tone="green" icon={Lock}>
            The patient gets a temporary password made from the phone number. It is shown once, right after you
            register.
          </Note>
        </div>

        <DialogActionBar
          hint={
            <>
              <span className="font-bold text-brand">*</span> Required
            </>
          }
        >
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="md" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            {isSubmitting ? "Registering…" : "Register Patient"}
            {isSubmitting ? null : <ArrowRight />}
          </Button>
        </DialogActionBar>
      </DialogContent>
    </Dialog>
  );
}

export function RegisterPatientDialog({ clinicId, trigger, onRegistered }: RegisterPatientDialogProps) {
  const [form, dispatch] = useReducer(reducer, EMPTY);
  const register = useQuickRegisterPatient();

  async function submit() {
    if (!clinicId) {
      showErrorToast("Pick a clinic first", { id: TOAST_IDS.GLOBAL.ERROR });
      return;
    }
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = form.phone.trim();
    if (!firstName || !lastName || !phone) {
      dispatch({ type: "showRequired" });
      showErrorToast("First name, last name and phone number are required", { id: TOAST_IDS.GLOBAL.ERROR });
      return;
    }
    const password = temporaryPassword(phone);
    const gender = normalizeGender(form.gender);
    const email = form.email.trim();
    const medicalHistory = [
      form.medicalHistory.trim(),
      form.currentMedications.trim() ? `Current medications: ${form.currentMedications.trim()}` : "",
    ].filter(Boolean);
    const allergies = listOf(form.allergies);
    const emergencyContact =
      form.emergencyContact.trim() && form.emergencyPhone.trim()
        ? { name: form.emergencyContact.trim(), relationship: "Emergency Contact", phone: form.emergencyPhone.trim() }
        : undefined;
    try {
      const result = (await register.mutateAsync({
        ...(email ? { email } : {}),
        password,
        firstName,
        lastName,
        phone,
        ...(gender ? { gender } : {}),
        ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
        ...(allergies.length ? { allergies } : {}),
        ...(medicalHistory.length ? { medicalHistory } : {}),
        ...(emergencyContact ? { emergencyContact } : {}),
      })) as { user?: { id?: string; userId?: string } };
      const id = result?.user?.id ?? result?.user?.userId;
      if (!id) throw new Error("The patient was created but no id came back");
      showSuccessToast(`${firstName} ${lastName} registered. Temporary password: ${password}`, { id: TOAST_IDS.GLOBAL.SUCCESS });
      dispatch({ type: "reset" });
      onRegistered?.({ id, firstName, lastName, phone, temporaryPassword: password });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Could not register the patient", { id: TOAST_IDS.GLOBAL.ERROR });
    }
  }

  return (
    <RegisterPatientDialogView
      open={form.open}
      onOpenChange={(value) => dispatch({ type: "open", value })}
      trigger={
        trigger ?? (
          <Button size="md">
            <UserPlus />
            Register Patient
          </Button>
        )
      }
      values={form}
      onChange={(field, value) => dispatch({ type: "set", field, value })}
      showMore={form.showMore}
      onToggleMore={() => dispatch({ type: "toggleMore" })}
      showRequired={form.showRequired}
      isSubmitting={register.isPending}
      onSubmit={() => void submit()}
    />
  );
}
