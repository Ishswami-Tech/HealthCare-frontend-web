"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Phone, ScanLine, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyBlock,
  FilterChips,
  InitialsAvatar,
  Kv,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  StatTile,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { attemptResult, FAILURE_REASON_HINT, failureLabel } from "@/components/clinic/check-in-labels";
import { useFailedCheckIns, useResolveCheckIn } from "@/hooks/query/useClinicQr";
import { useClinicLocations, useCurrentClinicId } from "@/hooks/query/useClinics";
import { formatTimeLabel } from "@/lib/utils/date-time";
import type { CheckInAttempt, CheckInFailureReason } from "@/types/clinic-admin-ops.types";

type Tab = "OPEN" | "RESOLVED" | "IGNORED";
const isOpen = (row: CheckInAttempt) => !row.resolution && row.needsAttention !== false;

// CaFailedCheckIns (B3): today's failed scans; manual check-in (same service as the QR), call, ignore.
export default function CaFailedCheckInsPage() {
  const clinicId = useCurrentClinicId();
  // Resolved and Ignored tabs need the handled scans too (the default list is open ones only).
  const failed = useFailedCheckIns(undefined, { includeResolved: true });
  const resolve = useResolveCheckIn();
  const locations = useClinicLocations(clinicId);
  const [tab, setTab] = useState<Tab>("OPEN");
  const all = useMemo(() => failed.data ?? [], [failed.data]);
  const open = all.filter(isOpen);
  const resolved = all.filter((row) => row.resolution && row.resolution !== "IGNORED");
  const ignored = all.filter((row) => row.resolution === "IGNORED");
  const shown = tab === "OPEN" ? open : tab === "RESOLVED" ? resolved : ignored;
  const locationName = (id: string | null) => locations.data?.find((entry) => entry.id === id)?.name ?? "—";
  const byReason = useMemo(() => {
    const counts = new Map<CheckInFailureReason, number>();
    for (const row of all) if (row.failureReason) counts.set(row.failureReason, (counts.get(row.failureReason) ?? 0) + 1);
    return [...counts.entries()];
  }, [all]);

  const act = (attempt: CheckInAttempt, resolution: "MANUAL_CHECK_IN" | "CALLED" | "IGNORED") => resolve.mutate({ attempt, resolution });

  return (
    <TbdPage
      title={`${open.length} scan${open.length === 1 ? "" : "s"} need a decision`}
      description="Failed check-ins today"
      backHref="/clinic-admin/check-ins"
      backLabel="Check-in log"
      actions={
        <Button
          variant="outline"
          size="md"
          disabled={open.length === 0 || resolve.isPending}
          onClick={() => open.forEach((attempt) => act(attempt, "IGNORED"))}
        >
          Ignore all {open.length}
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <StatTile tone="rose" label="Open" value={failed.isPending ? "…" : open.length} />
        <StatTile tone="brand" label="Resolved" value={resolved.length} />
        <StatTile label="Ignored" value={ignored.length} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <FilterChips
            ariaLabel="Status"
            value={tab}
            onChange={setTab}
            options={[
              { value: "OPEN", label: "Open", count: open.length },
              { value: "RESOLVED", label: "Resolved", count: resolved.length },
              { value: "IGNORED", label: "Ignored", count: ignored.length },
            ]}
          />
          {failed.isPending ? (
            <Surface>
              <SkeletonRows rows={4} />
            </Surface>
          ) : failed.error ? (
            <LoadError title="Failed check-ins could not be loaded" message={failed.error.message} onRetry={() => void failed.refetch()} />
          ) : shown.length === 0 ? (
            <Surface>
              <EmptyBlock icon={CheckCircle2} title={tab === "OPEN" ? "Nothing waiting" : "Nothing here"} description={tab === "OPEN" ? "Every failed scan today has been handled." : undefined} />
            </Surface>
          ) : (
            shown.map((attempt) => {
              const result = attemptResult(attempt);
              return (
                <Surface key={attempt.id} as="article" aria-label={`Failed scan of ${attempt.patientName ?? "unknown patient"}`} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
                    <Pill tone="rose">{failureLabel(attempt.failureReason)}</Pill>
                    {formatTimeLabel(attempt.at)} · {locationName(attempt.locationId)}
                    {attempt.resolution ? <Pill tone={result.tone}>{result.label}</Pill> : null}
                  </div>
                  <div className="flex items-start gap-3">
                    <InitialsAvatar name={attempt.patientName ?? "?"} size={40} />
                    <div className="min-w-0">
                      <p className="font-extrabold text-ink">{attempt.patientName ?? "Unknown patient"}</p>
                      <p className="text-sm text-ink-soft">{attempt.failureDetail ?? (attempt.failureReason ? FAILURE_REASON_HINT[attempt.failureReason] : "")}</p>
                      {attempt.resolutionNote ? <p className="text-xs text-ink-muted">Note: {attempt.resolutionNote}</p> : null}
                    </div>
                  </div>
                  {!attempt.resolution ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={!attempt.appointmentId || resolve.isPending} onClick={() => act(attempt, "MANUAL_CHECK_IN")}>
                        <UserCheck aria-hidden="true" /> Manual check-in
                      </Button>
                      <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => act(attempt, "CALLED")}>
                        <Phone aria-hidden="true" /> Called patient
                      </Button>
                      <Button size="sm" variant="ghost" disabled={resolve.isPending} onClick={() => act(attempt, "IGNORED")}>
                        <XCircle aria-hidden="true" /> Ignore
                      </Button>
                    </div>
                  ) : null}
                  {!attempt.appointmentId && !attempt.resolution ? (
                    <Note tone="amber">No booking matched this scan. Reception registers the patient as a walk-in.</Note>
                  ) : null}
                </Surface>
              );
            })
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="By reason">
            <SectionTitle title="By reason today" />
            {byReason.length === 0 ? <p className="text-sm text-ink-muted">No failures today.</p> : byReason.map(([reason, count]) => <Kv key={reason} label={failureLabel(reason)} value={count} />)}
          </Surface>
          <Note tone="blue">
            Patients see “We could not check you in. Please show this screen at the front desk.” Manual check-in gives a normal token and the patient joins the end of the queue.
          </Note>
          <Surface as="section" aria-label="Clinic QR">
            <SectionTitle title="Clinic QR codes" icon={ScanLine} />
            {(locations.data ?? []).map((location) => (
              <Kv
                key={location.id}
                label={location.name}
                value={
                  <Link className="font-bold text-brand" href={`/clinic-admin/locations/${location.id}/qr`}>
                    Manage
                  </Link>
                }
              />
            ))}
          </Surface>
        </div>
      </div>
    </TbdPage>
  );
}
