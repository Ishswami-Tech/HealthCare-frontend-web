"use client";

import { useParams } from "next/navigation";
import { DoctorEhrContent } from "./_components/DoctorEhrContent";

/** EHR workspace of one patient: header, OPD visits, case sheet and the record tabs. */
export default function DoctorPatientDetailPage() {
  const params = useParams<{ id?: string }>();
  const patientId = String(params?.id || "").trim();

  return <DoctorEhrContent key={patientId} patientId={patientId} />;
}
