"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type PatientQrGateConfig = {
  title?: string;
  description?: string;
  closeLabel?: string;
  bookLabel?: string;
  onBookAppointment?: () => void;
};

interface PatientUiState {
  isQrGateOpen: boolean;
  qrGateConfig: PatientQrGateConfig;
  openQrGate: (config?: PatientQrGateConfig) => void;
  closeQrGate: () => void;
}

const defaultQrGateConfig: PatientQrGateConfig = {
  title: "You need an in-person appointment",
  description:
    "QR scan is available only for in-person visits. Book an appointment first, then return here to scan the clinic QR.",
  closeLabel: "Close",
  bookLabel: "Book appointment",
};

export const usePatientUiStore = create<PatientUiState>()(
  devtools(
    immer((set) => ({
      isQrGateOpen: false,
      qrGateConfig: defaultQrGateConfig,
      openQrGate: (config = {}) =>
        set((state) => {
          state.isQrGateOpen = true;
          state.qrGateConfig = {
            ...defaultQrGateConfig,
            ...config,
          };
        }),
      closeQrGate: () =>
        set((state) => {
          state.isQrGateOpen = false;
        }),
    })),
    {
      name: "healthcare-patient-ui-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
