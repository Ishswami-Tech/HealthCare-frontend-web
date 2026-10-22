"use client";

import Link from "next/link";
import { Check, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar, LoadError, Note, Pill, SectionTitle, SkeletonRows, Surface, TbdPage, VisitTypeChip } from "@/components/tbd";
import { mapDoctorAppointmentToTimelineItem, formatClock } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import { draftTimeLabel, isReturned } from "@/components/prescription-drafts/rx-drafts.logic";
import { DraftStatusPill } from "@/components/prescription-drafts/DraftsTable";
import { useAppointment } from "@/hooks/query/useAppointments";
import { useDirectDispenses } from "@/hooks/query/useDirectDispense";
import { useRxDrafts } from "@/hooks/query/useRxDrafts";
import { cn } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/types/appointment.types";
import { appointmentStage, STAGE_LABELS } from "./assistant-day.logic";
import { ASSISTANT_ROUTES } from "./assistant-routes";
import { useAssistantDay } from "./useAssistantDay";

type StepState = "done" | "current" | "todo" | "optional";

function Step({ title, detail, state }: { title: string; detail: string; state: StepState }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
          state === "done" && "bg-brand text-white",
          state === "current" && "bg-[#fef3c7] text-[#92400e] dark:bg-amber-500/15 dark:text-amber-300",
          (state === "todo" || state === "optional") && "bg-well text-ink-muted",
        )}
      >
        {state === "done" ? <Check className="size-3.5" /> : state === "current" ? <Clock className="size-3.5" /> : <Circle className="size-2.5" />}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-sm font-bold", state === "todo" || state === "optional" ? "text-ink-muted" : "text-ink")}>{title}</span>
        <span className="text-xs text-ink-muted">{detail}</span>
      </span>
    </li>
  );
}

/**
 * AsVisitFlow: one in-clinic visit as the assistant follows it. Stages (no vitals):
 * checked in → with doctor → prescription (draft by assistant, approved by doctor) →
 * dispensing (optional) → completed (doctor only).
 */
export function AssistantVisitScreen({ appointmentId }: { appointmentId: string }) {
  const day = useAssistantDay();
  const appointmentQuery = useAppointment(appointmentId);
  const raw = appointmentQuery.data as AppointmentWithRelations | undefined;
  const visit = raw ? mapDoctorAppointmentToTimelineItem(raw, day.today) : null;
  const patientId = visit?.patientId ?? "";
  const drafts = useRxDrafts(day.clinicId, { enabled: Boolean(patientId) });
  const dispenses = useDirectDispenses(day.clinicId, { ...(patientId ? { patientId } : {}), limit: 5 });
  const draft = (drafts.data ?? []).find((entry) => entry.patientId === patientId) ?? null;
  const queueRow = day.queue.find((row) => row.appointmentId === appointmentId) ?? null;
  const handedOver = patientId ? (dispenses.data ?? []).filter((entry) => String(entry.status).toUpperCase() === "DISPENSED") : [];
  const doctor = day.doctor.doctorName || "the doctor";

  if (appointmentQuery.error && !raw) {
    return (
      <TbdPage title="Visit" backHref={ASSISTANT_ROUTES.queue} backLabel="Queue">
        <Surface flush>
          <LoadError title="This visit could not be opened" onRetry={() => void appointmentQuery.refetch()} />
        </Surface>
      </TbdPage>
    );
  }
  if (!visit) {
    return (
      <TbdPage title="Visit" backHref={ASSISTANT_ROUTES.queue} backLabel="Queue">
        <Surface flush>
          <SkeletonRows rows={4} />
        </Surface>
      </TbdPage>
    );
  }

  const stage = appointmentStage(visit);
  const withDoctorDone = stage === "COMPLETED";
  const steps: Array<{ title: string; detail: string; state: StepState }> = [
    {
      title: "Checked in",
      detail: visit.checkedInAt ? `At ${formatClock(visit.checkedInAt)}` : "The patient scans the clinic QR or the front desk checks them in",
      state: visit.checkedInAt || stage === "WITH_DOCTOR" || withDoctorDone ? "done" : "current",
    },
    {
      title: "With doctor",
      detail:
        stage === "WITH_DOCTOR"
          ? `${doctor} is seeing the patient`
          : withDoctorDone
            ? "Seen"
            : stage === "IN_QUEUE"
              ? `${doctor} calls next${queueRow?.waitMinutes !== null && queueRow?.waitMinutes !== undefined ? ` · waiting ${queueRow.waitMinutes} min` : ""}`
              : "After check-in",
      state: withDoctorDone ? "done" : stage === "WITH_DOCTOR" || stage === "IN_QUEUE" ? "current" : "todo",
    },
    {
      title: "Prescription",
      detail: draft
        ? isReturned(draft)
          ? `Returned by ${doctor} · ${draftTimeLabel(draft.returnedAt)}`
          : `Draft awaiting ${doctor} · ${draftTimeLabel(draft.submittedAt)}`
        : "Draft by assistant, approved by doctor",
      state: draft ? "current" : "todo",
    },
    {
      title: "Dispensing",
      detail: handedOver.length > 0 ? `${handedOver.length} hand-over${handedOver.length === 1 ? "" : "s"} from clinic stock` : "Clinic stock, if needed",
      state: handedOver.length > 0 ? "done" : "optional",
    },
    { title: "Completed", detail: `${doctor} only`, state: withDoctorDone ? "done" : "todo" },
  ];
  const stageMeta = STAGE_LABELS[stage];

  return (
    <TbdPage title={queueRow?.token ? `Visit ${queueRow.token}` : "Visit"} backHref={ASSISTANT_ROUTES.queue} backLabel="Queue">
      <Surface className="flex-row flex-wrap items-center gap-4">
        <InitialsAvatar name={visit.patientName} size={52} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xl font-extrabold text-ink">{visit.patientName}</span>
          <span className="text-xs text-ink-muted">{[visit.patientMeta, visit.reason].filter(Boolean).join(" · ")}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={stageMeta.tone}>{stageMeta.label}</Pill>
            <VisitTypeChip type={visit.isVideo ? "VIDEO_CALL" : "IN_PERSON"} />
            <Pill tone="slate">Booked {visit.timeLabel}</Pill>
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="gap-4">
          <SectionTitle title="Visit progress" description="Who did what, and when. Only the doctor calls the patient and completes the visit." />
          <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
            {steps.map((step) => (
              <Step key={step.title} {...step} />
            ))}
          </ol>
        </Surface>
        <aside className="flex flex-col gap-5">
          <Surface className="gap-3">
            <SectionTitle title="Your next action" />
            {stage === "COMPLETED" || stage === "CLOSED" ? (
              <p className="m-0 text-sm text-ink-muted">This visit is closed.</p>
            ) : draft ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink">Rx draft</span>
                  <DraftStatusPill status={draft.status} />
                </div>
                <Button asChild size="md">
                  <Link href={isReturned(draft) ? ASSISTANT_ROUTES.returnedDraft(draft.id) : ASSISTANT_ROUTES.draft(draft.id)}>
                    {isReturned(draft) ? "Revise the draft" : "Open the draft"}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="m-0 text-sm text-ink-soft">
                  {visit.patientName} is in the queue for {doctor}. Prepare the Rx draft now; the doctor approves it during the consult.
                </p>
                <Button asChild size="md">
                  <Link href={ASSISTANT_ROUTES.prescribe({ patientId, appointmentId })}>Prepare Rx draft</Link>
                </Button>
              </>
            )}
            {stage !== "CLOSED" ? (
              <Button asChild size="md" variant="outline">
                <Link href={ASSISTANT_ROUTES.dispenseTo({ patientId })}>Dispense from stock</Link>
              </Button>
            ) : null}
            <Button asChild size="md" variant="outline">
              <Link href={ASSISTANT_ROUTES.patient(patientId)}>Open EHR</Link>
            </Button>
          </Surface>
          <Note tone="blue">Need to change the order? Set priority from the queue.</Note>
        </aside>
      </div>
    </TbdPage>
  );
}
