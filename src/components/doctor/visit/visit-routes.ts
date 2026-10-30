/** Links between the doctor's visit, prescription, follow-up and dispense screens (B7). */

export const visitHref = (appointmentId: string, part?: "summary" | "complete") =>
  `/doctor/visit/${encodeURIComponent(appointmentId)}${part ? `/${part}` : ""}`;

export const rxHref = (prescriptionId: string, part?: "print" | "sent", query?: string) =>
  `/doctor/prescriptions/${encodeURIComponent(prescriptionId)}${part ? `/${part}` : ""}${query ? `?${query}` : ""}`;

export const followUpHref = (appointmentId: string) =>
  `/doctor/follow-up?appointmentId=${encodeURIComponent(appointmentId)}`;

/**
 * The doctor's stock hand-over. It is a tab of the Prescriptions screen (`?tab=handover`), so the
 * link carries the tab plus the pre-fills the hand-over form reads (patient, visit, prescription).
 */
export const dispenseHref = (input: { patientId?: string; appointmentId?: string; prescriptionId?: string }) => {
  const params = new URLSearchParams({ tab: "handover" });
  if (input.patientId) params.set("patientId", input.patientId);
  if (input.appointmentId) params.set("appointmentId", input.appointmentId);
  if (input.prescriptionId) params.set("prescriptionId", input.prescriptionId);
  return `/doctor/prescriptions?${params.toString()}`;
};

/** The visit's diagnosis screen (symptoms, diagnosis, advice), then on to the prescription. */
export const diagnosisHref = (appointmentId: string, patientId?: string) => {
  const params = new URLSearchParams({ appointmentId });
  if (patientId) params.set("patientId", patientId);
  return `/doctor/diagnosis?${params.toString()}`;
};

/** Order lab tests / imaging for the visit's patient. */
export const investigationsHref = (appointmentId: string, patientId?: string) => {
  const params = new URLSearchParams({ appointmentId });
  if (patientId) params.set("patientId", patientId);
  return `/doctor/investigations?${params.toString()}`;
};
