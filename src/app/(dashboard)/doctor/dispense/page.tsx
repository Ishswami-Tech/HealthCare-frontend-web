import { Suspense } from "react";
import { DocDispenseView } from "@/components/doctor/visit/DocDispenseView";

// DocDispense (B7): hand medicines over from clinic stock (`?patientId=&appointmentId=&prescriptionId=`).
export default function DocDispensePage() {
  return (
    <Suspense>
      <DocDispenseView />
    </Suspense>
  );
}
