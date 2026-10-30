import { redirect } from "next/navigation";

// Stock hand-over (DocDispense, B7) was consolidated into the Prescriptions screen's
// "Stock hand-over" tab, so this route only forwards old links there — carrying over the
// pre-fill query (`?patientId=&appointmentId=&prescriptionId=`) so the tab lands pre-filled.
export default async function DocDispensePage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string | string[]; appointmentId?: string | string[]; prescriptionId?: string | string[] }>;
}) {
  const incoming = await searchParams;
  const params = new URLSearchParams({ tab: "handover" });
  (["patientId", "appointmentId", "prescriptionId"] as const).forEach((key) => {
    const value = incoming[key];
    if (typeof value === "string" && value) params.set(key, value);
  });
  redirect(`/doctor/prescriptions?${params.toString()}`);
}
