import { Suspense } from "react";
import { DoctorNewPrescriptionScreen } from "@/components/doctor/rx/DoctorNewPrescriptionScreen";

// DocNewPrescription / DocQuickRx (B6): full-page prescribing. `?patientId=` and / or `?appointmentId=`;
// `?repeatFrom=<prescriptionId>` starts from a copy of that prescription.
export default function DocNewPrescriptionPage() {
  return (
    <Suspense fallback={null}>
      <DoctorNewPrescriptionScreen />
    </Suspense>
  );
}
