"use client";

import { useMemo, useState } from "react";
import { BarChart3, Clock, Download, Printer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kv, LoadError, SectionTitle, SegTabs, SkeletonRows, StatTile, Surface, TbdPage, visitTypeLabel } from "@/components/tbd";
import { BillingAdminNav } from "@/components/billing/clinic-admin/BillingAdminNav";
import { downloadCsv, toCsv } from "@/components/billing/clinic-admin/billing-admin.logic";
import {
  useAppointmentAnalytics,
  usePatientAnalytics,
  useServiceUtilizationAnalytics,
} from "@/hooks/query/useAnalytics";
import { useBillingOpsSummary } from "@/hooks/query/useClinicAdminBilling";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { formatRupees } from "@/lib/utils/currency";
import { formatDateKeyInIST } from "@/lib/utils/date-time";

type Period = "week" | "month" | "year";
const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30, year: 365 };

type Loose = Record<string, unknown>;
const rec = (value: unknown): Loose => (value && typeof value === "object" && !Array.isArray(value) ? (value as Loose) : {});
const num = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);
/** The analytics routes answer `{ success, data }` or the bare object. */
const body = (value: unknown): Loose => {
  const outer = rec(value);
  return "totalAppointments" in outer || "totalPatients" in outer || Array.isArray(value) ? outer : rec(outer.data);
};
const percent = (value: number) => `${Math.round((value <= 1 ? value * 100 : value) * 10) / 10}%`;

// CaReports (B1): practice performance for the clinic admin (visits, no-shows, wait, collections).
// No doctor fee / earnings split here: revenue is the clinic's collections only.
export default function CaReportsPage() {
  const clinicId = useCurrentClinicId();
  const [period, setPeriod] = useState<Period>("month");
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - (PERIOD_DAYS[period] - 1) * 86_400_000);
    return { from: formatDateKeyInIST(from), to: formatDateKeyInIST(to) };
  }, [period]);

  const appointments = useAppointmentAnalytics({ period, clinicId }, { enabled: Boolean(clinicId) });
  const patients = usePatientAnalytics({ period, clinicId });
  const slots = useServiceUtilizationAnalytics({ period, clinicId });
  const money = useBillingOpsSummary(range);

  const metrics = body(appointments.data);
  const visits = num(metrics.totalAppointments);
  const byType = Object.entries(rec(metrics.appointmentsByType)).map(([type, count]) => ({ type, count: num(count) }));
  const byStatus = Object.entries(rec(metrics.appointmentsByStatus)).map(([status, count]) => ({ status, count: num(count) }));
  const people = body(patients.data);
  const collected = money.data?.collected.amount ?? 0;
  const slotRows = useMemo(() => {
    const raw = body(slots.data);
    const list = Array.isArray(slots.data) ? (slots.data as unknown[]) : Array.isArray(raw.timeSlots) ? (raw.timeSlots as unknown[]) : Array.isArray(raw.data) ? (raw.data as unknown[]) : [];
    return list
      .map((entry) => rec(entry))
      .map((entry) => ({ slot: String(entry.timeSlot ?? entry.slot ?? ""), total: num(entry.totalAppointments) }))
      .filter((entry) => entry.slot)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [slots.data]);
  const maxSlot = Math.max(1, ...slotRows.map((row) => row.total));

  const exportCsv = () =>
    downloadCsv(
      `report-${range.from}-to-${range.to}.csv`,
      toCsv(
        ["Metric", "Value"],
        [
          ["From", range.from],
          ["To", range.to],
          ["Collected (INR)", collected],
          ["Billed (INR)", money.data?.billed.amount ?? 0],
          ["Outstanding (INR)", money.data?.outstanding.amount ?? 0],
          ["Total visits", visits],
          ["No-show rate", percent(num(metrics.noShowRate))],
          ["Average wait (min)", Math.round(num(metrics.averageWaitTime))],
          ["New patients", num(people.newPatients)],
          ["Returning patients", num(people.returningPatients)],
          ...byType.map((row) => [`Visits · ${visitTypeLabel(row.type)}`, row.count]),
        ],
      ),
    );

  return (
    <TbdPage
      title="Practice performance"
      description="Collections, visits and waiting times across your locations."
      actions={
        <>
          <SegTabs
            ariaLabel="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "week", label: "7 days" },
              { value: "month", label: "This month" },
              { value: "year", label: "Year" },
            ]}
          />
          <Button variant="outline" size="md" onClick={exportCsv}>
            <Download aria-hidden="true" /> Export CSV
          </Button>
          <Button variant="outline" size="md" onClick={() => window.print()}>
            <Printer aria-hidden="true" /> Print / PDF
          </Button>
        </>
      }
    >
      <BillingAdminNav />
      {appointments.error && !appointments.data ? (
        <LoadError title="Reports could not be loaded" message={appointments.error.message} onRetry={() => void appointments.refetch()} />
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile tone="brand" label="Collected" value={money.isPending ? "…" : formatRupees(collected)} hint={`${range.from} – ${range.to}`} />
        <StatTile label="Total visits" value={appointments.isPending ? "…" : visits} />
        <StatTile label="Collected per visit" value={visits > 0 ? formatRupees(Math.round(collected / visits)) : "—"} />
        <StatTile tone="amber" label="No-show rate" value={appointments.isPending ? "…" : percent(num(metrics.noShowRate))} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Surface as="section" aria-label="Visits by type">
          <SectionTitle title="Visits by type" icon={BarChart3} count={visits} />
          {appointments.isPending ? (
            <SkeletonRows rows={3} />
          ) : (
            <>
              {byType.map((row) => (
                <Kv key={row.type} label={visitTypeLabel(row.type)} value={`${row.count} · ${visits ? Math.round((row.count / visits) * 100) : 0}%`} />
              ))}
              <Kv label="New patients" value={num(people.newPatients)} />
              <Kv label="Returning patients" value={num(people.returningPatients)} />
            </>
          )}
        </Surface>

        <Surface as="section" aria-label="Visit outcomes">
          <SectionTitle title="Visit outcomes" icon={Users} />
          {appointments.isPending ? (
            <SkeletonRows rows={3} />
          ) : (
            <>
              {byStatus.map((row) => (
                <Kv key={row.status} label={row.status.replace(/_/g, " ").toLowerCase()} value={row.count} />
              ))}
              <Kv label="Completion rate" value={percent(num(metrics.completionRate))} />
              <Kv label="Average wait in clinic" value={`${Math.round(num(metrics.averageWaitTime))} min`} strong />
            </>
          )}
        </Surface>

        <Surface as="section" aria-label="Busiest hours" className="lg:col-span-2">
          <SectionTitle title="Busiest hours · in-clinic visits" icon={Clock} />
          {slots.isPending ? (
            <SkeletonRows rows={4} />
          ) : slotRows.length === 0 ? (
            <p className="text-sm text-ink-muted">Not enough visits yet to show busy hours.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {slotRows.map((row) => (
                <div key={row.slot} className="grid grid-cols-[90px_1fr_48px] items-center gap-3 text-sm">
                  <span className="font-bold text-ink">{row.slot}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-well">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(row.total / maxSlot) * 100}%` }} />
                  </div>
                  <span className="text-right text-ink-soft">{row.total}</span>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </TbdPage>
  );
}
