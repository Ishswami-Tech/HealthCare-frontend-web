"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { tbdKeys, TBD_CACHE } from "./tbdQueryKeys";
import {
  approveRxDraft,
  discardRxDraft,
  getRxDraft,
  listRxDrafts,
  resubmitRxDraft,
  returnRxDraft,
  updateRxDraft,
} from "@/lib/actions/rx-drafts.server";
import type { UpdateRxDraftInput } from "@/types/rx-drafts.types";

/**
 * Prescription drafts: the assistant prepares, the doctor approves or returns.
 * One set of hooks for both roles; the server decides what each role sees.
 */

function unwrap<T>(result: { success: true; data: T } | { success: false; error: string }, fallback: string): T {
  if (!result.success) throw new Error(result.error || fallback);
  return result.data;
}

/** Every list that can change when a draft changes (drafts, prescriptions, pharmacy desk). */
const DRAFT_INVALIDATIONS = [["rx-drafts"], ["prescriptions"], ["prescription"], ["medicineDeskQueue"]];

export const useRxDrafts = (clinicId: string, options: { status?: string; days?: number; enabled?: boolean } = {}) =>
  useQueryData(
    tbdKeys.rxDrafts.list(clinicId, {
      ...(options.status ? { status: options.status } : {}),
      ...(options.days ? { days: options.days } : {}),
    }),
    async () => unwrap(await listRxDrafts(clinicId, options.status, options.days), "The drafts could not be loaded"),
    { enabled: Boolean(clinicId) && options.enabled !== false, ...TBD_CACHE.working },
  );

export const useRxDraft = (clinicId: string, draftId: string) =>
  useQueryData(
    tbdKeys.rxDrafts.detail(clinicId, draftId),
    async () => unwrap(await getRxDraft(clinicId, draftId), "This draft could not be loaded"),
    { enabled: Boolean(clinicId && draftId), ...TBD_CACHE.working },
  );

type DraftRef = { clinicId: string; draftId: string };

export const useUpdateRxDraft = () =>
  useMutationOperation(
    async ({ clinicId, draftId, input }: DraftRef & { input: UpdateRxDraftInput }) =>
      unwrap(await updateRxDraft(clinicId, draftId, input), "The draft could not be saved"),
    {
      toastId: "rx-draft-update",
      loadingMessage: "Saving the draft...",
      successMessage: "Draft saved",
      errorMessage: "The draft could not be saved. Please try again.",
      invalidateQueries: DRAFT_INVALIDATIONS,
    },
  );

export const useApproveRxDraft = () =>
  useMutationOperation(
    async ({ clinicId, draftId }: DraftRef) => unwrap(await approveRxDraft(clinicId, draftId), "The draft could not be approved"),
    {
      toastId: "rx-draft-approve",
      loadingMessage: "Approving...",
      successMessage: "Prescription approved and sent to the pharmacy",
      errorMessage: "The draft could not be approved. Please try again.",
      invalidateQueries: DRAFT_INVALIDATIONS,
    },
  );

export const useReturnRxDraft = () =>
  useMutationOperation(
    async ({ clinicId, draftId, note }: DraftRef & { note: string }) =>
      unwrap(await returnRxDraft(clinicId, draftId, note), "The draft could not be returned"),
    {
      toastId: "rx-draft-return",
      loadingMessage: "Sending back...",
      successMessage: "Draft returned to the assistant",
      errorMessage: "The draft could not be returned. Please try again.",
      invalidateQueries: DRAFT_INVALIDATIONS,
    },
  );

export const useResubmitRxDraft = () =>
  useMutationOperation(
    async ({ clinicId, draftId, note }: DraftRef & { note?: string }) =>
      unwrap(await resubmitRxDraft(clinicId, draftId, note), "The draft could not be resubmitted"),
    {
      toastId: "rx-draft-resubmit",
      loadingMessage: "Resubmitting...",
      successMessage: "Draft sent to the doctor again",
      errorMessage: "The draft could not be resubmitted. Please try again.",
      invalidateQueries: DRAFT_INVALIDATIONS,
    },
  );

export const useDiscardRxDraft = () =>
  useMutationOperation(
    async ({ clinicId, draftId }: DraftRef) => unwrap(await discardRxDraft(clinicId, draftId), "The draft could not be discarded"),
    {
      toastId: "rx-draft-discard",
      loadingMessage: "Discarding...",
      successMessage: "Draft discarded",
      errorMessage: "The draft could not be discarded. Please try again.",
      invalidateQueries: DRAFT_INVALIDATIONS,
    },
  );
