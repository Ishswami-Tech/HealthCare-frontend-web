"use client";

import { useMemo, useState } from "react";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { useMyInPersonToday } from "@/hooks/query/useInPerson";
import { toHomeVisit } from "@/components/patient/home/homeData";
import { useLanguage } from "@/lib/i18n/context";
import {
  PatientQueueEmptyView,
  PatientQueueErrorView,
  PatientQueueLoadingView,
  PatientQueueView,
} from "./PatientQueueView";
import { pickQueuedVisit, readAppointments, toVisitInfo, toVisitTicket } from "@/components/patient/queue/queueData";

/**
 * Data container for the patient Live Queue (V2). Token, people ahead, ETA and "you're next"
 * come from `GET in-person/me/today` (polled every 20 s while visible); the clinic address and
 * phone come from the patient's own appointment.
 */
export function PatientQueueContent() {
  const { data: visits, isPending, isFetching, error, refetch } = useMyInPersonToday({ live: true });
  const { data: appointmentsData } = useMyAppointments();
  const [now] = useState(() => Date.now());
  const { language } = useLanguage();

  const appointments = useMemo(() => readAppointments(appointmentsData), [appointmentsData]);
  const queued = pickQueuedVisit(visits);
  const ticket = toVisitTicket(queued);

  const queueVisit = useMemo(() => {
    if (!queued) return null;
    const row = appointments.find((appointment) => String(appointment.id ?? "") === queued.appointmentId) ?? null;
    return row ? { row, visit: toHomeVisit(row, now, language) } : null;
  }, [appointments, queued, now, language]);

  if (queued && ticket) {
    const info = toVisitInfo(queueVisit?.row, queueVisit?.visit);
    return (
      <PatientQueueView
        appointmentId={queued.appointmentId}
        ticket={ticket}
        info={{
          ...info,
          doctorName: info.doctorName ?? queued.doctorName,
          locationLabel: info.locationLabel ?? queued.locationName,
        }}
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

  // For the empty state: an in-clinic visit booked for today that is not checked in yet.
  const booked = (visits ?? []).find((visit) => visit.stage === "BOOKED") ?? null;
  return (
    <PatientQueueEmptyView
      canCheckIn={Boolean(booked)}
      visitLine={booked ? [booked.doctorName, `Today, ${booked.time}`, booked.locationName].filter(Boolean).join(" · ") : null}
    />
  );
}
