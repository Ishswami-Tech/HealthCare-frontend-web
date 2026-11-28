import { Suspense } from "react";
import { InvestigationsContent } from "./_components/InvestigationsContent";

// DocInvestigations (B6): order tests for a patient (`?patientId=`, `?appointmentId=`) and follow the orders.
export default function DocInvestigationsPage() {
  return (
    <Suspense fallback={null}>
      <InvestigationsContent />
    </Suspense>
  );
}
