import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import {
  createVisitTherapyPlan,
  getTherapyProgress,
  listMyTherapySessions,
  listTherapists,
  listVisitTherapyPlans,
  recordTherapySession,
  updateTherapySession,
  updateVisitTherapyPlan,
} from "@/lib/actions/visit-therapy.server";
import type {
  CreateTherapyPlanInput,
  RecordTherapySessionInput,
  UpdateTherapyPlanInput,
  UpdateTherapySessionInput,
} from "@/types/visit-therapy.types";

export const visitTherapyKeys = {
  all: ["visit-therapy"] as const,
  plans: (clinicId: string, visitId: string) =>
    ["visit-therapy", "plans", clinicId, visitId] as const,
  progress: (clinicId: string, patientId: string) =>
    ["visit-therapy", "progress", clinicId, patientId] as const,
  mySessions: (clinicId: string, date?: string) =>
    ["visit-therapy", "my-sessions", clinicId, date ?? "all"] as const,
  therapists: (clinicId: string) => ["visit-therapy", "therapists", clinicId] as const,
};

// ===== QUERIES =====

export const useVisitTherapyPlans = (clinicId: string, visitId: string) =>
  useQueryData(
    visitTherapyKeys.plans(clinicId, visitId),
    async () => listVisitTherapyPlans(clinicId, visitId),
    { enabled: !!clinicId && !!visitId },
  );

export const useTherapyProgress = (clinicId: string, patientId: string) =>
  useQueryData(
    visitTherapyKeys.progress(clinicId, patientId),
    async () => getTherapyProgress(clinicId, patientId),
    { enabled: !!clinicId && !!patientId },
  );

export const useMyTherapySessions = (clinicId: string, date?: string) =>
  useQueryData(
    visitTherapyKeys.mySessions(clinicId, date),
    async () => listMyTherapySessions(clinicId, date),
    { enabled: !!clinicId },
  );

export const useTherapists = (clinicId: string) =>
  useQueryData(
    visitTherapyKeys.therapists(clinicId),
    async () => listTherapists(clinicId),
    { enabled: !!clinicId, staleTime: 5 * 60 * 1000 },
  );

// ===== MUTATIONS =====

export const useCreateTherapyPlan = () =>
  useMutationOperation(
    async ({
      clinicId,
      visitId,
      input,
    }: {
      clinicId: string;
      visitId: string;
      input: CreateTherapyPlanInput;
    }) => createVisitTherapyPlan(clinicId, visitId, input),
    {
      toastId: "therapy-plan-create",
      loadingMessage: "Adding therapy plan...",
      successMessage: "Therapy plan added",
      invalidateQueries: [[...visitTherapyKeys.all]],
    },
  );

export const useUpdateTherapyPlan = () =>
  useMutationOperation(
    async ({
      clinicId,
      planId,
      input,
    }: {
      clinicId: string;
      planId: string;
      input: UpdateTherapyPlanInput;
    }) => updateVisitTherapyPlan(clinicId, planId, input),
    {
      toastId: "therapy-plan-update",
      loadingMessage: "Saving...",
      successMessage: "Therapy plan updated",
      invalidateQueries: [[...visitTherapyKeys.all]],
    },
  );

export const useRecordTherapySession = () =>
  useMutationOperation(
    async ({
      clinicId,
      planId,
      input,
    }: {
      clinicId: string;
      planId: string;
      input: RecordTherapySessionInput;
    }) => recordTherapySession(clinicId, planId, input),
    {
      toastId: "therapy-session-record",
      loadingMessage: "Recording session...",
      successMessage: "Session recorded",
      invalidateQueries: [[...visitTherapyKeys.all]],
    },
  );

export const useUpdateTherapySession = () =>
  useMutationOperation(
    async ({
      clinicId,
      sessionId,
      input,
    }: {
      clinicId: string;
      sessionId: string;
      input: UpdateTherapySessionInput;
    }) => updateTherapySession(clinicId, sessionId, input),
    {
      toastId: "therapy-session-update",
      loadingMessage: "Saving...",
      successMessage: "Session updated",
      invalidateQueries: [[...visitTherapyKeys.all]],
    },
  );
