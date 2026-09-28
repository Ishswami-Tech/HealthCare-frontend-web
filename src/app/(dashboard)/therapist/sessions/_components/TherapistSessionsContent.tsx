"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkeletonList } from "@/components/ui/loading";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { RecordTherapySessionDialog } from "@/components/patient/case-sheet/RecordTherapySessionDialog";
import { TherapyPlanProgress, TherapyStatusBadge } from "@/components/patient/case-sheet/TherapyPlanPanel";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useMyTherapySessions } from "@/hooks/query/useVisitTherapy";
import { formatDateInIST, formatISODateInIST } from "@/lib/utils/date-time";
import { therapyProcedureLabel, type TherapyWorkItem } from "@/types/visit-therapy.types";

interface PatientGroup {
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  plans: TherapyWorkItem[];
}

function groupByPatient(items: TherapyWorkItem[]): PatientGroup[] {
  const groups = new Map<string, PatientGroup>();
  for (const item of items) {
    const existing = groups.get(item.patientId);
    if (existing) {
      groups.set(item.patientId, { ...existing, plans: [...existing.plans, item] });
      continue;
    }
    groups.set(item.patientId, {
      patientId: item.patientId,
      patientName: item.patientName?.trim() || "Unnamed patient",
      patientPhone: item.patientPhone,
      plans: [item],
    });
  }
  return [...groups.values()].sort((a, b) => a.patientName.localeCompare(b.patientName));
}

function lastSessionLabel(plan: TherapyWorkItem): string {
  const last = plan.sessions[plan.sessions.length - 1];
  return last ? `Last session ${formatDateInIST(last.sessionDate)}` : "No session yet";
}

function PlanRow({ clinicId, plan }: { clinicId: string; plan: TherapyWorkItem }) {
  return (
    <div className="flex flex-col gap-y-3 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-foreground">{therapyProcedureLabel(plan)}</h4>
            <TherapyStatusBadge status={plan.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {plan.opdNumber ? <span className="font-medium">{plan.opdNumber}</span> : null}
            <span>
              {formatDateInIST(plan.startDate)}
              {plan.endDate ? ` – ${formatDateInIST(plan.endDate)}` : ""}
            </span>
            {plan.frequency ? <span>{plan.frequency}</span> : null}
            <span>{lastSessionLabel(plan)}</span>
          </div>
        </div>
        <RecordTherapySessionDialog clinicId={clinicId} plan={plan} />
      </div>
      <TherapyPlanProgress completed={plan.completedSessions} planned={plan.plannedSessions} />
      {plan.medicinesUsed || plan.notes ? (
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          {plan.medicinesUsed ? (
            <p>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Medicines
              </span>
              <br />
              {plan.medicinesUsed}
            </p>
          ) : null}
          {plan.notes ? (
            <p>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Doctor&apos;s notes
              </span>
              <br />
              {plan.notes}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The therapist's work list: every open plan assigned to them, grouped by
 * patient, with a one-tap "Record session" per plan.
 */
export function TherapistSessionsContent() {
  useAuth();
  const { clinicId } = useClinicContext();
  const [date, setDate] = useState<string>(() => formatISODateInIST(new Date()));
  const query = useMyTherapySessions(clinicId || "", date || undefined);
  const groups = useMemo(() => groupByPatient(query.data ?? []), [query.data]);
  const planCount = query.data?.length ?? 0;
  const today = formatISODateInIST(new Date());

  const headerMeta = (
    <span className="text-sm font-medium text-muted-foreground">
      {planCount} open plan{planCount === 1 ? "" : "s"}
      {date ? ` on ${formatDateInIST(date)}` : ""}
    </span>
  );

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Therapist"
        title="My Sessions"
        description="Therapy plans assigned to you. Record each session as you complete it; the doctor's case sheet updates instantly."
        meta={headerMeta}
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="therapy-work-date">Show plans active on</Label>
            <Input
              id="therapy-work-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-48"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setDate(today)} disabled={date === today}>
            <CalendarDays className="mr-1 size-4" />
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDate("")} disabled={!date}>
            All open plans
          </Button>
        </CardContent>
      </Card>

      {query.isPending ? (
        <SkeletonList items={3} />
      ) : groups.length === 0 ? (
        <Empty>
          <EmptyContent>
            <EmptyMedia>
              <ClipboardList className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Nothing assigned{date ? " for this day" : ""}</EmptyTitle>
            <EmptyDescription>
              Plans appear here once a doctor assigns you as the therapist on a patient&apos;s case sheet.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      ) : (
        groups.map((group) => (
          <Card key={group.patientId} className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-bold">
                <span className="inline-flex items-center gap-2">
                  <UserRound className="size-4 text-muted-foreground" />
                  {group.patientName}
                </span>
                {group.patientPhone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Phone className="size-3" />
                    {group.patientPhone}
                  </span>
                ) : null}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {group.plans.length} plan{group.plans.length === 1 ? "" : "s"}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-3">
              {group.plans.map((plan) => (
                <PlanRow key={plan.id} clinicId={clinicId || ""} plan={plan} />
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </DashboardPageShell>
  );
}
