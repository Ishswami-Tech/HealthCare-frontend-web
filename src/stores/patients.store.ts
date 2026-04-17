"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type PatientCollectionScope =
  | "clinic"
  | "doctor"
  | "therapist"
  | "counselor"
  | "nurse";

export type PatientStoreItem = Record<string, any>;

interface PatientStoreState {
  collections: Record<PatientCollectionScope, PatientStoreItem[]>;
  selectedPatient: PatientStoreItem | null;
  setCollection: (scope: PatientCollectionScope, patients: PatientStoreItem[]) => void;
  clearCollection: (scope: PatientCollectionScope) => void;
  setSelectedPatient: (patient: PatientStoreItem | null) => void;
  reset: () => void;
}

const initialCollections: Record<PatientCollectionScope, PatientStoreItem[]> = {
  clinic: [],
  doctor: [],
  therapist: [],
  counselor: [],
  nurse: [],
};

export const usePatientStore = create<PatientStoreState>()(
  devtools(
    (set) => ({
      collections: initialCollections,
      selectedPatient: null,
      setCollection: (scope, patients) =>
        set((state) => ({
          collections: {
            ...state.collections,
            [scope]: patients,
          },
        })),
      clearCollection: (scope) =>
        set((state) => ({
          collections: {
            ...state.collections,
            [scope]: [],
          },
        })),
      setSelectedPatient: (patient) => set({ selectedPatient: patient }),
      reset: () =>
        set({
          collections: initialCollections,
          selectedPatient: null,
        }),
    }),
    {
      name: "patients-store",
    }
  )
);
