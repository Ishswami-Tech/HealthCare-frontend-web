"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadError, SectionTitle, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointment, useCancelAppointment } from "@/hooks/query/useAppointments";
import { asRow } from "@/components/patient/home/homeData";
import { ReschedulePanel } from "@/components/appointments/reschedule/ReschedulePanel";
import { CancelVisitDialog } from "@/components/appointments/manager/ManagerDialogs";
import { toManagerVisit } from "@/components/appointments/manager/managerData";

const BACK = "/patient/appointments";

/** The 5-hour rule card of a video visit (backend: a video visit stays open 5 hours from its start). */
function VideoRuleCard() {
  return (
    <Surface as="section" aria-label="5-hour rule">
      <SectionTitle icon={Clock} title="5-hour rule" />
      <p className="m-0 text-[13px] leading-relaxed text-ink-soft">
        A video visit stays open for 5 hours from its start time. You can move it while it is confirmed and that window
        is still open, up to 2 times. After the window closes, the visit expires.
      </p>
      <p className="m-0 text-[13px] leading-relaxed text-ink-soft">
        Video visits are not cancelled from the app: reschedule instead. A visit the doctor cancels is always refunded in
        full.
      </p>
    </Surface>
  );
}

/** WebReschedule: the patient moves a visit (`/patient/appointments/:id/reschedule`). */
export default function PatientReschedulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const appointmentId = String(params?.id ?? "");
  const { data, isPending, error, refetch } = useAppointment(appointmentId);
  const appointment = asRow(data);
  const cancel = useCancelAppointment();
  const [cancelOpen, setCancelOpen] = useState(false);
  const visit = useMemo(
    () => (appointment ? toManagerVisit(appointment, { now: Date.now(), viewerRole: "PATIENT", staffView: false }) : null),
    [appointment],
  );

  const confirmCancel = async () => {
    if (!visit) return;
    try {
      await cancel.mutateAsync({ id: visit.id, reason: "Cancelled by the patient from the reschedule page" });
      router.push(BACK);
    } catch {
      // The mutation hook shows the error toast.
    }
  };

  return (
    <TbdPage
      title={visit?.kind === "video" ? "Reschedule video visit" : "Reschedule visit"}
      description={visit ? `Pick a new time with ${visit.doctorName}. Your booking ID stays the same.` : undefined}
      backHref={BACK}
      backLabel="Appointments"
    >
      {isPending ? (
        <SkeletonRows rows={4} />
      ) : error || !appointment || !visit ? (
        <Surface flush>
          <LoadError
            title="This visit could not be loaded"
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </Surface>
      ) : (
        <>
          <ReschedulePanel
            appointment={appointment}
            audience="patient"
            clinicId={String(session?.user?.clinicId ?? "")}
            backHref={BACK}
            onDone={() => router.push(BACK)}
            aside={
              <>
                {visit.kind === "video" ? <VideoRuleCard /> : null}
                {visit.canCancel ? (
                  <Surface as="section" aria-label="Cancel instead">
                    <SectionTitle icon={RotateCcw} title="Cannot make any time?" />
                    <Button variant="outline" size="md" onClick={() => setCancelOpen(true)}>
                      Cancel this visit instead
                    </Button>
                  </Surface>
                ) : null}
              </>
            }
          />
          <CancelVisitDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            visit={visit}
            submitting={cancel.isPending}
            onConfirm={() => void confirmCancel()}
          />
        </>
      )}
    </TbdPage>
  );
}
