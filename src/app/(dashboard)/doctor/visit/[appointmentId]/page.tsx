import { Suspense } from "react";
import { DocVisitFlowView } from "@/components/doctor/visit/DocVisitFlowView";

// DocVisitFlow (B7): one visit from check-in to completion. Only checked-in visits reach the doctor.
export default async function DocVisitFlowPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  return (
    <Suspense>
      <DocVisitFlowView appointmentId={appointmentId} />
    </Suspense>
  );
}
