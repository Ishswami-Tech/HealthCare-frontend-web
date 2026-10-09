"use client";

import { useMemo, useState } from "react";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { usePatientQueue } from "@/hooks/query/usePatientQueue";
import { toHomeVisit } from "@/components/patient/home/homeData";
import { useLanguage } from "@/lib/i18n/context";
import {
  PatientQueueEmptyView,
  PatientQueueErrorView,
  PatientQueueLoadingView,
  PatientQueueView,
} from "./PatientQueueView";
import { readAppointments, selectClinicVisits, toQueueTicket, toVisitInfo } from "./queueData";

/**
 * Data container for the patient Live Queue. The place comes from `GET queue/me` (it reads
 * again every 30 seconds while the tab is visible); the clinic and doctor come from the
 * patient's own appointment.
 */
export function PatientQueueContent() {
  const { data: entry, isPending, isFetching, error, refetch } = usePatientQueue();
  const { data: appointmentsData } = useMyAppointments();
  const [now] = useState(() => Date.now());
  const { language } = useLanguage();

  const appointments = useMemo(() => readAppointments(appointmentsData), [appointmentsData]);

  const queueVisit = useMemo(() => {
    if (!entry) return null;
    const row = appointments.find((appointment) => String(appointment.id ?? "") === entry.appointmentId) ?? null;
    return row ? { row, visit: toHomeVisit(row, now, language) } : null;
  }, [appointments, entry, now, language]);

  // For the empty state: an in-clinic visit booked for today that is not checked in yet.
  const visitToCheckIn = useMemo(
    () =>
      selectClinicVisits(appointments, now).find(
        ({ visit }) => visit.isToday && visit.clinicStage === "upcoming"
      )?.visit ?? null,
    [appointments, now]
  );

  if (entry) {
    return (
      <PatientQueueView
        ticket={toQueueTicket(entry, queueVisit?.visit.tokenLabel)}
        info={toVisitInfo(queueVisit?.row, queueVisit?.visit)}
        onRefresh={() => void refetch()}
        isRefreshing={isFetching}
      />
    );
  }

  if (error) {
    return <PatientQueueErrorView onRetry={() => void refetch()} isRetrying={isFetching} />;
  }

  if (isPending) {
    return <PatientQueueLoadingView />;
  }

  return (
    <PatientQueueEmptyView
      canCheckIn={Boolean(visitToCheckIn)}
      visitLine={
        visitToCheckIn
          ? [visitToCheckIn.doctorName, visitToCheckIn.timeLabel ? `Today, ${visitToCheckIn.timeLabel}` : "Today"]
              .filter(Boolean)
              .join(" · ")
          : null
      }
    />
  );
}
