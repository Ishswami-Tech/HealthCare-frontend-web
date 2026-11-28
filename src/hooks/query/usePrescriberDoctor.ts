"use client";

import { useMemo } from "react";
import { useClinicDoctorRows, useCurrentDoctorEntityId } from "./useDoctors";
import { useStaffRole } from "@/hooks/utils/useStaffRole";

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export interface ClinicDoctorRef {
  /** Doctor entity id (what `Prescription.doctorId` and `GET /queue?doctorId=` expect). */
  id: string;
  /** The doctor's user id (what the appointment filters expect). */
  userId: string;
  name: string;
  role: string;
}

/** A clinic doctor row of `GET /clinics/:id/doctors` (flat or `{ doctor: { user } }`). */
export function toClinicDoctorRef(row: unknown): ClinicDoctorRef | null {
  const record = asRecord(row);
  const nested = asRecord(record.doctor);
  const user = asRecord(nested.user ?? record.user);
  const id = text(nested.id) || text(record.id);
  if (!id) return null;
  const name =
    text(record.name) ||
    text(user.name) ||
    [text(user.firstName), text(user.lastName)].filter(Boolean).join(" ") ||
    "Doctor";
  return {
    id,
    userId: text(record.userId) || text(nested.userId) || text(user.id),
    name,
    role: (text(record.role) || text(user.role)).toUpperCase(),
  };
}

/** The clinic's doctor (the product has one): the first row that is not an assistant doctor. */
export function pickClinicDoctor(rows: unknown): ClinicDoctorRef | null {
  const doctors = (Array.isArray(rows) ? rows : [])
    .map(toClinicDoctorRef)
    .filter((doctor): doctor is ClinicDoctorRef => doctor !== null);
  return doctors.find((doctor) => doctor.role === "DOCTOR") ?? doctors.find((doctor) => doctor.role !== "ASSISTANT_DOCTOR") ?? null;
}

/**
 * The doctor a prescription is written for, and whose queue and appointments a screen shows.
 * - DOCTOR: themselves.
 * - ASSISTANT_DOCTOR: the clinic's doctor, who approves the assistant's drafts.
 */
export function usePrescriberDoctor(clinicId: string) {
  const { isAssistant } = useStaffRole();
  const own = useCurrentDoctorEntityId(clinicId);
  // Same cache entry as `useCurrentDoctorEntityId`: no second request.
  const rowsQuery = useClinicDoctorRows(clinicId);
  const clinicDoctor = useMemo(() => (isAssistant ? pickClinicDoctor(rowsQuery.data) : null), [isAssistant, rowsQuery.data]);

  if (!isAssistant) {
    return { doctorId: own.doctorId, doctorUserId: own.doctorUserId, doctorName: "", isResolving: own.isResolvingDoctorId };
  }
  return {
    doctorId: clinicDoctor?.id ?? "",
    doctorUserId: clinicDoctor?.userId ?? "",
    doctorName: clinicDoctor?.name ?? "",
    isResolving: Boolean(clinicId) && rowsQuery.isPending,
  };
}
