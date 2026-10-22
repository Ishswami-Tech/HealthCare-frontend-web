"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, Printer, RefreshCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, ListRow, LoadError, Note, Pill, SectionTitle, SkeletonRows, StatTile, Surface, TbdPage } from "@/components/tbd";
import { LocationQrPoster, LocationSwitch, qrCodeLabel, useLocationQrContext } from "@/components/clinic/LocationQrPoster";
import { attemptResult, CHECK_IN_METHOD_LABEL } from "@/components/clinic/check-in-labels";
import { useCheckInLog } from "@/hooks/query/useClinicQr";
import { CHECK_IN_CLOSES_MINUTES_AFTER, CHECK_IN_OPENS_MINUTES_BEFORE } from "@/lib/utils/appointmentUtils";
import { formatDateKeyInIST, formatDateLabel, formatTimeLabel } from "@/lib/utils/date-time";

// CaLocationQr (B3): the in-clinic check-in QR of one location, today's scans, print / rotate.
export default function CaLocationQrPage() {
  const params = useParams<{ id: string }>();
  const locationId = String(params?.id ?? "");
  const ctx = useLocationQrContext(locationId);
  const today = formatDateKeyInIST(new Date());
  const scans = useCheckInLog({ date: today, locationId });
  const rows = scans.data ?? [];
  const succeeded = rows.filter((row) => row.outcome === "SUCCESS");
  const viaQr = succeeded.filter((row) => row.method === "QR").length;
  const name = ctx.location?.name ?? ctx.checkInRow?.locationName ?? "Location";
  const code = qrCodeLabel(name, ctx.qr.data?.qrVersion ?? ctx.checkInRow?.qrVersion);

  const downloadPng = () => {
    if (!ctx.qr.data?.qrCode) return;
    const link = document.createElement("a");
    link.href = ctx.qr.data.qrCode;
    link.download = `${code}.png`;
    link.click();
  };

  return (
    <TbdPage
      title={`${name} · check-in QR`}
      description="Patients with an in-clinic booking scan it at the door. Video visits skip this entirely."
      backHref={`/clinic-admin/locations/${locationId}`}
      backLabel="Location"
      actions={
        <>
          <Button variant="outline" size="md" onClick={downloadPng} disabled={!ctx.qr.data?.qrCode}>
            <Download aria-hidden="true" /> Download PNG
          </Button>
          <Button asChild size="md" disabled={!ctx.qr.data}>
            <Link href={`/clinic-admin/locations/${locationId}/qr/print`}>
              <Printer aria-hidden="true" /> Print poster
            </Link>
          </Button>
        </>
      }
    >
      <LocationSwitch currentId={locationId} locations={ctx.locations} />
      {ctx.error && !ctx.qr.data ? <LoadError title="QR could not be loaded" message={ctx.error.message} onRetry={() => void ctx.qr.refetch()} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Surface as="section" aria-label="QR code">
          {ctx.isPending ? (
            <SkeletonRows rows={6} />
          ) : ctx.qrMissing ? (
            <EmptyBlock icon={ScanLine} tone="amber" title="No check-in QR for this location yet" description="The QR is created with the location's check-in settings. Reception can still check patients in by hand." />
          ) : (
            <LocationQrPoster clinicName={ctx.clinicName} locationName={name} qrDataUrl={ctx.qr.data?.qrCode} code={code} size="A5" showFooter={false} />
          )}
        </Surface>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Check-ins today" value={scans.isPending ? "…" : succeeded.length} />
            <StatTile tone="brand" label="Via QR" value={succeeded.length ? `${Math.round((viaQr / succeeded.length) * 100)}%` : "—"} />
            <StatTile
              label="Last rotated"
              value={ctx.checkInRow?.qrRotatedAt ? formatDateLabel(ctx.checkInRow.qrRotatedAt) : "Never"}
              hint={ctx.checkInRow?.qrVersion ? `Version ${ctx.checkInRow.qrVersion}` : undefined}
            />
          </div>

          <Surface as="section" aria-label="Latest scans">
            <SectionTitle
              title="Latest scans"
              action={
                <Link className="text-[13px] font-bold text-brand" href="/clinic-admin/check-ins">
                  Full log
                </Link>
              }
            />
            {scans.isPending ? (
              <SkeletonRows rows={4} />
            ) : rows.length === 0 ? (
              <p className="text-sm text-ink-muted">No scans yet today.</p>
            ) : (
              rows.slice(0, 6).map((row) => {
                const result = attemptResult(row);
                return (
                  <ListRow
                    key={row.id}
                    title={`${row.patientName ?? "Unknown"}${row.tokenLabel ? ` · ${row.tokenLabel}` : ""}`}
                    description={`${CHECK_IN_METHOD_LABEL[row.method] ?? row.method} · ${formatTimeLabel(row.at)}`}
                    right={<Pill tone={result.tone}>{result.label}</Pill>}
                  />
                );
              })
            )}
          </Surface>

          <Surface as="section" aria-label="How patients use it">
            <SectionTitle title="How patients use it" />
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-soft">
              <li>Arrive at the clinic with an in-clinic booking for this location.</li>
              <li>Scan the poster from {CHECK_IN_OPENS_MINUTES_BEFORE} minutes before until {CHECK_IN_CLOSES_MINUTES_AFTER} minutes after the slot start. The app checks the location and today&apos;s booking.</li>
              <li>The appointment is confirmed and a token with this location&apos;s prefix (e.g. K-001) joins this location&apos;s queue for the doctor. Walk-ins share the same series; video visits get no token.</li>
            </ol>
          </Surface>

          <Note tone="amber">
            If the poster is lost, or photographed and shared, rotate the code. Old posters stop working immediately.{" "}
            <Link className="font-bold underline" href={`/clinic-admin/locations/${locationId}/qr/regenerate`}>
              <RefreshCcw className="mr-1 inline size-3.5" aria-hidden="true" />
              Rotate code
            </Link>
          </Note>
        </div>
      </div>
    </TbdPage>
  );
}
