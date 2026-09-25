"use client";

/**
 * Register a patient by hand: name and phone are enough, everything else is
 * optional. Any role with CREATE_PATIENTS can use it; doctors get it on their
 * Patients page, receptionists at the front desk. The patient receives a
 * temporary password derived from the phone number, shown once on success.
 */
import { useReducer } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Loader2, Mail, Phone, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuickRegisterPatient } from "@/hooks/query/usePatients";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";

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

type FormState = {
  open: boolean;
  showMore: boolean;
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
};

type FormField = Exclude<keyof FormState, "open" | "showMore">;

type FormAction =
  | { type: "set"; field: FormField; value: string }
  | { type: "open"; value: boolean }
  | { type: "toggleMore" }
  | { type: "reset" };

const EMPTY: FormState = {
  open: false,
  showMore: false,
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

const FIELD = "h-9 rounded-lg text-[13px]";

export function RegisterPatientDialog({ clinicId, trigger, onRegistered }: RegisterPatientDialogProps) {
  const [form, dispatch] = useReducer(reducer, EMPTY);
  const register = useQuickRegisterPatient();
  const set = (field: FormField) => (value: string) => dispatch({ type: "set", field, value });

  async function submit() {
    if (!clinicId) {
      showErrorToast("Pick a clinic first", { id: TOAST_IDS.GLOBAL.ERROR });
      return;
    }
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = form.phone.trim();
    if (!firstName || !lastName || !phone) {
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
    <Dialog open={form.open} onOpenChange={(value) => dispatch({ type: "open", value })}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <UserPlus className="size-4" />
            Register Patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden p-0 sm:w-full sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <User className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold leading-tight">Register Patient</DialogTitle>
              <p className="text-sm text-muted-foreground">Name and phone are enough to start. Add the rest when you have it.</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 pt-3">
          <div className="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="rp-first">First name <span className="text-emerald-500">*</span></Label>
              <Input id="rp-first" className={FIELD} placeholder="e.g. Asha" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-last">Last name <span className="text-emerald-500">*</span></Label>
              <Input id="rp-last" className={FIELD} placeholder="e.g. Patil" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-phone">Phone <span className="text-emerald-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="rp-phone" type="tel" className={`${FIELD} pl-8`} placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set("phone")(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="rp-email" type="email" className={`${FIELD} pl-8`} placeholder="optional" value={form.email} onChange={(e) => set("email")(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-dob">Date of birth</Label>
              <Input id="rp-dob" type="date" className={FIELD} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth")(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-gender">Gender</Label>
              <Select value={form.gender} onValueChange={set("gender")}>
                <SelectTrigger id="rp-gender" className={FIELD}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="button" variant="ghost" size="sm" className="mt-3 gap-2 px-2 text-emerald-700 dark:text-emerald-300" onClick={() => dispatch({ type: "toggleMore" })}>
            {form.showMore ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {form.showMore ? "Hide" : "Add"} address, emergency contact and medical notes
          </Button>

          {form.showMore && (
            <div className="mt-2 grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="rp-address">Address</Label>
                <Textarea id="rp-address" className="min-h-[50px] resize-none text-[13px]" placeholder="Street, city, PIN" value={form.address} onChange={(e) => set("address")(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="rp-ec">Emergency contact</Label>
                  <Input id="rp-ec" className={FIELD} placeholder="Name" value={form.emergencyContact} onChange={(e) => set("emergencyContact")(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rp-ecp">Emergency phone</Label>
                  <Input id="rp-ecp" type="tel" className={FIELD} placeholder="+91" value={form.emergencyPhone} onChange={(e) => set("emergencyPhone")(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="rp-history">Medical history</Label>
                <Textarea id="rp-history" className="min-h-[50px] resize-none text-[13px]" placeholder="Known conditions, past surgeries" value={form.medicalHistory} onChange={(e) => set("medicalHistory")(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="rp-allergies">Allergies</Label>
                <Input id="rp-allergies" className={FIELD} placeholder="Comma separated" value={form.allergies} onChange={(e) => set("allergies")(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="rp-meds">Current medications</Label>
                <Textarea id="rp-meds" className="min-h-[50px] resize-none text-[13px]" placeholder="With dosage" value={form.currentMedications} onChange={(e) => set("currentMedications")(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t p-4">
          <span className="text-[11px] text-muted-foreground"><span className="text-emerald-500">*</span> Required</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "open", value: false })} disabled={register.isPending}>
              Cancel
            </Button>
            <Button size="sm" className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700" onClick={submit} disabled={register.isPending}>
              {register.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {register.isPending ? "Registering…" : "Register Patient"}
              {!register.isPending && <ArrowRight className="size-3.5 opacity-60" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
