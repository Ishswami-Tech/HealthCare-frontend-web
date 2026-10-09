"use client";

import { Clock } from "lucide-react";
import { EmptyBlock, Note, Pill, SectionTitle, Surface, statusLabel, statusTone } from "@/components/tbd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateInIST } from "@/lib/utils/date-time";
import { formatInr } from "@/lib/utils/earnings-range";
import type { PaidNotCompleted } from "./earnings-split.logic";

/** Payments received for visits that never reached "completed". */
export function PaidNotCompletedTable({ rows }: { rows: PaidNotCompleted[] }) {
  return (
    <Surface as="section" aria-label="Paid, not completed">
      <SectionTitle
        icon={Clock}
        title="Paid, not completed"
        count={rows.length > 0 ? rows.length : undefined}
        description="Patients paid, but the visit was not completed, so nothing is counted for the doctor yet."
      />
      <Note tone="amber">An admin can refund or settle these payments.</Note>
      {rows.length === 0 ? (
        <EmptyBlock title="Nothing waiting" description="Every paid visit in this period was completed." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.paymentId || row.appointmentId}>
                <TableCell>
                  {row.date
                    ? formatDateInIST(row.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) ||
                      row.date
                    : "-"}
                </TableCell>
                <TableCell className="font-bold text-ink">{row.doctorName}</TableCell>
                <TableCell>
                  {row.appointmentStatus ? (
                    <Pill tone={statusTone(row.appointmentStatus)}>{statusLabel(row.appointmentStatus)}</Pill>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatInr(row.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Surface>
  );
}
