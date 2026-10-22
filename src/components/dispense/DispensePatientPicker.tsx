"use client";

import { useDeferredValue, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogError, EmptyBlock, Field, InitialsAvatar, Pill, SearchBox, SegTabs, SkeletonRows } from "@/components/tbd";
import { usePatientDirectory } from "@/hooks/query/usePatientDirectory";
import type { DispenseRecipient } from "@/lib/dispense/direct-dispense";

type Mode = "patient" | "walk-in";

const MODES = [
  { value: "patient" as const, label: "Registered patient" },
  { value: "walk-in" as const, label: "Walk-in" },
];

/** "Who is this for?": any registered patient (name, phone or UHID), or a quick walk-in. */
export function DispensePatientPicker({
  clinicId,
  recipient,
  onChange,
}: {
  clinicId: string;
  recipient: DispenseRecipient | null;
  onChange: (recipient: DispenseRecipient | null) => void;
}) {
  const [mode, setMode] = useState<Mode>(recipient?.kind ?? "patient");
  const [search, setSearch] = useState("");
  const [walkIn, setWalkIn] = useState({ name: "", phone: "" });
  const term = useDeferredValue(search.trim());
  const directory = usePatientDirectory(clinicId, { search: term, pageSize: 10 }, { enabled: mode === "patient" && term.length >= 2 });
  const rows = directory.data?.rows ?? [];

  const switchMode = (next: Mode) => {
    setMode(next);
    onChange(next === "walk-in" && walkIn.name.trim() ? { kind: "walk-in", ...walkIn } : null);
  };
  const updateWalkIn = (patch: Partial<typeof walkIn>) => {
    const next = { ...walkIn, ...patch };
    setWalkIn(next);
    onChange(next.name.trim() ? { kind: "walk-in", name: next.name, phone: next.phone } : null);
  };

  return (
    <div className="flex flex-col gap-3">
      <SegTabs options={MODES} value={mode} onChange={switchMode} ariaLabel="Patient type" />
      {mode === "patient" ? (
        <>
          <SearchBox value={search} onChange={setSearch} placeholder="Name, phone or UHID" ariaLabel="Search patients" />
          {term.length < 2 ? (
            <p className="m-0 text-xs text-ink-muted">Search any patient of the clinic, not only today&apos;s queue.</p>
          ) : directory.isPending ? (
            <SkeletonRows rows={2} />
          ) : directory.error ? (
            // The backend says why a search was refused ("Search by name (at least 3 letters), …").
            <DialogError message={directory.error.message || "Patients could not be searched. Try again."} />
          ) : rows.length === 0 ? (
            <EmptyBlock title="No patient found" description="Check the spelling, or add a walk-in." className="py-5" />
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {rows.map((row) => {
                const selected = recipient?.kind === "patient" && recipient.patientId === row.patientId;
                return (
                  <li key={row.patientId} className="flex items-center gap-3 border-b border-hair py-2.5 last:border-b-0">
                    <InitialsAvatar name={row.name} size={36} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold text-ink">{row.name}</span>
                      <span className="truncate text-xs text-ink-muted">
                        {[row.age !== null ? `${row.age} Y` : "", row.gender ?? "", row.uhid ? `UHID ${row.uhid}` : "", row.phone ?? ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {selected ? (
                      <Pill tone="green">Selected</Pill>
                    ) : (
                      <Button
                        size="compact"
                        variant="outline"
                        onClick={() => onChange({ kind: "patient", patientId: row.patientId, name: row.name })}
                      >
                        Select
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="walk-in-name" required>
            <Input id="walk-in-name" value={walkIn.name} onChange={(event) => updateWalkIn({ name: event.target.value })} />
          </Field>
          <Field label="Phone (optional)" htmlFor="walk-in-phone">
            <Input
              id="walk-in-phone"
              inputMode="tel"
              value={walkIn.phone}
              onChange={(event) => updateWalkIn({ phone: event.target.value })}
            />
          </Field>
          <p className="m-0 inline-flex items-center gap-1.5 text-xs text-ink-muted sm:col-span-2">
            <UserPlus className="size-3.5" aria-hidden="true" />
            Reception can complete the profile later.
          </p>
        </div>
      )}
    </div>
  );
}
