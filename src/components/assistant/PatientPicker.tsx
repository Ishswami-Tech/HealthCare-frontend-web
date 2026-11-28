"use client";

import { useState } from "react";
import { UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, InitialsAvatar, ListRow, LoadError, SearchBox, SkeletonRows } from "@/components/tbd";
import { useDebouncedValue } from "@/hooks/core/useDebouncedValue";
import { usePatientDirectory } from "@/hooks/query/usePatientDirectory";
import { genderLabel } from "@/lib/utils/labels";
import type { PatientDirectoryRow } from "@/types/patient-directory.types";

export interface PickedPatient {
  id: string;
  name: string;
  /** "41 years · Female · +91 98230 41872" */
  summary: string;
}

export function directoryRowToPickedPatient(row: PatientDirectoryRow): PickedPatient {
  const summary = [
    row.age !== null && row.age !== undefined ? `${row.age} years` : "",
    row.gender ? genderLabel(row.gender) : "",
    row.uhid ?? "",
    row.phone ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
  return { id: row.patientId, name: row.name || "Patient", summary };
}

/** Search the clinic's patients by name, phone or UHID and pick one (prescribe, dispense). */
export function PatientPicker({
  clinicId,
  onPick,
  actionLabel = "Select",
  autoFocusHint,
}: {
  clinicId: string;
  onPick: (patient: PickedPatient) => void;
  actionLabel?: string;
  autoFocusHint?: string;
}) {
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search.trim(), 300);
  const enabled = query.length >= 2;
  const directory = usePatientDirectory(clinicId, { search: query, page: 1, pageSize: 10 }, { enabled });
  const rows = directory.data?.rows ?? [];

  return (
    <div className="flex flex-col gap-2.5">
      <SearchBox value={search} onChange={setSearch} placeholder="Search by name, phone or UHID" ariaLabel="Search patients" />
      {!enabled ? (
        <p className="m-0 text-xs text-ink-muted">{autoFocusHint ?? "Type at least 2 letters to find a patient."}</p>
      ) : directory.error && !directory.data ? (
        <LoadError title="Patients could not be searched" onRetry={() => void directory.refetch()} className="py-4" />
      ) : directory.isPending ? (
        <SkeletonRows rows={2} />
      ) : rows.length === 0 ? (
        <EmptyBlock icon={UserSearch} title="No patient found" description={`Nobody matches "${query}".`} className="py-4" />
      ) : (
        <div className="rounded-2xl border border-line px-3.5">
          {rows.map((row) => {
            const patient = directoryRowToPickedPatient(row);
            return (
              <ListRow
                key={row.patientId}
                left={<InitialsAvatar name={patient.name} size={34} />}
                title={patient.name}
                description={patient.summary}
                right={
                  <Button size="compact" variant="soft" onClick={() => onPick(patient)}>
                    {actionLabel}
                  </Button>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
