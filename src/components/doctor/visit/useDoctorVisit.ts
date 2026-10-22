"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { useAppointment, useStartAppointment } from "@/hooks/query/useAppointments";
import { useCallNextPatient, useQueue } from "@/hooks/query/useQueue";
import { usePrescriptions as useClinicPrescriptions } from "@/hooks/query/usePharmacy";
import { usePatientVisits } from "@/hooks/query/usePatientVisits";
import { useDirectDispenses } from "@/hooks/query/useDirectDispense";
import { extractQueueEntries, hasQueuePatientIdentity } from "@/lib/queue/queue-adapter";
import { formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";
import type { AppointmentWithRelations } from "@/types/appointment.types";
import {
  buildDoctorQueueLines,
  mapDoctorAppointmentToTimelineItem,
  type DoctorQueueLine,
} from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import {
  normalizeDoctorPrescriptionDetail,
  type DoctorPrescriptionDetail,
} from "@/app/(dashboard)/doctor/prescriptions/_components/doctor-prescriptions.logic";
import {
  buildVisitStages,
  nextVisitAction,
  pickVisitPrescription,
  visitTokenLabel,
  type VisitFacts,
} from "./visit-flow.logic";

type Raw = Record<string, unknown>;
const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const INACTIVE_QUEUE = new Set(["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"]);

export function todayKeyIST(): string {
  return formatDateInIST(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA");
}

/** Ticks every second while `active`, for the consult timer. */
export function useNowTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

/**
 * Everything the doctor's visit screens need for one appointment: the visit, its place in the
 * queue, the OPD case sheet id, the prescription written in it and the stock hand-overs, plus the
 * doctor-only actions (call, start). Completing lives on the complete-visit screen.
 */
export function useDoctorVisit(appointmentId: string) {
  const { session } = useAuth();
  const userId = String(session?.user?.id ?? "");
  const clinicId = useCurrentClinicId() || "";
  const { doctorId: doctorEntityId } = useCurrentDoctorEntityId(clinicId);
  // The queue and call-next are keyed on the Doctor RECORD id (check-in enqueues under appointment.doctorId).
  const queueDoctorId = doctorEntityId || userId;
  const todayKey = useMemo(() => todayKeyIST(), []);

  const appointmentQuery = useAppointment(appointmentId);
  const raw = appointmentQuery.data as AppointmentWithRelations | undefined;
  const appointment = useMemo(() => (raw ? mapDoctorAppointmentToTimelineItem(raw, todayKey) : null), [raw, todayKey]);
  const rawRecord = asRecord(raw);
  const patient = asRecord(rawRecord.patient);
  const patientId = asText(rawRecord.patientId) || asText(patient.id);
  const patientUserId = asText(patient.userId) || asText(asRecord(patient.user).id);
  const locationId = asText(rawRecord.locationId) || asText(asRecord(rawRecord.location).id);
  const locationName = asText(asRecord(rawRecord.location).name);
  const startedAt = appointment?.startedAt ?? null;

  // ── Queue (in clinic only) ──
  const queueQuery = useQueue(clinicId || undefined, {
    ...(queueDoctorId ? { doctorId: queueDoctorId } : {}),
    enabled: Boolean(clinicId) && appointment?.isVideo !== true,
  });
  const liveEntries = useMemo(
    () =>
      extractQueueEntries(queueQuery.data)
        .filter((entry) => hasQueuePatientIdentity(entry) && !INACTIVE_QUEUE.has(String(entry.status || "").toUpperCase()))
        .sort((a, b) => a.position - b.position),
    [queueQuery.data],
  );
  const queueEntry = liveEntries.find((entry) => entry.appointmentId === appointmentId) ?? null;
  const token = visitTokenLabel(queueEntry, rawRecord, asRecord(rawRecord.metadata));
  /** Checked-in patients still waiting for the doctor (never this visit, never video). */
  const waitingLines = useMemo<DoctorQueueLine[]>(
    () =>
      buildDoctorQueueLines(
        liveEntries.filter((entry) => entry.appointmentId !== appointmentId),
        new Map(),
      ).filter((line) => line.status !== "IN_PROGRESS" && line.appointmentId),
    [appointmentId, liveEntries],
  );

  // ── OPD visit (case sheet) ──
  const visitsQuery = usePatientVisits(clinicId, patientId, { limit: 20 });
  const visitId = useMemo(() => {
    const direct = asText(asRecord(rawRecord.visit).id) || asText(rawRecord.visitId) || asText(asRecord(rawRecord.metadata).visitId);
    if (direct) return direct;
    return visitsQuery.data?.visits.find((visit) => visit.appointmentId === appointmentId)?.id ?? "";
  }, [appointmentId, rawRecord, visitsQuery.data]);
  const opdNumber = useMemo(
    () =>
      asText(asRecord(rawRecord.visit).opdNumber) ||
      visitsQuery.data?.visits.find((visit) => visit.id === visitId)?.opdNumber ||
      "",
    [rawRecord, visitId, visitsQuery.data],
  );

  // ── Prescription written in this visit ──
  const prescriptionsQuery = useClinicPrescriptions(clinicId, {
    ...(patientUserId ? { patientId: patientUserId } : {}),
    enabled: Boolean(patientUserId),
  });
  const prescriptions = useMemo<DoctorPrescriptionDetail[]>(() => {
    const payload = prescriptionsQuery.data as unknown;
    const record = asRecord(payload);
    const list = Array.isArray(payload) ? payload : asList(record.prescriptions).length ? asList(record.prescriptions) : asList(record.data);
    return list.map(normalizeDoctorPrescriptionDetail).filter((row) => row.id);
  }, [prescriptionsQuery.data]);
  const prescription = useMemo(
    () =>
      pickVisitPrescription(
        prescriptions,
        { appointmentId, visitId, todayKey, startedAt },
        formatDateKeyInIST,
      ),
    [appointmentId, prescriptions, startedAt, todayKey, visitId],
  );

  // ── Hand-overs from clinic stock today ──
  const dispensesQuery = useDirectDispenses(clinicId, { patientId, limit: 20 }, { enabled: Boolean(patientId) });
  const todaysDispenses = useMemo(
    () =>
      (dispensesQuery.data ?? []).filter(
        (row) => row.status === "DISPENSED" && row.createdAt && formatDateKeyInIST(row.createdAt) === todayKey,
      ),
    [dispensesQuery.data, todayKey],
  );

  const facts = useMemo<VisitFacts | null>(
    () =>
      appointment
        ? {
            status: String(appointment.statusEnum || ""),
            isVideo: appointment.isVideo,
            checkedInAt: appointment.checkedInAt,
            startedAt,
            completedAt: asText(rawRecord.completedAt) || null,
            prescription: prescription ? { reference: prescription.reference, createdAt: prescription.date } : null,
            dispenseCount: todaysDispenses.length,
            lastDispensedAt: todaysDispenses[0]?.createdAt ?? null,
          }
        : null,
    [appointment, prescription, rawRecord.completedAt, startedAt, todaysDispenses],
  );
  const stages = useMemo(() => (facts ? buildVisitStages(facts) : []), [facts]);
  const nextAction = facts ? nextVisitAction(facts) : null;

  // ── Doctor-only actions ──
  const startMutation = useStartAppointment();
  const callNextMutation = useCallNextPatient();

  const startConsult = useCallback(async () => {
    if (!raw) return;
    await startMutation.mutateAsync({ appointmentId, doctorId: raw.doctorId || queueDoctorId });
    await appointmentQuery.refetch();
  }, [appointmentId, appointmentQuery, queueDoctorId, raw, startMutation]);

  /** POST /queue/call-next for a checked-in visit (doctor only). */
  const callPatient = useCallback(
    async (targetAppointmentId: string) => {
      if (!queueDoctorId || !targetAppointmentId) return;
      await callNextMutation.mutateAsync({ doctorId: queueDoctorId, appointmentId: targetAppointmentId });
      // Calling the patient in starts the consult on the API (IN_PROGRESS), so the visit moves on too.
      await Promise.all([queueQuery.refetch(), appointmentQuery.refetch()]);
    },
    [appointmentQuery, callNextMutation, queueDoctorId, queueQuery],
  );

  return {
    clinicId,
    userId,
    doctorEntityId: doctorEntityId || "",
    todayKey,
    raw,
    appointment,
    patientId,
    patientUserId,
    locationId,
    locationName,
    token,
    queueEntry,
    waitingLines,
    visitId,
    opdNumber,
    prescription,
    prescriptions,
    todaysDispenses,
    stages,
    nextAction,
    loading: appointmentQuery.isPending,
    error: appointmentQuery.error,
    retry: () => void appointmentQuery.refetch(),
    startConsult,
    startPending: startMutation.isPending,
    callPatient,
    callPending: callNextMutation.isPending,
  };
}

export type DoctorVisitData = ReturnType<typeof useDoctorVisit>;
