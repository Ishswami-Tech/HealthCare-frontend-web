"use client";

import { Suspense } from "react";
import { AssistantDispenseScreen } from "@/components/assistant/AssistantDispenseScreen";

// AsDispense (B4): dispense from clinic stock (`?patientId=` preselects the patient).
export default function AsDispensePage() {
  return (
    <Suspense fallback={null}>
      <AssistantDispenseScreen />
    </Suspense>
  );
}
