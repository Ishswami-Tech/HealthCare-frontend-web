"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceChip, DialogError, Field, Note, SectionTitle, Surface, TbdPage } from "@/components/tbd";
import { useCreateStaffInvite } from "@/hooks/query/useClinicStaffAdmin";
import { useClinicLocations, useCurrentClinicId } from "@/hooks/query/useClinics";
import { INVITABLE_ROLES, type InvitableRole, type StaffInvite } from "@/types/clinic-admin-ops.types";

// What each invitable role means at the desk. Keyed by role so every role the backend accepts
// (INVITABLE_ROLES, mirrored from CreateStaffInviteDto) has a description.
const ROLE_INFO: Record<InvitableRole, { label: string; can: string; cannot: string }> = {
  RECEPTIONIST: {
    label: "Reception",
    can: "Works at ONE location: sees all its appointments, checks patients in with one click, registers walk-ins, reschedules and records payments at the desk.",
    cannot: "See clinical records or prescriptions, scan the QR, book video visits, or view revenue and reports.",
  },
  ASSISTANT_DOCTOR: {
    label: "Assistant doctor",
    can: "Prepares draft prescriptions for any patient in the clinic and dispenses from clinic stock.",
    cannot: "Approve prescriptions, call / start / complete a visit, or see any billing amount.",
  },
  NURSE: { label: "Nurse", can: "Supports the doctor in the clinic.", cannot: "See billing amounts or approve prescriptions." },
  THERAPIST: { label: "Therapist", can: "Works with the patients the clinic assigns to them.", cannot: "See billing amounts or approve prescriptions." },
  PHARMACIST: { label: "Pharmacist", can: "Dispenses prescriptions, hands over medicines and manages stock.", cannot: "Change clinical records." },
  CLINIC_ADMIN: { label: "Clinic admin", can: "Full access: billing, staff, locations, reports, inventory.", cannot: "Approve prescriptions or run a visit (doctor only)." },
};
const ROLES = INVITABLE_ROLES.map((value) => ({ value, ...ROLE_INFO[value] }));

// CaStaffAdd (B2): invite a team member by SMS; they sign in with a mobile OTP.
export default function CaStaffAddPage() {
  const clinicId = useCurrentClinicId();
  const locations = useClinicLocations(clinicId);
  const create = useCreateStaffInvite();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("RECEPTIONIST");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<StaffInvite | null>(null);
  const single = role === "RECEPTIONIST";
  const info = ROLES.find((entry) => entry.value === role);

  const pickLocation = (id: string) =>
    setLocationIds((current) => (single ? [id] : current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  const submit = async () => {
    setError(null);
    if (!name.trim()) { setError("Enter the full name."); return; }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Enter a 10-digit mobile number."); return; }
    if (single && locationIds.length !== 1) { setError("A receptionist works at exactly one location. Pick it."); return; }
    try {
      const invite = await create.mutateAsync({
        role,
        name: name.trim(),
        phone: digits.length === 10 ? `+91${digits}` : `+${digits}`,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(locationIds.length ? { locationIds } : {}),
      });
      setSent(invite);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The invite could not be sent");
    }
  };

  if (sent) {
    const link = sent.inviteLinkPath && typeof window !== "undefined" ? `${window.location.origin}${sent.inviteLinkPath}` : null;
    return (
      <TbdPage title="Invite sent" backHref="/clinic-admin/staff" backLabel="Staff">
        <Surface className="flex flex-col gap-3">
          <Note tone="green">
            {sent.name ?? "The new member"} gets an SMS invite and signs in with a mobile OTP. The invite expires on{" "}
            {new Date(sent.expiresAt).toLocaleDateString("en-IN")}.
          </Note>
          {link ? (
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Invite link" />
              <Button variant="outline" onClick={() => void navigator.clipboard?.writeText(link)}>
                <Copy aria-hidden="true" /> Copy
              </Button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/clinic-admin/staff">Back to staff</Link>
            </Button>
            <Button variant="outline" onClick={() => setSent(null)}>
              Invite another
            </Button>
          </div>
        </Surface>
      </TbdPage>
    );
  }

  return (
    <TbdPage title="Add staff" description="They get an SMS invite and sign in with a mobile OTP." backHref="/clinic-admin/staff" backLabel="Staff">
      <Surface as="section" aria-label="New team member" className="flex max-w-3xl flex-col gap-4">
        <SectionTitle title="New team member" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" htmlFor="st-name" required>
            <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Mobile number" htmlFor="st-phone" required>
            <Input id="st-phone" inputMode="tel" placeholder="98904 22761" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <Field label="Email (optional)" htmlFor="st-email">
          <Input id="st-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Role">
          <div className="flex flex-wrap gap-2">
            {ROLES.map((entry) => (
              <ChoiceChip
                key={entry.value}
                active={role === entry.value}
                onClick={() => {
                  setRole(entry.value);
                  if (entry.value === "RECEPTIONIST") setLocationIds((current) => current.slice(0, 1));
                }}
              >
                {entry.label}
              </ChoiceChip>
            ))}
          </div>
        </Field>
        <Field label={single ? "Works at (one location)" : "Works at"}>
          <div className="flex flex-wrap gap-2">
            {(locations.data ?? []).map((location) => (
              <ChoiceChip key={location.id} active={locationIds.includes(location.id)} onClick={() => pickLocation(location.id)}>
                {location.name}
              </ChoiceChip>
            ))}
            {locations.isPending ? <span className="text-sm text-ink-muted">Loading locations…</span> : null}
          </div>
        </Field>
        {info ? (
          <Note tone="blue">
            <strong>{info.label} can:</strong> {info.can} <strong>Cannot:</strong> {info.cannot}
          </Note>
        ) : null}
        <DialogError message={error} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-muted">Invite expires in 7 days</span>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/clinic-admin/staff">Cancel</Link>
            </Button>
            <Button disabled={create.isPending} onClick={() => void submit()}>
              <MailPlus aria-hidden="true" /> {create.isPending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </div>
      </Surface>
    </TbdPage>
  );
}
