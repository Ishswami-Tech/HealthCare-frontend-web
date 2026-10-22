"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DialogError, Field, FactTile, LoadError, Note, SectionTitle, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { LocationQrPoster, qrCodeLabel, useLocationQrContext } from "@/components/clinic/LocationQrPoster";
import { useRegenerateLocationQr } from "@/hooks/query/useClinicQr";
import { formatDateTimeLabel } from "@/lib/utils/date-time";

// CaQrRegenerate (B3): rotate a location's check-in QR. Old posters fail with "QR replaced".
export default function CaQrRegeneratePage() {
  const params = useParams<{ id: string }>();
  const locationId = String(params?.id ?? "");
  const router = useRouter();
  const ctx = useLocationQrContext(locationId);
  const regenerate = useRegenerateLocationQr();
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const name = ctx.location?.name ?? ctx.checkInRow?.locationName ?? "Location";
  const version = ctx.qr.data?.qrVersion ?? ctx.checkInRow?.qrVersion ?? 1;
  const oldCode = qrCodeLabel(name, version);
  const newCode = qrCodeLabel(name, version + 1);

  const submit = async () => {
    if (!ctx.checkInRow) return;
    setError(null);
    try {
      await regenerate.mutateAsync({ checkInLocationId: ctx.checkInRow.id, ...(reason.trim() ? { reason: reason.trim() } : {}) });
      router.push(`/clinic-admin/locations/${locationId}/qr/print`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The QR could not be regenerated");
    }
  };

  return (
    <TbdPage title={`Regenerate the ${name} QR code?`} backHref={`/clinic-admin/locations/${locationId}/qr`} backLabel="Location QR">
      {ctx.error && !ctx.checkInRow ? <LoadError title="QR could not be loaded" message={ctx.error.message} /> : null}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Surface as="section" aria-label="Current poster">
          {ctx.isPending ? (
            <SkeletonRows rows={6} />
          ) : (
            <LocationQrPoster clinicName={ctx.clinicName} locationName={name} qrDataUrl={ctx.qr.data?.qrCode} code={oldCode} size="A5" showFooter={false} />
          )}
        </Surface>

        <Surface as="section" aria-label="Confirm regeneration" className="flex flex-col gap-4">
          <SectionTitle title="Every printed poster, table card and sticker for this location stops working immediately." />
          <div className="grid gap-3 sm:grid-cols-2">
            <FactTile label="Old · stops working" value={oldCode} />
            <FactTile label="New · active after confirm" value={newCode} />
          </div>
          <Note tone="blue">
            <strong>What happens:</strong> scans of the old code show &quot;This QR is no longer valid, ask reception&quot;. Patients already checked in today keep their token.
          </Note>
          <Note tone="green">
            <strong>What stays:</strong> queue, tokens, appointments and the other locations&apos; codes. Reception can still check patients in by hand.
          </Note>
          <Field label="Reason (optional)" htmlFor="qr-reason">
            <Textarea id="qr-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Poster was photographed and shared" />
          </Field>
          <label className="flex items-start gap-2 text-sm font-bold text-ink">
            <Checkbox checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} />I will reprint and replace all posters, cards and stickers at {name}
          </label>
          <p className="text-xs text-ink-muted">
            {ctx.checkInRow?.qrRotatedAt ? `Last regenerated ${formatDateTimeLabel(ctx.checkInRow.qrRotatedAt)}. ` : ""}This is recorded in the audit log.
          </p>
          <DialogError message={error} />
          <div className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link href={`/clinic-admin/locations/${locationId}/qr`}>Cancel</Link>
            </Button>
            <Button variant="danger" disabled={!confirmed || !ctx.checkInRow || regenerate.isPending} onClick={() => void submit()}>
              <RefreshCcw aria-hidden="true" /> {regenerate.isPending ? "Regenerating…" : "Regenerate QR"}
            </Button>
          </div>
        </Surface>
      </div>
    </TbdPage>
  );
}
