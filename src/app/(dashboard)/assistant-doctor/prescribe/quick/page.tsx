"use client";

import { Suspense } from "react";
import { AssistantPrescribeScreen } from "@/components/assistant/AssistantPrescribeScreen";

// AsQuickRx (B4): the same draft dialog, reached search-first.
export default function AsQuickRxPage() {
  return (
    <Suspense fallback={null}>
      <AssistantPrescribeScreen variant="quick" />
    </Suspense>
  );
}
