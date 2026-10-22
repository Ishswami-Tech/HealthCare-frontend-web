"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, ScanLine, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DateField,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  LiveTag,
  LoadError,
  Pager,
  Pill,
  SearchBox,
  SkeletonRows,
  StatTile,
  Surface,
  TbdPage,
  usePagedRows,
} from "@/components/tbd";
import { attemptResult, CHECK_IN_METHOD_LABEL } from "@/components/clinic/check-in-labels";
import { downloadCsv, toCsv } from "@/components/billing/clinic-admin/billing-admin.logic";
import { useCheckInLog, useCheckInSummary } from "@/hooks/query/useClinicQr";
import { useClinicLocations, useCurrentClinicId } from "@/hooks/query/useClinics";
import { formatDateKeyInIST, formatTimeLabel } from "@/lib/utils/date-time";
import type { CheckInMethod, CheckInOutcome } from "@/types/clinic-admin-ops.types";

const COLUMNS = "0.7fr 1.6fr 1fr 0.8fr 0.7fr 1.2fr";
type MethodFilter = "ALL" | CheckInMethod | "FAILED";

// CaCheckInLog (B3): every QR scan, manual check-in and walk-in across locations, with failures.
export default function CaCheckInLogPage() {
  const clinicId = useCurrentClinicId();
  const [date, setDate] = useState(() => formatDateKeyInIST(new Date()));
  const [locationId, setLocationId] = useState("ALL");
  const [method, setMethod] = useState<MethodFilter>("ALL");
  const [search, setSearch] = useState("");
  const locations = useClinicLocations(clinicId);
  const summary = useCheckInSummary(date);
  const log = useCheckInLog({
    date,
    ...(locationId !== "ALL" ? { locationId } : {}),
    ...(method === "FAILED" ? { outcome: "FAILED" as CheckInOutcome } : method !== "ALL" ? { method } : {}),
  });
  const locationName = (id: string | null) => locations.data?.find((entry) => entry.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (log.data ?? []).filter((row) => !term || `${row.patientName ?? ""} ${row.tokenLabel ?? ""}`.toLowerCase().includes(term));
  }, [log.data, search]);
  const paging = usePagedRows(rows, 25, { resetKey: `${date}|${locationId}|${method}|${search}` });
  const s = summary.data;
  const isToday = date === formatDateKeyInIST(new Date());

  const exportCsv = () =>
    downloadCsv(
      `check-ins-${date}.csv`,
      toCsv(
        ["Time", "Patient", "Location", "Method", "Token", "Result", "Detail"],
        rows.map((row) => [row.at, row.patientName ?? "", locationName(row.locationId), row.method, row.tokenLabel ?? "", attemptResult(row).label, row.failureDetail ?? ""]),
      ),
    );

  return (
    <TbdPage
      title={
        <span className="flex items-center gap-2">
          Check-in log {isToday ? <LiveTag>Live</LiveTag> : null}
        </span>
      }
      description="Every QR scan, manual check-in and walk-in across your locations, with failed and expired scans."
      actions={
        <>
          <DateField id="log-date" variant="inline" label="Day" value={date} onChange={(value) => setDate(value || formatDateKeyInIST(new Date()))} />
          <Button variant="outline" size="md" onClick={exportCsv} disabled={rows.length === 0}>
            <Download aria-hidden="true" /> Export CSV
          </Button>
        </>
      }
    >
      {summary.error && !s ? <LoadError title="Summary could not be loaded" message={summary.error.message} onRetry={() => void summary.refetch()} /> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Check-ins" value={s ? s.succeeded : "…"} hint={s ? `${s.total} attempts` : undefined} />
        <StatTile tone="brand" label="By QR scan" value={s?.byMethod.QR ?? (s ? 0 : "…")} hint={s && s.succeeded ? `${Math.round(((s.byMethod.QR ?? 0) / Math.max(1, s.total)) * 100)}% of attempts` : undefined} />
        <StatTile label="Manual + walk-in" value={s ? (s.byMethod.MANUAL ?? 0) + (s.byMethod.WALK_IN ?? 0) : "…"} />
        <StatTile tone="rose" label="Failed, need a look" value={s ? s.unresolvedFailures : "…"} hint={s ? `${s.failed} failed in all` : undefined} href="/clinic-admin/check-ins/failed" />
      </div>

      {s && s.unresolvedFailures > 0 ? (
        <Surface className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            <TriangleAlert className="size-4 text-[#be123c]" aria-hidden="true" /> {s.unresolvedFailures} failed scans are waiting for a decision.
          </span>
          <Button asChild size="sm">
            <Link href="/clinic-admin/check-ins/failed">Review failed check-ins</Link>
          </Button>
        </Surface>
      ) : null}

      <Surface flush as="section" aria-label="Scan log">
        <div className="flex flex-col gap-3 border-b border-hair p-4">
          <SearchBox value={search} onChange={setSearch} placeholder="Search patient or token" ariaLabel="Search check-ins" className="lg:max-w-sm" />
          <div className="flex flex-wrap gap-3">
            <FilterChips
              ariaLabel="Location"
              value={locationId}
              onChange={setLocationId}
              options={[{ value: "ALL", label: "All locations" }, ...(locations.data ?? []).map((entry) => ({ value: entry.id, label: entry.name }))]}
            />
            <FilterChips<MethodFilter>
              ariaLabel="Method"
              value={method}
              onChange={setMethod}
              options={[
                { value: "ALL", label: "All methods" },
                { value: "QR", label: "QR", count: s?.byMethod.QR },
                { value: "MANUAL", label: "Manual", count: s?.byMethod.MANUAL },
                { value: "WALK_IN", label: "Walk-in", count: s?.byMethod.WALK_IN },
                { value: "FAILED", label: "Failed", count: s?.failed },
              ]}
            />
          </div>
        </div>
        {log.isPending ? (
          <div className="p-5">
            <SkeletonRows rows={8} />
          </div>
        ) : log.error ? (
          <div className="p-5">
            <LoadError title="Check-in log could not be loaded" message={log.error.message} onRetry={() => void log.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyBlock icon={ScanLine} title="No check-ins for this day" description="QR scans and manual check-ins appear here as they happen." />
        ) : (
          <div role="table" aria-label="Check-ins">
            <GridHead columns={COLUMNS} labels={["Time", "Patient", "Location", "Method", "Token", "Result"]} />
            {paging.pageRows.map((row) => {
              const result = attemptResult(row);
              return (
                <GridRow key={row.id} columns={COLUMNS}>
                  <span className="font-bold text-ink">{formatTimeLabel(row.at)}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink">{row.patientName ?? "Unknown patient"}</span>
                    {row.failureDetail ? <span className="block truncate text-xs text-ink-muted">{row.failureDetail}</span> : null}
                  </span>
                  <span className="text-ink-soft">{locationName(row.locationId)}</span>
                  <Pill tone="slate">{CHECK_IN_METHOD_LABEL[row.method] ?? row.method}</Pill>
                  <span className="font-extrabold text-ink">{row.tokenLabel ?? "—"}</span>
                  <Pill tone={result.tone}>{result.label}</Pill>
                </GridRow>
              );
            })}
            <div className="p-4">
              <Pager paging={paging} noun="check-ins" hideWhenSinglePage id="ca-checkin-pager" />
            </div>
          </div>
        )}
      </Surface>
    </TbdPage>
  );
}
