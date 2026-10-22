"use client";

import { useParams, useRouter } from "next/navigation";
import { LoadError, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointment } from "@/hooks/query/useAppointments";
import { asRow } from "@/components/patient/home/homeData";
import { ReschedulePanel } from "@/components/appointments/reschedule/ReschedulePanel";

const BACK = "/doctor/appointments";

/** The doctor moves a visit: the same full-page panel (rule, day strip, open slots) as reception and patients. */
export default function DoctorReschedulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const appointmentId = String(params?.id ?? "");
  const { data, isPending, error, refetch } = useAppointment(appointmentId);
  const appointment = asRow(data);

  return (
    <TbdPage title="Reschedule appointment" description="Pick a new date and time." backHref={BACK} backLabel="Appointments">
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
          clinicId={String(session?.user?.clinicId ?? "")}
          backHref={BACK}
          onDone={() => router.push(BACK)}
        />
      )}
    </TbdPage>
  );
}
