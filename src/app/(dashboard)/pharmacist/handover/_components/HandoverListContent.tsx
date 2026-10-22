"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HandHeart, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  GridHead,
  GridRow,
  InitialsAvatar,
  LoadError,
  Pill,
  SearchBox,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePrescriptions } from "@/hooks/query/usePharmacy";
import { routeFor } from "@/lib/config/tbdRoutes";
import { asList } from "@/lib/utils/coerce";
import {
  dateTimeLabel,
  filterPrescriptions,
  getPrescriptionState,
  normalizePrescription,
  sortNewestFirst,
} from "../../prescriptions/_components/pharmacist-prescriptions.logic";

const COLUMNS = "minmax(0,1.5fr) minmax(0,1fr) 150px 160px";

/** Prescriptions with medicines given at the counter, ready for a verified hand-over. */
function isDispensed(status: string): boolean {
  return status === "FILLED" || status === "PARTIAL";
}

/**
 * PhHandover (list): dispensed prescriptions, newest first. Each opens the verified hand-over
 * (patient code or QR, item check, acknowledgement). Dispensing itself stays on Prescriptions.
 */
export function HandoverListContent() {
  const { clinicId } = useClinicContext();
  const [search, setSearch] = useState("");
  const query = usePrescriptions(clinicId || "", { limit: 100 });

  const rows = useMemo(() => {
    // A note-only (advice) prescription has no medicine to hand over; the API already leaves it
    // out of the pharmacist's list, this keeps an older cached list clean too.
    const list = asList(query.data)
      .map(normalizePrescription)
      .filter((row) => isDispensed(row.status) && row.medicines.length > 0);
    return filterPrescriptions(sortNewestFirst(list), search, "all");
  }, [query.data, search]);

  return (
    <TbdPage
      title="Hand-over"
      description="Check the patient's code, tick the medicines and record who received them. Dispensing stays on Prescriptions."
      actions={
        <Button asChild variant="outline" size="md">
          <Link href="/pharmacist/prescriptions">Prescriptions</Link>
        </Button>
      }
    >
      <Surface flush as="section" aria-label="Dispensed prescriptions">
        <div className="border-b border-hair px-5 pb-4 pt-5">
          <SearchBox value={search} onChange={setSearch} placeholder="Search patient, prescription or medicine" ariaLabel="Search prescriptions" />
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
          <EmptyBlock icon={PackageCheck} title="Nothing to hand over" description="Dispensed prescriptions appear here." />
        ) : (
          <div role="table" aria-label="Dispensed prescriptions">
            <GridHead columns={COLUMNS} labels={["Patient", "Prescription", "Dispensed", "Actions"]} />
            {rows.map((row) => {
              const state = getPrescriptionState(row);
              return (
                <GridRow key={row.id} columns={COLUMNS}>
                  <div role="cell">
                    <CellTitle left={<InitialsAvatar name={row.patientName} />} title={row.patientName} description={row.patientUhid || row.patientPhone} />
                  </div>
                  <div role="cell" className="flex flex-col gap-1">
                    <span className="text-[13px] font-bold text-ink">{row.reference}</span>
                    <Pill tone={state.tone}>{state.label}</Pill>
                  </div>
                  <div role="cell" className="text-[13px] text-ink-soft">
                    {dateTimeLabel(row.dispensedAt) || "—"}
                  </div>
                  <div role="cell">
                    <Button asChild size="compact">
                      <Link href={routeFor("/pharmacist/handover/[id]", { id: row.id })} aria-label={`Hand over to ${row.patientName}`}>
                        <HandHeart />
                        Hand over
                      </Link>
                    </Button>
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
