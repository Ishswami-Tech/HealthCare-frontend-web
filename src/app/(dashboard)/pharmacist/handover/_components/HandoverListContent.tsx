"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, HandHeart, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  Freshness,
  GridHead,
  GridRow,
  InitialsAvatar,
  LoadError,
  Pill,
  SearchBox,
  SegTabs,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePrescriptions } from "@/hooks/query/usePharmacy";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { routeFor } from "@/lib/config/tbdRoutes";
import { asList } from "@/lib/utils/coerce";
import { plural } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";
import {
  dateLabel,
  dateTimeLabel,
  filterPrescriptions,
  normalizePrescription,
  timeLabel,
} from "../../prescriptions/_components/pharmacist-prescriptions.logic";
import { formatRupees } from "../../dashboard/_components/pharmacist-dashboard.logic";
import {
  handoverPayment,
  handoverRows,
  isLongWait,
  patientIdentity,
  repeatedNames,
  waitingLabel,
  type HandoverListFilter,
} from "./handover-list.logic";

const COLUMNS = "minmax(0,1.5fr) minmax(0,1.1fr) minmax(0,1fr) 150px";
const CLOCK_TICK_MS = 30_000;

/** Re-renders every 30 s so "Waiting 12 min" keeps counting. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/**
 * PhHandover (list): dispensed prescriptions waiting at the counter, longest wait first. Each
 * row shows how long the patient has waited, how many medicines, the payment state and who the
 * patient is (UHID or the last 4 digits of the phone, and the prescription time), so two
 * patients with the same name are not confused. Each opens the verified hand-over (patient
 * code or QR, item check, acknowledgement). Dispensing itself stays on Prescriptions.
 */
export function HandoverListContent() {
  useWebSocketQuerySync();
  const { clinicId } = useClinicContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HandoverListFilter>("waiting");
  const query = usePrescriptions(clinicId || "", { limit: 100 });
  const now = useNow();

  const all = useMemo(() => asList(query.data).map(normalizePrescription), [query.data]);
  const waitingCount = useMemo(() => handoverRows(all, "waiting").length, [all]);
  const rows = useMemo(() => {
    const ordered = handoverRows(all, filter);
    // filterPrescriptions keeps the order it is given.
    return filterPrescriptions(ordered, search, "all");
  }, [all, filter, search]);
  const sameName = useMemo(() => repeatedNames(rows), [rows]);

  return (
    <TbdPage
      title="Hand-over"
      description="Patients waiting for their medicines, longest wait first. Check the patient's code, tick the medicines and record who received them."
      actions={
        <span className="flex flex-wrap items-center gap-3">
          <Freshness
            updatedAt={query.dataUpdatedAt}
            refreshing={query.isFetching}
            onRefresh={() => void query.refetch()}
          />
          <Button asChild variant="outline" size="md">
            <Link href="/pharmacist/prescriptions">Prescriptions</Link>
          </Button>
        </span>
      }
    >
      <Surface flush as="section" aria-label="Dispensed prescriptions">
        <div className="flex flex-col gap-3 border-b border-hair px-5 pb-4 pt-5 sm:flex-row sm:items-center">
          <SegTabs<HandoverListFilter>
            ariaLabel="Hand-over lists"
            value={filter}
            onChange={setFilter}
            className="shrink-0"
            options={[
              { value: "waiting", label: "Waiting", count: query.data ? waitingCount : undefined },
              { value: "collected", label: "Collected" },
            ]}
          />
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search patient, UHID, prescription or medicine"
            ariaLabel="Search prescriptions"
            className="sm:flex-1"
          />
        </div>
        {query.isPending && !query.data ? (
          <SkeletonRows rows={4} />
        ) : query.error ? (
          <LoadError
            title="We could not load the prescriptions"
            message={query.error instanceof Error ? query.error.message : undefined}
            onRetry={() => void query.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon={PackageCheck}
            title={filter === "waiting" ? "Nobody is waiting" : "Nothing collected yet"}
            description={
              filter === "waiting"
                ? "Dispensed prescriptions appear here until the patient collects them."
                : "Prescriptions appear here once the patient has collected them."
            }
          />
        ) : (
          <div role="table" aria-label={filter === "waiting" ? "Waiting for hand-over" : "Collected"}>
            <GridHead columns={COLUMNS} labels={["Patient", "Medicines", "Waiting", "Action"]} />
            {rows.map((row, position) => {
              const identity = patientIdentity(row);
              const repeated = sameName.has(row.patientName.trim().toLowerCase());
              const payment = handoverPayment(row, formatRupees);
              const waiting = waitingLabel(row.dispensedAt, now, dateLabel(row.dispensedAt));
              const long = filter === "waiting" && isLongWait(row.dispensedAt, now);
              const details = [
                identity,
                repeated || !identity ? row.reference : "",
                row.prescribedAt ? `Rx ${timeLabel(row.prescribedAt)}` : "",
              ].filter(Boolean);
              return (
                <GridRow key={row.id} columns={COLUMNS}>
                  <div role="cell">
                    <CellTitle
                      left={<InitialsAvatar name={row.patientName} />}
                      title={
                        <span className="flex flex-wrap items-center gap-2">
                          {filter === "waiting" ? (
                            <span className="text-xs font-extrabold text-ink-muted" aria-label={`Position ${position + 1}`}>
                              #{position + 1}
                            </span>
                          ) : null}
                          <span>{row.patientName}</span>
                          {repeated ? <Pill tone="amber">Same name</Pill> : null}
                        </span>
                      }
                      description={details.join(" · ")}
                    />
                  </div>
                  <div role="cell" className="flex flex-col gap-1">
                    <span className="text-[13px] font-bold text-ink">{plural(row.medicines.length, "medicine")}</span>
                    <Pill tone={payment.tone}>{payment.label}</Pill>
                  </div>
                  <div role="cell" className="flex flex-col gap-0.5 text-[13px]">
                    {filter === "waiting" ? (
                      <>
                        <span className={cn("font-bold", long ? "text-[#b45309] dark:text-amber-300" : "text-ink")}>
                          {waiting || "—"}
                        </span>
                        <span className="text-xs text-ink-muted">
                          {row.status === "PARTIAL" ? "Part dispensed" : "Dispensed"}{" "}
                          {timeLabel(row.dispensedAt)}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-soft">Collected {dateTimeLabel(row.handedOverAt) || "—"}</span>
                    )}
                  </div>
                  <div role="cell">
                    {filter === "waiting" ? (
                      <Button asChild size="compact">
                        <Link
                          href={routeFor("/pharmacist/handover/[id]", { id: row.id })}
                          aria-label={`Hand over to ${row.patientName}${identity ? ` (${identity})` : ""}`}
                        >
                          <HandHeart />
                          Hand over
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="compact" variant="outline">
                        <Link
                          href={routeFor("/pharmacist/handover/[id]", { id: row.id })}
                          aria-label={`View the hand-over of ${row.patientName}`}
                        >
                          <Eye />
                          View
                        </Link>
                      </Button>
                    )}
                  </div>
                </GridRow>
              );
            })}
          </div>
        )}
      </Surface>
    </TbdPage>
  );
}
