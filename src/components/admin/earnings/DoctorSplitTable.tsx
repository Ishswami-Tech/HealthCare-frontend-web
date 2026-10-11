"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, IndianRupee, Users } from "lucide-react";
import { EmptyBlock, SectionTitle, Surface } from "@/components/tbd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateInIST } from "@/lib/utils/date-time";
import { formatInr } from "@/lib/utils/earnings-range";
import type { SplitDoctor } from "./earnings-split.logic";

const MONEY = "text-right tabular-nums";

function DoctorRow({ doctor }: { doctor: SplitDoctor }) {
  const [open, setOpen] = useState(false);
  const canExpand = doctor.daily.length > 0;
  const panelId = `split-days-${doctor.doctorId}`;

  return (
    <Fragment>
      <TableRow>
        <TableCell className="font-bold text-ink">
          {canExpand ? (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? "Hide" : "Show"} daily rows for ${doctor.doctorName}`}
              className="inline-flex items-center gap-1.5 rounded-md text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {open ? (
                <ChevronDown className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              )}
              {doctor.doctorName}
            </button>
          ) : (
            <span className="pl-[22px]">{doctor.doctorName}</span>
          )}
        </TableCell>
        <TableCell className={MONEY}>{doctor.consultations}</TableCell>
        <TableCell className={MONEY}>{formatInr(doctor.grossAmount)}</TableCell>
        <TableCell className={MONEY}>{formatInr(doctor.doctorShareAmount)}</TableCell>
        <TableCell className={MONEY}>{formatInr(doctor.convenienceFeeAmount)}</TableCell>
      </TableRow>
      {open
        ? doctor.daily.map((day, index) => (
            <TableRow key={day.date} id={index === 0 ? panelId : undefined} className="bg-well/60 text-[13px]">
              <TableCell className="pl-9 text-ink-muted">
                {formatDateInIST(day.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </TableCell>
              <TableCell className={MONEY}>{day.consultations}</TableCell>
              <TableCell className={MONEY}>{formatInr(day.grossAmount)}</TableCell>
              <TableCell className={MONEY}>{formatInr(day.doctorShareAmount)}</TableCell>
              <TableCell className={MONEY}>{formatInr(day.convenienceFeeAmount)}</TableCell>
            </TableRow>
          ))
        : null}
    </Fragment>
  );
}

/** Per-doctor split of the period; a row opens into its days. */
export function DoctorSplitTable({ doctors }: { doctors: SplitDoctor[] }) {
  return (
    <Surface as="section" aria-label="Earnings by doctor">
      <SectionTitle icon={Users} title="By doctor" description="Open a doctor to see each day." />
      {doctors.length === 0 ? (
        <EmptyBlock
          icon={IndianRupee}
          title="No completed paid consultations in this period"
          description="Pick other dates to see earlier visits."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead className={MONEY}>Consultations</TableHead>
              <TableHead className={MONEY}>Gross</TableHead>
              <TableHead className={MONEY}>Doctor share</TableHead>
              <TableHead className={MONEY}>Convenience fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <DoctorRow key={doctor.doctorId || doctor.doctorName} doctor={doctor} />
            ))}
          </TableBody>
        </Table>
      )}
    </Surface>
  );
}
