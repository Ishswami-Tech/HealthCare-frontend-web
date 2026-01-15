/**
 * ✅ Consolidated Medical Records Store
 * Follows DRY, SOLID, KISS principles
 * Single source of truth for medical records state management
 * Uses types from @/types/medical-records.types.ts
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
// ✅ Consolidated: Import types from @/types (single source of truth)
import type { 
  MedicalRecord,
  MedicalRecordFilters 
} from '@/types/medical-records.types';
import type { 
  Prescription,
  PrescriptionFilters,
  Medicine,
  MedicineFilters
} from '@/types/pharmacy.types';

// Re-export for convenience
export type { MedicalRecord, Prescription, Medicine };

interface MedicalRecordsState {
  // Medical Records
  medicalRecords: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  
  // Prescriptions
  prescriptions: Prescription[];
  selectedPrescription: Prescription | null;
  
  // Medicines
  medicines: Medicine[];
  selectedMedicine: Medicine | null;
  medicineSearchResults: Medicine[];
  
  // UI State
  isRecordModalOpen: boolean;
  isPrescriptionModalOpen: boolean;
  isMedicineModalOpen: boolean;
  currentTab: 'records' | 'prescriptions' | 'medicines';
  
  // Filters - ✅ Use types from @/types (single source of truth)
  recordFilters: Partial<MedicalRecordFilters>;
  prescriptionFilters: Partial<PrescriptionFilters>;
  medicineFilters: Partial<MedicineFilters>;
  
  // Actions - Medical Records
  setMedicalRecords: (records: MedicalRecord[]) => void;
  addMedicalRecord: (record: MedicalRecord) => void;
  updateMedicalRecord: (id: string, updates: Partial<MedicalRecord>) => void;
  removeMedicalRecord: (id: string) => void;
  selectRecord: (record: MedicalRecord | null) => void;
  
  // Actions - Prescriptions
  setPrescriptions: (prescriptions: Prescription[]) => void;
  addPrescription: (prescription: Prescription) => void;
  updatePrescription: (id: string, updates: Partial<Prescription>) => void;
  removePrescription: (id: string) => void;
  selectPrescription: (prescription: Prescription | null) => void;
  
  // Actions - Medicines
  setMedicines: (medicines: Medicine[]) => void;
  addMedicine: (medicine: Medicine) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  removeMedicine: (id: string) => void;
  selectMedicine: (medicine: Medicine | null) => void;
  setMedicineSearchResults: (results: Medicine[]) => void;
  
  // UI Actions
  setRecordModalOpen: (open: boolean) => void;
  setPrescriptionModalOpen: (open: boolean) => void;
  setMedicineModalOpen: (open: boolean) => void;
  setCurrentTab: (tab: 'records' | 'prescriptions' | 'medicines') => void;
  
  // Filter Actions
  setRecordFilters: (filters: Partial<MedicalRecordsState['recordFilters']>) => void;
  setPrescriptionFilters: (filters: Partial<MedicalRecordsState['prescriptionFilters']>) => void;
  setMedicineFilters: (filters: Partial<MedicalRecordsState['medicineFilters']>) => void;
  clearAllFilters: () => void;
  
  // Utility functions
  getRecordsByType: (type: string) => MedicalRecord[];
  getRecordsByPatient: (patientId: string) => MedicalRecord[];
  getActivePrescriptions: () => Prescription[];
  getPrescriptionsByPatient: (patientId: string) => Prescription[];
  getMedicinesByType: (type: string) => Medicine[];
  searchMedicinesLocal: (query: string) => Medicine[];
}

export const useMedicalRecordsStore = create<MedicalRecordsState>()(
  persist(
    (set, get) => ({
      // Initial state
      medicalRecords: [],
      selectedRecord: null,
      prescriptions: [],
      selectedPrescription: null,
      medicines: [],
      selectedMedicine: null,
      medicineSearchResults: [],
      isRecordModalOpen: false,
      isPrescriptionModalOpen: false,
      isMedicineModalOpen: false,
      currentTab: 'records',
      recordFilters: {},
      prescriptionFilters: {},
      medicineFilters: {},
      
      // Medical Records actions
      setMedicalRecords: (records) => set({ medicalRecords: records }),
      
      addMedicalRecord: (record) => {
        const medicalRecords = [...get().medicalRecords, record];
        set({ medicalRecords });
      },
      
      updateMedicalRecord: (id, updates) => {
        const medicalRecords = get().medicalRecords.map(record =>
          record.id === id ? { ...record, ...updates } : record
        );
        set({ medicalRecords });
      },
      
      removeMedicalRecord: (id) => {
        const medicalRecords = get().medicalRecords.filter(record => record.id !== id);
        set({ medicalRecords });
      },
      
      selectRecord: (record) => set({ selectedRecord: record }),
      
      // Prescriptions actions
      setPrescriptions: (prescriptions) => set({ prescriptions }),
      
      addPrescription: (prescription) => {
        const prescriptions = [...get().prescriptions, prescription];
        set({ prescriptions });
      },
      
      updatePrescription: (id, updates) => {
        const prescriptions = get().prescriptions.map(prescription =>
          prescription.id === id ? { ...prescription, ...updates } : prescription
        );
        set({ prescriptions });
      },
      
      removePrescription: (id) => {
        const prescriptions = get().prescriptions.filter(prescription => prescription.id !== id);
        set({ prescriptions });
      },
      
      selectPrescription: (prescription) => set({ selectedPrescription: prescription }),
      
      // Medicines actions
      setMedicines: (medicines) => set({ medicines }),
      
      addMedicine: (medicine) => {
        const medicines = [...get().medicines, medicine];
        set({ medicines });
      },
      
      updateMedicine: (id, updates) => {
        const medicines = get().medicines.map(medicine =>
          medicine.id === id ? { ...medicine, ...updates } : medicine
        );
        set({ medicines });
      },
      
      removeMedicine: (id) => {
        const medicines = get().medicines.filter(medicine => medicine.id !== id);
        set({ medicines });
      },
      
      selectMedicine: (medicine) => set({ selectedMedicine: medicine }),
      
      setMedicineSearchResults: (results) => set({ medicineSearchResults: results }),
      
      // UI Actions
      setRecordModalOpen: (open) => set({ isRecordModalOpen: open }),
      setPrescriptionModalOpen: (open) => set({ isPrescriptionModalOpen: open }),
      setMedicineModalOpen: (open) => set({ isMedicineModalOpen: open }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      
      // Filter Actions
      setRecordFilters: (filters) => {
        const recordFilters = { ...get().recordFilters, ...filters };
        set({ recordFilters });
      },
      
      setPrescriptionFilters: (filters) => {
        const prescriptionFilters = { ...get().prescriptionFilters, ...filters };
        set({ prescriptionFilters });
      },
      
      setMedicineFilters: (filters) => {
        const medicineFilters = { ...get().medicineFilters, ...filters };
        set({ medicineFilters });
      },
      
      clearAllFilters: () => {
        set({
          recordFilters: {},
          prescriptionFilters: {},
          medicineFilters: {},
        });
      },
      
      // Utility functions
      getRecordsByType: (type) => {
        return get().medicalRecords.filter(record => record.type === type);
      },
      
      getRecordsByPatient: (patientId) => {
        return get().medicalRecords.filter(record => record.patientId === patientId);
      },
      
      getActivePrescriptions: () => {
        // ✅ Use proper status from Prescription type (PENDING, DISPENSED, etc.)
        return get().prescriptions.filter(prescription => 
          prescription.status === 'PENDING' || prescription.status === 'PARTIALLY_DISPENSED'
        );
      },
      
      getPrescriptionsByPatient: (patientId) => {
        return get().prescriptions.filter(prescription => prescription.patientId === patientId);
      },
      
      getMedicinesByType: (type: string) => {
        // ✅ Filter by medicine type (CLASSICAL, PROPRIETARY, HERBAL, AYURVEDIC, SIDDHA, UNANI)
        return get().medicines.filter(medicine => medicine.type === type);
      },
      
      searchMedicinesLocal: (query: string) => {
        const searchTerm = query.toLowerCase();
        return get().medicines.filter(medicine =>
          medicine.name.toLowerCase().includes(searchTerm) ||
          medicine.genericName?.toLowerCase().includes(searchTerm) ||
          medicine.category?.toLowerCase().includes(searchTerm) ||
          medicine.manufacturer?.toLowerCase().includes(searchTerm)
        );
      },
    }),
    {
      name: "medical-records-storage",
      partialize: (state) => ({
        recordFilters: state.recordFilters,
        prescriptionFilters: state.prescriptionFilters,
        medicineFilters: state.medicineFilters,
        currentTab: state.currentTab,
      }),
    }
  )
);

// Selectors for better performance
export const useMedicalRecordsSelectors = () => {
  const store = useMedicalRecordsStore();
  
  return {
    activePrescriptions: store.getActivePrescriptions(),
    labTestRecords: store.getRecordsByType('LAB_TEST'),
    xrayRecords: store.getRecordsByType('XRAY'),
    mriRecords: store.getRecordsByType('MRI'),
    // Note: PRESCRIPTION is a valid MedicalRecord type in medical-records.types.ts
    prescriptionRecords: store.getRecordsByType('PRESCRIPTION'),
    diagnosisRecords: store.getRecordsByType('DIAGNOSIS_REPORT'),
    pulseRecords: store.getRecordsByType('PULSE_DIAGNOSIS'),
    classicalMedicines: store.getMedicinesByType('CLASSICAL'),
    proprietaryMedicines: store.getMedicinesByType('PROPRIETARY'),
    herbalMedicines: store.getMedicinesByType('HERBAL'),
    ayurvedicMedicines: store.getMedicinesByType('AYURVEDIC'),
    siddhaMedicines: store.getMedicinesByType('SIDDHA'),
    unaniMedicines: store.getMedicinesByType('UNANI'),
  };
};

// Helper hooks for common operations
export const useMedicalRecordsActions = () => {
  const store = useMedicalRecordsStore();
  
  return {
    // Records
    setMedicalRecords: store.setMedicalRecords,
    addMedicalRecord: store.addMedicalRecord,
    updateMedicalRecord: store.updateMedicalRecord,
    removeMedicalRecord: store.removeMedicalRecord,
    selectRecord: store.selectRecord,
    
    // Prescriptions
    setPrescriptions: store.setPrescriptions,
    addPrescription: store.addPrescription,
    updatePrescription: store.updatePrescription,
    removePrescription: store.removePrescription,
    selectPrescription: store.selectPrescription,
    
    // Medicines
    setMedicines: store.setMedicines,
    addMedicine: store.addMedicine,
    updateMedicine: store.updateMedicine,
    removeMedicine: store.removeMedicine,
    selectMedicine: store.selectMedicine,
    
    // UI
    setCurrentTab: store.setCurrentTab,
    setRecordModalOpen: store.setRecordModalOpen,
    setPrescriptionModalOpen: store.setPrescriptionModalOpen,
    setMedicineModalOpen: store.setMedicineModalOpen,
  };
};
