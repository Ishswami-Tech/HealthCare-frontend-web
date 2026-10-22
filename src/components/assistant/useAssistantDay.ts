"use client";

import { useMemo } from "react";
import { mapDoctorAppointmentToTimelineItem } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import { extractQueueDisplayItems } from "@/app/(dashboard)/queue/_components/queue.logic";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePrescriberDoctor } from "@/hooks/query/usePrescriberDoctor";
import { useQueue } from "@/hooks/query/useQueue";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatISODateInIST } from "@/lib/utils/appointmentUtils";
import type { AppointmentWithRelations } from "@/types/appointment.types";
import { toAssistantQueueRows } from "./assistant-day.logic";

function shiftDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00+05:30`);
  date.setDate(date.getDate() + days);
  return formatISODateInIST(date);
}

/**
 * The clinic doctor's appointments (a date range, default today) and the live in-clinic
 * queue, as the assistant sees them. One data source for the assistant dashboard,
 * appointments, prescribe and visit screens.
 */
export function useAssistantDay(range: { fromDays?: number; toDays?: number } = {}) {
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const doctor = usePrescriberDoctor(clinic);
  useWebSocketQuerySync();

  const today = useMemo(() => formatISODateInIST(new Date()), []);
  const startDate = shiftDays(today, range.fromDays ?? 0);
  const endDate = shiftDays(today, range.toDays ?? 0);

  const appointmentsQuery = useAppointments(
    clinic
      ? {
          clinicId: clinic,
          ...(doctor.doctorUserId ? { doctorId: doctor.doctorUserId } : {}),
          startDate,
          endDate,
          limit: 500,
        }
      : undefined,
    { enabled: Boolean(clinic) && !doctor.isResolving },
  );
  // GET /queue?doctorId= is keyed on the Doctor record id (see the doctor dashboard).
  const queueQuery = useQueue(clinic || undefined, {
    ...(doctor.doctorId ? { doctorId: doctor.doctorId } : {}),
    date: today,
    enabled: Boolean(clinic),
  });

  const appointments = useMemo(() => {
    const raw = appointmentsQuery.data as unknown;
    const list = Array.isArray(raw) ? raw : ((raw as { appointments?: unknown[] } | undefined)?.appointments ?? []);
    return (list as AppointmentWithRelations[])
      .map((appointment) => mapDoctorAppointmentToTimelineItem(appointment, today))
      .sort((a, b) => (a.startAtMs ?? 0) - (b.startAtMs ?? 0));
  }, [appointmentsQuery.data, today]);

  const queue = useMemo(() => toAssistantQueueRows(extractQueueDisplayItems(queueQuery.data)), [queueQuery.data]);

  return {
    clinicId: clinic,
    doctor,
    today,
    appointments,
    queue,
    appointmentsLoading: Boolean(clinic) && appointmentsQuery.isPending,
    appointmentsError: Boolean(appointmentsQuery.error) && !appointmentsQuery.data,
    queueLoading: Boolean(clinic) && queueQuery.isPending,
    refetch: () => {
      void appointmentsQuery.refetch();
      void queueQuery.refetch();
    },
  };
}
