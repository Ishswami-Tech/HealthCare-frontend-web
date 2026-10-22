"use client";

import { useParams, useRouter } from "next/navigation";
import { LoadError, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { useAppointment } from "@/hooks/query/useAppointments";
import { asRow } from "@/components/patient/home/homeData";
import { ReschedulePanel } from "@/components/appointments/reschedule/ReschedulePanel";
import { NoClinicalRecordsNote } from "@/components/receptionist/ReceptionNotes";
import { RECEPTION_ROUTES, useReceptionLocation } from "@/components/receptionist/useReceptionDesk";

/** RecReschedule: move a visit when the patient asks (same rule and slot picker as the patient app). */
export default function ReceptionReschedulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const appointmentId = String(params?.id ?? "");
  const { clinicId } = useReceptionLocation();
  const { data, isPending, error, refetch } = useAppointment(appointmentId);
  const appointment = asRow(data);
  const back = RECEPTION_ROUTES.appointment(appointmentId);

  return (
    <TbdPage title="Reschedule appointment" description="Pick a new date and time." backHref={back} backLabel="Appointment">
      {isPending ? (
        <SkeletonRows rows={4} />
      ) : error || !appointment ? (
        <Surface flush>
          <LoadError
            title="The appointment could not be loaded"
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </Surface>
      ) : (
        <ReschedulePanel
          appointment={appointment}
          audience="staff"
          clinicId={clinicId}
          backHref={back}
          onDone={() => router.push(back)}
          aside={<NoClinicalRecordsNote />}
        />
      )}
    </TbdPage>
  );
}
