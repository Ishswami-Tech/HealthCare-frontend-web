"use client";

import { Suspense } from "react";
import { AssistantPrescribeScreen } from "@/components/assistant/AssistantPrescribeScreen";

// AsPrescribe (B4).
export default function AsPrescribePage() {
  return (
    <Suspense fallback={null}>
      <AssistantPrescribeScreen variant="prepare" />
    </Suspense>
  );
}
