"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Minus, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChoiceChip, Field, LoadError, Note, SectionTitle, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import {
  LocationQrPoster,
  LocationSwitch,
  POSTER_SIZES,
  qrCodeLabel,
  useLocationQrContext,
  type PosterLanguage,
  type PosterSize,
} from "@/components/clinic/LocationQrPoster";
import { useClinicSettingsSection } from "@/hooks/query/useClinicSettingsSection";
import { readPrintSettings } from "@/lib/utils/clinic-settings-sections";

// Only the poster area prints; the dashboard shell and the options are hidden on paper.
const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  #qr-print-area, #qr-print-area * { visibility: visible !important; }
  #qr-print-area { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 8mm; align-items: center; }
  #qr-print-area > * { break-after: page; border: none !important; }
  @page { margin: 0; }
}`;

// CaQrPrint (B3): print-ready check-in posters (A4, A5 card, 5 cm sticker), English and Marathi.
export default function CaQrPrintPage() {
  const params = useParams<{ id: string }>();
  const locationId = String(params?.id ?? "");
  const ctx = useLocationQrContext(locationId);
  const print = useClinicSettingsSection(readPrintSettings);
  const [size, setSize] = useState<PosterSize>("A4");
  const [language, setLanguage] = useState<PosterLanguage>("BOTH");
  const [copies, setCopies] = useState(1);
  const [showFooter, setShowFooter] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const name = ctx.location?.name ?? ctx.checkInRow?.locationName ?? "Location";
  const code = qrCodeLabel(name, ctx.qr.data?.qrVersion ?? ctx.checkInRow?.qrVersion);
  const address = ctx.location ? [ctx.location.address, ctx.location.city, ctx.location.zipCode].filter(Boolean).join(", ") : "";
  const hoursLine = print.value.locations[locationId]?.hoursLine ?? "";
  const posterProps = {
    clinicName: print.value.clinicName || ctx.clinicName,
    locationName: name,
    address,
    hoursLine,
    qrDataUrl: ctx.qr.data?.qrCode,
    code,
    language,
    showFooter,
    showCode,
  };

  return (
    <TbdPage
      title="Print QR poster"
      description={`Preview exactly what will print for ${name}. Code ${code}.`}
      backHref={`/clinic-admin/locations/${locationId}/qr`}
      backLabel="Location QR"
      actions={
        <Button size="md" disabled={!ctx.qr.data?.qrCode} onClick={() => window.print()}>
          <Printer aria-hidden="true" /> Print {copies} cop{copies === 1 ? "y" : "ies"}
        </Button>
      }
    >
      <style>{PRINT_CSS}</style>
      <LocationSwitch currentId={locationId} locations={ctx.locations} />
      {ctx.error && !ctx.qr.data ? <LoadError title="QR could not be loaded" message={ctx.error.message} onRetry={() => void ctx.qr.refetch()} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Surface as="section" aria-label="Live preview" className="overflow-x-auto">
          <SectionTitle title={POSTER_SIZES[size].label} description={POSTER_SIZES[size].detail} />
          {ctx.isPending ? <SkeletonRows rows={6} /> : <LocationQrPoster {...posterProps} size={size} />}
        </Surface>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Print options" className="flex flex-col gap-3">
            <SectionTitle title="Print options" />
            <Field label="Size">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(POSTER_SIZES) as PosterSize[]).map((value) => (
                  <ChoiceChip key={value} active={size === value} onClick={() => setSize(value)}>
                    {POSTER_SIZES[value].label}
                  </ChoiceChip>
                ))}
              </div>
            </Field>
            <Field label="Language">
              <div className="flex flex-wrap gap-2">
                {([
                  ["BOTH", "English + मराठी"],
                  ["en", "English"],
                  ["mr", "मराठी"],
                ] as const).map(([value, label]) => (
                  <ChoiceChip key={value} active={language === value} onClick={() => setLanguage(value)}>
                    {label}
                  </ChoiceChip>
                ))}
              </div>
            </Field>
            <Field label="Copies">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Fewer copies" onClick={() => setCopies((value) => Math.max(1, value - 1))}>
                  <Minus aria-hidden="true" />
                </Button>
                <span className="w-8 text-center font-extrabold">{copies}</span>
                <Button variant="outline" size="icon" aria-label="More copies" onClick={() => setCopies((value) => Math.min(20, value + 1))}>
                  <Plus aria-hidden="true" />
                </Button>
              </div>
            </Field>
            <label className="flex items-center justify-between gap-3 text-sm font-bold text-ink">
              Show address and hours <Switch checked={showFooter} onCheckedChange={setShowFooter} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm font-bold text-ink">
              Show code ID under the QR <Switch checked={showCode} onCheckedChange={setShowCode} />
            </label>
            <Note tone="blue">Print at 100% scale, no margins.</Note>
          </Surface>
          <Note tone="amber">
            Regenerating the code makes every printed copy stop working. Only do this if a poster was lost or shared outside the clinic.{" "}
            <Link className="font-bold underline" href={`/clinic-admin/locations/${locationId}/qr/regenerate`}>
              Regenerate QR
            </Link>
          </Note>
        </div>
      </div>

      <div id="qr-print-area" aria-hidden="true" className="hidden print:flex">
        {Array.from({ length: copies }, (_, index) => (
          <LocationQrPoster key={index} {...posterProps} size={size} />
        ))}
      </div>
    </TbdPage>
  );
}
