"use client";

import { usePatientUiStore } from "@/stores/patient-ui.store";
import { PatientQrGateDialog } from "@/components/patient/PatientQrGateDialog";

export function PatientQrGateHost() {
  const isQrGateOpen = usePatientUiStore((state) => state.isQrGateOpen);
  const qrGateConfig = usePatientUiStore((state) => state.qrGateConfig);
  const closeQrGate = usePatientUiStore((state) => state.closeQrGate);

  return (
    <PatientQrGateDialog
      open={isQrGateOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeQrGate();
        }
      }}
      {...qrGateConfig}
    />
  );
}
