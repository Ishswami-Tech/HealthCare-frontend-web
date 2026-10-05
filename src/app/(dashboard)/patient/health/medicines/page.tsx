import { Suspense } from "react";
import PatientPrescriptions from "@/components/patient/PatientPrescriptionsContent";

export default function PatientMedicinesPage() {
  return (
    <Suspense fallback={null}>
      <PatientPrescriptions />
    </Suspense>
  );
}
