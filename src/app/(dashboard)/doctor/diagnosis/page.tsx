import { Suspense } from "react";
import { DiagnosisContent } from "./_components/DiagnosisContent";

// DocDiagnosis (B6): complaint and diagnosis of an OPD visit (`?appointmentId=`).
export default function DocDiagnosisPage() {
  return (
    <Suspense fallback={null}>
      <DiagnosisContent />
    </Suspense>
  );
}
