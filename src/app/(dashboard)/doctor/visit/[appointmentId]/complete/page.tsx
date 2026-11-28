import { Suspense } from "react";
import { DocCompleteVisitView } from "@/components/doctor/visit/DocCompleteVisitView";

// DocCompleteVisit (B7): confirm and close the visit (doctor only), optionally call the next patient.
export default async function DocCompleteVisitPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  return (
    <Suspense>
      <DocCompleteVisitView appointmentId={appointmentId} />
    </Suspense>
  );
}
