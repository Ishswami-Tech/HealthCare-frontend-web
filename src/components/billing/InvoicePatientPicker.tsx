"use client";

import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/core/useDebouncedValue";
import { usePatientDirectory } from "@/hooks/query/usePatientDirectory";
import type { PatientDirectoryRow } from "@/types/patient-directory.types";

interface InvoicePatientPickerProps {
  clinicId: string;
  selected: PatientDirectoryRow | null;
  onSelect: (patient: PatientDirectoryRow | null) => void;
}

const MIN_SEARCH_LENGTH = 2;

/**
 * Picks the patient an invoice is for, from the whole clinic: search by name, phone, UHID, OPD or
 * register number. (Invoices used to be raised in the signed-in staff member's own name.)
 */
export function InvoicePatientPicker({ clinicId, selected, onSelect }: InvoicePatientPickerProps) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const searching = debounced.length >= MIN_SEARCH_LENGTH && !selected;
  const { data, isFetching } = usePatientDirectory(
    clinicId,
    { search: debounced, pageSize: 10 },
    { enabled: Boolean(clinicId) && searching },
  );
  const rows = data?.rows ?? [];

  if (selected) {
    return (
      <div className="flex flex-col gap-y-2">
        <Label>Patient</Label>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-3.5 py-2.5">
          <span className="min-w-0 text-sm">
            <span className="block truncate font-bold text-ink">{selected.name}</span>
            <span className="block truncate text-xs text-ink-muted">
              {[selected.uhid, selected.phone].filter(Boolean).join(" · ") || "No contact details"}
            </span>
          </span>
          <button
            type="button"
            aria-label="Choose a different patient"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-well"
            onClick={() => {
              onSelect(null);
              setSearch("");
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label htmlFor="invoice-patient-search">Patient</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input
          id="invoice-patient-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone, UHID or OPD number"
          className="pl-10"
          autoComplete="off"
        />
      </div>
      {searching ? (
        <ul className="m-0 flex max-h-56 list-none flex-col overflow-y-auto rounded-xl border border-line p-0">
          {rows.length === 0 ? (
            <li className="px-3.5 py-3 text-sm text-ink-muted">
              {isFetching ? "Searching…" : "No patient matches this search."}
            </li>
          ) : (
            rows.map((row) => (
              <li key={row.patientId} className="border-b border-hair last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect(row)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-mint-soft focus-visible:bg-mint-soft focus-visible:outline-hidden"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{row.name}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {[row.uhid, row.phone].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <Check className="size-4 shrink-0 text-transparent" aria-hidden="true" />
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
