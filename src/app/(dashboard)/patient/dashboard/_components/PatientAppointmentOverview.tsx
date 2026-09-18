"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, ChevronRight, Clock, Stethoscope } from "lucide-react";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { normalizeAppointmentStatus } from "@/lib/utils/appointmentUtils";
import { Skeleton } from "@/components/ui/skeleton";

export function PatientAppointmentOverview({ clinicId }: { clinicId: string }) {
  // The dashboard summary includes only active visits; use the same patient-scoped
  // appointment query as the appointments page for history totals.
  const { data, isPending, error } = useMyAppointments(
    clinicId ? { clinicId } : undefined,
  );
  const appointments: Array<{ id?: string; status?: string }> = data?.appointments ?? [];
  const visits = [...new Map(appointments.map((visit, index) => [visit.id ?? index, visit])).values()];
  const total = typeof data?.meta?.total === "number" ? data.meta.total : visits.length;
  const completeList = total === visits.length;
  const count = (statuses: string[]) => completeList
    ? visits.filter((visit) => statuses.includes(normalizeAppointmentStatus(visit.status ?? ""))).length
    : null;
  const metrics = [
    { label: "Total Appointments", value: total, icon: Stethoscope, style: "border-sky-200 bg-sky-50/80 text-sky-600 dark:border-sky-900 dark:bg-sky-950/20", badge: "bg-sky-100 dark:bg-sky-900/40" },
    { label: "Upcoming", value: count(["SCHEDULED", "CONFIRMED", "PENDING", "QUEUED"]), icon: Calendar, style: "border-emerald-200 bg-emerald-50/80 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/20", badge: "bg-emerald-100 dark:bg-emerald-900/40" },
    { label: "In Progress", value: count(["IN_PROGRESS"]), icon: Clock, style: "border-amber-200 bg-amber-50/80 text-amber-600 dark:border-amber-900 dark:bg-amber-950/20", badge: "bg-amber-100 dark:bg-amber-900/40" },
    { label: "Completed", value: count(["COMPLETED"]), icon: CheckCircle2, style: "border-violet-200 bg-violet-50/80 text-violet-600 dark:border-violet-900 dark:bg-violet-950/20", badge: "bg-violet-100 dark:bg-violet-900/40" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Appointment overview">
      {metrics.map(({ label, value, icon: Icon, style, badge }) => (
        <Link key={label} href="/patient/appointments" className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-4 ${style}`}>
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-full sm:size-14 ${badge}`}><Icon className="size-6" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1">
            {isPending ? <Skeleton className="mb-2 h-6 w-10" /> : <span className="block text-2xl font-bold text-foreground">{error || !data || value === null ? "—" : value}</span>}
            <span className="block text-xs text-muted-foreground sm:text-sm">{label}</span>
          </span>
          <ChevronRight className="hidden size-5 shrink-0 sm:block" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
