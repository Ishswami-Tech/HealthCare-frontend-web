"use client";

import { DoctorPatientsWorkspace } from "@/app/(dashboard)/doctor/patients/_components/DoctorPatientsWorkspace";
import { ASSISTANT_ROUTES } from "@/components/assistant/assistant-routes";

// AsPatients (B5): the doctor's patient directory; prescriptions are saved as drafts for the doctor.
export default function AssistantDoctorPatientsPage() {
  return <DoctorPatientsWorkspace ehrBasePath={ASSISTANT_ROUTES.patients} eyebrow="Assistant doctor" title="Patients" />;
}
