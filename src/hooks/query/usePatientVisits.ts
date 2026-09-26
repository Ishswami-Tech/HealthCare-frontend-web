import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import {
  createFamilyHistory,
  createFamilyMember,
  createPatientVisit,
  createPrakritiAssessmentForPatient,
  deleteFamilyHistory,
  deleteFamilyMember,
  getFamilyHistory,
  getPatientVisit,
  getPrakritiAssessmentsForPatient,
  getVisitCaseSheet,
  listFamilyMembers,
  listPatientVisits,
  recordCashPrescriptionPayment,
  updateFamilyHistory,
  updateFamilyMember,
  updatePatientVisit,
  upsertClassicalExamFindings,
  upsertVisitVitalsExamination,
} from "@/lib/actions/patient-visits.server";
import type {
  CreateFamilyHistoryInput,
  CreateFamilyMemberInput,
  CreatePatientVisitInput,
  CreatePrakritiAssessmentInput,
  UpdateFamilyHistoryInput,
  UpdateFamilyMemberInput,
  UpdatePatientVisitInput,
  UpsertClassicalExamFindingInput,
  UpsertVisitVitalsExaminationInput,
} from "@/types/patient-visit.types";

export const patientVisitKeys = {
  all: ["patient-visits"] as const,
  list: (clinicId: string, patientId: string) => ["patient-visits", "list", clinicId, patientId] as const,
  detail: (clinicId: string, visitId: string) => ["patient-visits", "detail", clinicId, visitId] as const,
  caseSheet: (clinicId: string, visitId: string) =>
    ["patient-visits", "case-sheet", clinicId, visitId] as const,
  familyHistory: (clinicId: string, userId: string) =>
    ["patient-visits", "family-history", clinicId, userId] as const,
  familyMembers: (clinicId: string, patientId: string) =>
    ["patient-visits", "family-members", clinicId, patientId] as const,
  prakriti: (clinicId: string, patientId: string) =>
    ["patient-visits", "prakriti", clinicId, patientId] as const,
};

// ===== PRAKRITI =====

export const usePrakritiAssessments = (clinicId: string, patientId: string) =>
  useQueryData(
    patientVisitKeys.prakriti(clinicId, patientId),
    async () => getPrakritiAssessmentsForPatient(clinicId, patientId),
    { enabled: !!clinicId && !!patientId },
  );

export const useCreatePrakritiAssessment = () =>
  useMutationOperation(
    async ({ clinicId, input }: { clinicId: string; input: CreatePrakritiAssessmentInput }) =>
      createPrakritiAssessmentForPatient(clinicId, input),
    {
      toastId: "prakriti-assessment-create",
      loadingMessage: "Saving Prakriti assessment...",
      successMessage: "Prakriti assessment saved",
      invalidateQueries: [[...patientVisitKeys.all], ["ayurveda"]],
    },
  );

// ===== VISITS =====

export const usePatientVisits = (
  clinicId: string,
  patientId: string,
  options: { limit?: number; offset?: number } = {},
) =>
  useQueryData(
    [...patientVisitKeys.list(clinicId, patientId), options],
    async () => listPatientVisits(clinicId, patientId, options),
    { enabled: !!clinicId && !!patientId },
  );

export const usePatientVisit = (clinicId: string, visitId: string) =>
  useQueryData(
    patientVisitKeys.detail(clinicId, visitId),
    async () => getPatientVisit(clinicId, visitId),
    { enabled: !!clinicId && !!visitId },
  );

export const useVisitCaseSheet = (clinicId: string, visitId: string) =>
  useQueryData(
    patientVisitKeys.caseSheet(clinicId, visitId),
    async () => getVisitCaseSheet(clinicId, visitId),
    { enabled: !!clinicId && !!visitId },
  );

export const useCreatePatientVisit = () =>
  useMutationOperation(
    async ({ clinicId, input }: { clinicId: string; input: CreatePatientVisitInput }) =>
      createPatientVisit(clinicId, input),
    {
      toastId: "patient-visit-create",
      loadingMessage: "Registering OPD visit...",
      successMessage: "OPD visit registered",
      invalidateQueries: [[...patientVisitKeys.all], ["patient-bills"], ["invoices"], ["payments"]],
    },
  );

export const useUpdatePatientVisit = () =>
  useMutationOperation(
    async ({
      clinicId,
      visitId,
      input,
    }: {
      clinicId: string;
      visitId: string;
      input: UpdatePatientVisitInput;
    }) => updatePatientVisit(clinicId, visitId, input),
    {
      toastId: "patient-visit-update",
      loadingMessage: "Saving...",
      successMessage: "Saved",
      invalidateQueries: [[...patientVisitKeys.all]],
    },
  );

export const useUpsertVisitVitalsExamination = () =>
  useMutationOperation(
    async ({
      clinicId,
      visitId,
      input,
    }: {
      clinicId: string;
      visitId: string;
      input: UpsertVisitVitalsExaminationInput;
    }) => upsertVisitVitalsExamination(clinicId, visitId, input),
    {
      toastId: "patient-visit-vitals",
      loadingMessage: "Saving examination...",
      successMessage: "Examination saved",
      invalidateQueries: [[...patientVisitKeys.all]],
    },
  );

export const useUpsertClassicalExamFindings = () =>
  useMutationOperation(
    async ({
      clinicId,
      visitId,
      findings,
    }: {
      clinicId: string;
      visitId: string;
      findings: UpsertClassicalExamFindingInput[];
    }) => upsertClassicalExamFindings(clinicId, visitId, findings),
    {
      toastId: "patient-visit-classical-exam",
      loadingMessage: "Saving findings...",
      successMessage: "Findings saved",
      invalidateQueries: [[...patientVisitKeys.all]],
    },
  );

// ===== FAMILY HISTORY =====

export const useFamilyHistory = (clinicId: string, userId: string) =>
  useQueryData(
    patientVisitKeys.familyHistory(clinicId, userId),
    async () => getFamilyHistory(clinicId, userId),
    { enabled: !!clinicId && !!userId },
  );

export const useCreateFamilyHistory = () =>
  useMutationOperation(
    async ({ clinicId, input }: { clinicId: string; input: CreateFamilyHistoryInput }) =>
      createFamilyHistory(clinicId, input),
    {
      toastId: "family-history-create",
      loadingMessage: "Adding family history...",
      successMessage: "Family history added",
      invalidateQueries: [[...patientVisitKeys.all], ["ehr"]],
    },
  );

export const useUpdateFamilyHistory = () =>
  useMutationOperation(
    async ({ clinicId, id, input }: { clinicId: string; id: string; input: UpdateFamilyHistoryInput }) =>
      updateFamilyHistory(clinicId, id, input),
    {
      toastId: "family-history-update",
      loadingMessage: "Saving...",
      successMessage: "Family history updated",
      invalidateQueries: [[...patientVisitKeys.all], ["ehr"]],
    },
  );

export const useDeleteFamilyHistory = () =>
  useMutationOperation(
    async ({ clinicId, id }: { clinicId: string; id: string }) => deleteFamilyHistory(clinicId, id),
    {
      toastId: "family-history-delete",
      loadingMessage: "Removing...",
      successMessage: "Family history removed",
      invalidateQueries: [[...patientVisitKeys.all], ["ehr"]],
    },
  );

// ===== FAMILY MEMBERS (dependents) =====

export const useFamilyMembers = (clinicId: string, patientId: string) =>
  useQueryData(
    patientVisitKeys.familyMembers(clinicId, patientId),
    async () => listFamilyMembers(clinicId, patientId),
    { enabled: !!clinicId && !!patientId },
  );

export const useCreateFamilyMember = () =>
  useMutationOperation(
    async ({ clinicId, input }: { clinicId: string; input: CreateFamilyMemberInput }) =>
      createFamilyMember(clinicId, input),
    {
      toastId: "family-member-create",
      loadingMessage: "Adding family member...",
      successMessage: "Family member added",
      invalidateQueries: [[...patientVisitKeys.all], ["patients"]],
    },
  );

export const useUpdateFamilyMember = () =>
  useMutationOperation(
    async ({ clinicId, id, input }: { clinicId: string; id: string; input: UpdateFamilyMemberInput }) =>
      updateFamilyMember(clinicId, id, input),
    {
      toastId: "family-member-update",
      loadingMessage: "Saving...",
      successMessage: "Family member updated",
      invalidateQueries: [[...patientVisitKeys.all], ["patients"]],
    },
  );

export const useDeleteFamilyMember = () =>
  useMutationOperation(
    async ({ clinicId, id }: { clinicId: string; id: string }) => deleteFamilyMember(clinicId, id),
    {
      toastId: "family-member-delete",
      loadingMessage: "Removing...",
      successMessage: "Family member removed",
      invalidateQueries: [[...patientVisitKeys.all], ["patients"]],
    },
  );

// ===== CASH PAYMENT (medicine desk) =====

export const useRecordCashPrescriptionPayment = () =>
  useMutationOperation(
    async ({
      clinicId,
      prescriptionId,
      amount,
    }: {
      clinicId: string;
      prescriptionId: string;
      amount?: number;
    }) => recordCashPrescriptionPayment(clinicId, prescriptionId, amount),
    {
      toastId: "prescription-cash-payment",
      loadingMessage: "Recording cash payment...",
      successMessage: "Cash payment recorded — ready to dispense",
      invalidateQueries: [
        ["prescriptions"],
        ["medicineDeskQueue"],
        ["pharmacyStats"],
        ["patient-bills"],
        ["invoices"],
        ["payments"],
      ],
    },
  );
