"use client";

import { useEffect, useState } from "react";
import { Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceChip, Field, LoadError, Note, SectionTitle, SegTabs, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { useClinicSettingsSection } from "@/hooks/query/useClinicSettingsSection";
import { useClinicLocations, useCurrentClinicId } from "@/hooks/query/useClinics";
import {
  printSettingsPatch,
  readPrintSettings,
  type PrintLocationLetterhead,
  type PrintSettings,
} from "@/lib/utils/clinic-settings-sections";

const EMPTY_LETTERHEAD: PrintLocationLetterhead = { address: "", phone: "", hoursLine: "" };

// CaPrintSettings (B1): letterhead and defaults of printed prescriptions, shared by the doctor
// and the assistant doctor. Stored in clinic.settings.printSettings (read with readPrintSettings).
export default function CaPrintSettingsPage() {
  const clinicId = useCurrentClinicId();
  const section = useClinicSettingsSection(readPrintSettings);
  const locations = useClinicLocations(clinicId);
  const [draft, setDraft] = useState<PrintSettings | null>(null);
  const [locationId, setLocationId] = useState("");

  const loaded = !section.isPending;
  const storedKey = JSON.stringify(section.value);
  useEffect(() => {
    if (loaded) setDraft(JSON.parse(storedKey) as PrintSettings);
  }, [loaded, storedKey]);
  useEffect(() => {
    if (!locationId && locations.data?.[0]) setLocationId(locations.data[0].id);
  }, [locationId, locations.data]);

  if (section.error && !draft) {
    return (
      <TbdPage title="Print settings" backHref="/clinic-admin/settings" backLabel="Settings">
        <LoadError title="Settings could not be loaded" message={section.error.message} onRetry={() => void section.refetch()} />
      </TbdPage>
    );
  }
  if (!draft) {
    return (
      <TbdPage title="Print settings" backHref="/clinic-admin/settings" backLabel="Settings">
        <Surface>
          <SkeletonRows rows={6} />
        </Surface>
      </TbdPage>
    );
  }

  const set = (patch: Partial<PrintSettings>) => setDraft((current) => (current ? { ...current, ...patch } : current));
  const location = locations.data?.find((entry) => entry.id === locationId);
  const letterhead: PrintLocationLetterhead = draft.locations[locationId] ?? {
    ...EMPTY_LETTERHEAD,
    address: location ? [location.address, location.city, location.zipCode].filter(Boolean).join(", ") : "",
    phone: location?.phone ?? "",
  };
  const setLetterhead = (patch: Partial<PrintLocationLetterhead>) =>
    set({ locations: { ...draft.locations, [locationId]: { ...letterhead, ...patch } } });
  const dirty = JSON.stringify(draft) !== storedKey;
  const clinicName = draft.clinicName || section.clinicName;

  return (
    <TbdPage
      title="Print settings"
      description="Letterhead and defaults for printed prescriptions, shared by the doctor and assistant doctor."
      backHref="/clinic-admin/settings"
      backLabel="Settings"
      actions={
        <>
          <Button variant="outline" size="md" onClick={() => window.print()}>
            <Printer aria-hidden="true" /> Print test page
          </Button>
          <Button size="md" disabled={!dirty || section.isSaving} onClick={() => void section.save(printSettingsPatch(draft))}>
            <Save aria-hidden="true" /> {section.isSaving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5 print:hidden">
          <Surface as="section" aria-label="Letterhead" className="flex flex-col gap-3">
            <SectionTitle title="Letterhead" />
            {(locations.data ?? []).length > 1 ? (
              <SegTabs
                ariaLabel="Location"
                value={locationId}
                onChange={setLocationId}
                options={(locations.data ?? []).map((entry) => ({ value: entry.id, label: entry.name }))}
              />
            ) : null}
            <Field label="Clinic name on letterhead" htmlFor="ps-name">
              <Input id="ps-name" value={draft.clinicName} placeholder={section.clinicName} onChange={(e) => set({ clinicName: e.target.value })} />
            </Field>
            <Field label="Tagline (optional)" htmlFor="ps-tagline">
              <Input id="ps-tagline" value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </Field>
            <Field label={`Address · ${location?.name ?? "location"}`} htmlFor="ps-address">
              <Textarea id="ps-address" rows={2} value={letterhead.address} onChange={(e) => setLetterhead({ address: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={`Phone · ${location?.name ?? "location"}`} htmlFor="ps-phone">
                <Input id="ps-phone" value={letterhead.phone} onChange={(e) => setLetterhead({ phone: e.target.value })} />
              </Field>
              <Field label="Clinic hours line" htmlFor="ps-hours">
                <Input id="ps-hours" value={letterhead.hoursLine} placeholder="Mon–Sat · 9:30 am – 8:00 pm" onChange={(e) => setLetterhead({ hoursLine: e.target.value })} />
              </Field>
            </div>
            <Note tone="blue">Each prescription uses the letterhead of the location where the visit happened.</Note>
          </Surface>

          <Surface as="section" aria-label="Doctor and signature" className="flex flex-col gap-3">
            <SectionTitle title="Doctor and signature" />
            <Field label="Doctor name" htmlFor="ps-doctor">
              <Input id="ps-doctor" value={draft.doctorName} onChange={(e) => set({ doctorName: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Registration number" htmlFor="ps-reg">
                <Input id="ps-reg" value={draft.registrationNumber} onChange={(e) => set({ registrationNumber: e.target.value })} />
              </Field>
              <Field label="Qualification line" htmlFor="ps-qual">
                <Input id="ps-qual" value={draft.qualification} onChange={(e) => set({ qualification: e.target.value })} />
              </Field>
            </div>
            <Note tone="amber">Only the doctor&apos;s signature prints. Assistant-prepared drafts print after the doctor approves them. Logo and signature upload is not available yet.</Note>
          </Surface>

          <Surface as="section" aria-label="Defaults and options" className="flex flex-col gap-3">
            <SectionTitle title="Defaults and options" />
            <Field label="Default paper size">
              <div className="flex gap-2">
                {(["A4", "A5"] as const).map((size) => (
                  <ChoiceChip key={size} active={draft.paperSize === size} onClick={() => set({ paperSize: size })}>
                    {size}
                  </ChoiceChip>
                ))}
              </div>
            </Field>
            <Field label="Default language">
              <div className="flex gap-2">
                <ChoiceChip active={draft.language === "en"} onClick={() => set({ language: "en" })}>English</ChoiceChip>
                <ChoiceChip active={draft.language === "mr"} onClick={() => set({ language: "mr" })}>मराठी</ChoiceChip>
              </div>
            </Field>
            {(
              [
                ["showVerificationQr", "Show verification QR on prescriptions", "Pharmacists scan it to confirm the prescription is genuine"],
                ["showRegistration", "Show registration number", "Under the doctor's name"],
                ["showFollowUp", "Show follow-up date", 'Prints "Review on" when the doctor sets one'],
              ] as const
            ).map(([key, label, hint]) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
                <span>
                  <span className="block text-sm font-bold text-ink">{label}</span>
                  <span className="text-xs text-ink-muted">{hint}</span>
                </span>
                <Switch checked={draft[key]} onCheckedChange={(checked) => set({ [key]: checked } as Partial<PrintSettings>)} />
              </label>
            ))}
            <Field label="Footer text" htmlFor="ps-footer">
              <Textarea id="ps-footer" rows={2} value={draft.footerText} onChange={(e) => set({ footerText: e.target.value })} />
            </Field>
            <Note tone="green">Prescriptions never print fees, invoice numbers or any billing amounts. This is fixed.</Note>
          </Surface>
        </div>

        <Surface as="aside" aria-label="Prescription preview" className="flex h-fit flex-col gap-3 lg:sticky lg:top-24">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
            Preview · {draft.paperSize} · {draft.language === "mr" ? "मराठी" : "English"} · {location?.name ?? ""}
          </p>
          <div className="rounded-[14px] border border-line bg-white p-5 text-[#0f1b2d]">
            <div className="border-b border-[#047857] pb-3">
              <p className="text-lg font-extrabold text-[#047857]">{clinicName || "Clinic name"}</p>
              {draft.tagline ? <p className="text-xs">{draft.tagline}</p> : null}
              <p className="text-xs">{letterhead.address}</p>
              <p className="text-xs">{[letterhead.phone, letterhead.hoursLine].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="py-4 text-sm">
              <p className="font-bold">Patient name · age / sex</p>
              <p className="mt-3 text-2xl font-extrabold">℞</p>
              <p className="text-xs text-[#5b6b7f]">Medicines, dosage and duration print here.</p>
              {draft.showFollowUp ? <p className="mt-3 text-xs font-bold">Review on: —</p> : null}
            </div>
            <div className="flex items-end justify-between border-t border-[#e2e8f0] pt-3 text-xs">
              <div>
                <p className="font-bold">{draft.doctorName || "Doctor name"}</p>
                {draft.qualification ? <p>{draft.qualification}</p> : null}
                {draft.showRegistration && draft.registrationNumber ? <p>Reg. {draft.registrationNumber}</p> : null}
              </div>
              {draft.showVerificationQr ? <div className="grid h-12 w-12 place-items-center border border-dashed border-[#94a3b8] text-[9px]">QR</div> : null}
            </div>
            {draft.footerText ? <p className="mt-3 text-[10px] text-[#5b6b7f]">{draft.footerText}</p> : null}
          </div>
        </Surface>
      </div>
    </TbdPage>
  );
}
