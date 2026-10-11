"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { InitialsAvatar, Note, SearchBox } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import { asList, asRecord, firstText } from "@/lib/utils/coerce";

/** The patient an invoice is for. `userId` is the patient's USER id, which the invoice API takes. */
export interface InvoicePatient {
  userId: string;
  name: string;
  /** Phone or email, to tell two people with the same name apart. */
  detail: string;
}

export type InvoicePatientSearchStatus = "idle" | "loading" | "error" | "empty" | "ready";

/** Shortest search text that is sent to the server. */
export const INVOICE_PATIENT_SEARCH_MIN = 2;

/**
 * Reads the clinic patients response (`{ patients: [...] }`, `{ data: [...] }` or a plain list;
 * each row is a patient with its `user`). Rows without a user id cannot be invoiced and are left out.
 */
export function toInvoicePatients(data: unknown): InvoicePatient[] {
  const record = asRecord(data);
  const rows = Array.isArray(data) ? data : asList(record?.patients).length ? asList(record?.patients) : asList(record?.data);
  const seen = new Set<string>();
  const patients: InvoicePatient[] = [];
  for (const entry of rows) {
    const row = asRecord(entry);
    const user = asRecord(row?.user);
    const userId = firstText(row?.userId, user?.id);
    if (!row || !userId || seen.has(userId)) continue;
    seen.add(userId);
    const fullName = [firstText(row.firstName, user?.firstName), firstText(row.lastName, user?.lastName)]
      .filter(Boolean)
      .join(" ");
    const phone = firstText(row.phone, user?.phone);
    const email = firstText(row.email, user?.email);
    patients.push({
      userId,
      name: fullName || firstText(row.name, user?.name) || phone || email || "Patient",
      detail: phone || email,
    });
  }
  return patients;
}

/**
 * Search and pick the patient an invoice is for. Props only: `InvoiceForm` runs the search
 * (`usePatients`) and keeps the choice.
 */
export function InvoicePatientPicker({
  selected,
  onSelect,
  onClear,
  search,
  onSearchChange,
  results,
  status,
  errorMessage,
  labelId,
}: {
  selected: InvoicePatient | null;
  onSelect: (patient: InvoicePatient) => void;
  onClear: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  results: InvoicePatient[];
  status: InvoicePatientSearchStatus;
  errorMessage?: string | undefined;
  /** Id of the visible "Patient" label. */
  labelId: string;
}) {
  if (selected) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-line bg-mint-soft px-3.5 py-2.5"
        role="group"
        aria-labelledby={labelId}
      >
        <InitialsAvatar name={selected.name} size={36} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold text-ink">{selected.name}</span>
          {selected.detail ? <span className="truncate text-xs text-ink-muted">{selected.detail}</span> : null}
        </span>
        <Button type="button" variant="outline" onClick={onClear}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby={labelId}>
      <SearchBox
        value={search}
        onChange={onSearchChange}
        placeholder="Search by name or phone"
        ariaLabel="Search patients by name or phone"
      />
      {status === "idle" ? (
        <p className="m-0 text-xs text-ink-muted">
          Type at least {INVOICE_PATIENT_SEARCH_MIN} letters, then choose the patient this invoice is for.
        </p>
      ) : null}
      {status === "loading" ? (
        <p role="status" className="m-0 flex items-center gap-2 text-[13px] font-semibold text-ink-muted">
          <Loader2 className="size-4 animate-spin text-brand" aria-hidden="true" />
          Searching patients…
        </p>
      ) : null}
      {status === "error" ? (
        <Note tone="rose" icon={AlertTriangle}>
          <span role="alert">{errorMessage || "Could not search patients."}</span>
        </Note>
      ) : null}
      {status === "empty" ? <p className="m-0 text-[13px] text-ink-muted">No patient matches “{search.trim()}”.</p> : null}
      {status === "ready" ? (
        <ul
          className="m-0 flex max-h-[208px] list-none flex-col overflow-y-auto rounded-xl border border-line bg-card p-1"
          aria-label="Matching patients"
        >
          {results.map((patient) => (
            <li key={patient.userId}>
              <button
                type="button"
                onClick={() => onSelect(patient)}
                className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-mint-soft focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <InitialsAvatar name={patient.name} size={32} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-ink">{patient.name}</span>
                  {patient.detail ? <span className="truncate text-xs text-ink-muted">{patient.detail}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
