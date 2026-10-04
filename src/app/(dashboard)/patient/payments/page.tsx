import { Suspense } from "react";
import { PatientBillingContent } from "./_components/PatientBillingContent";

/** /patient/payments — Billing & Payments. Data and wiring: `PatientBillingContent`. */
export default function PatientBillingPage() {
  return (
    <Suspense fallback={null}>
      <PatientBillingContent />
    </Suspense>
  );
}
