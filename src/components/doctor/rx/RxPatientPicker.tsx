"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, InitialsAvatar, LoadError, SearchBox, SkeletonRows, Surface } from "@/components/tbd";
import { useDebouncedValue } from "@/hooks/core/useDebouncedValue";
import { usePatientDirectory } from "@/hooks/query/usePatientDirectory";
import { patientSummaryLine } from "@/app/(dashboard)/doctor/patients/_components/doctorPatients.logic";

/**
 * "Choose the patient" step of a doctor screen opened without a patient (new prescription,
 * investigations). Picking a row adds `?patientId=` to the current page.
 */
export function RxPatientPicker({ clinicId, actionLabel }: { clinicId: string; actionLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim(), 300);
  const directory = usePatientDirectory(clinicId, { search: term, page: 1, pageSize: 10 }, { enabled: term.length >= 2 });
  const rows = directory.data?.rows ?? [];

  return (
    <Surface>
      <SearchBox value={search} onChange={setSearch} placeholder="Search patient by name, phone or UHID" />
      {term.length < 2 ? (
        <EmptyBlock icon={UserSearch} title="Choose the patient" description="Type at least two letters of the patient's name, phone or UHID." />
      ) : directory.isPending ? (
        <SkeletonRows rows={3} />
      ) : directory.error ? (
        <LoadError title="Patients could not be loaded" message="Check the connection and try again." onRetry={() => void directory.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyBlock icon={UserSearch} title="No patient found" description="Check the spelling, or search by phone number." />
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map((row) => (
            <li key={row.patientId} className="flex items-center gap-3 border-b border-hair py-2.5 last:border-b-0">
              <InitialsAvatar name={row.name} size={36} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-bold text-ink">{row.name}</span>
                <span className="text-xs text-ink-muted">
                  {[patientSummaryLine({ age: row.age, gender: row.gender ?? "" }), row.uhid].filter(Boolean).join(" · ")}
                </span>
              </span>
              <Button size="sm" onClick={() => router.replace(`${pathname}?patientId=${encodeURIComponent(row.patientId)}`)}>
                {actionLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
