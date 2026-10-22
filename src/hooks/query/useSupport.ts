"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { dataOrThrow } from "@/lib/utils/action-result";
import { SUPPORT_POLL_MS } from "@/lib/support/support-chat.logic";
import {
  getMySupportThread,
  getSupportThread,
  listSupportThreads,
  replySupportThread,
  sendSupportMessage,
} from "@/lib/actions/support.server";
import type { SendSupportMessageInput, SupportThread } from "@/types/support.types";

/**
 * React Query hooks of the help chat. There is no realtime support event, so open chat screens
 * poll every 15 s (only while the tab is visible: React Query pauses intervals in the background).
 * `clinicId` only keys and enables the queries; the actions read the clinic from the session.
 */

const SUPPORT_TOAST_ID = "support-message";

export const supportKeys = {
  mine: (clinicId: string) => ["supportThread", "mine", clinicId] as const,
  threads: (clinicId: string) => ["supportThreads", clinicId] as const,
  thread: (clinicId: string, threadId: string) => ["supportThread", "staff", clinicId, threadId] as const,
};

/** PATIENT: my help thread. */
export const useMySupportThread = (clinicId: string, enabled = true) =>
  useQueryData(supportKeys.mine(clinicId), async () => dataOrThrow(await getMySupportThread()), {
    enabled: !!clinicId && enabled,
    refetchInterval: SUPPORT_POLL_MS,
  });

/** PATIENT: send a message or a chip. The answer is the whole thread, written straight into the cache. */
export const useSendSupportMessage = (clinicId: string) => {
  const queryClient = useQueryClient();
  return useMutationOperation(
    async (input: SendSupportMessageInput) => dataOrThrow(await sendSupportMessage(input)),
    {
      toastId: SUPPORT_TOAST_ID,
      loadingMessage: "Sending...",
      successMessage: "Message sent",
      showLoading: false,
      showToast: false,
      onSuccess: (thread: SupportThread) => {
        queryClient.setQueryData(supportKeys.mine(clinicId), thread);
      },
    },
  );
};

/** RECEPTIONIST / CLINIC_ADMIN: open threads of the clinic. */
export const useSupportThreads = (clinicId: string, enabled = true) =>
  useQueryData(supportKeys.threads(clinicId), async () => dataOrThrow(await listSupportThreads()), {
    enabled: !!clinicId && enabled,
    refetchInterval: SUPPORT_POLL_MS,
  });

/**
 * RECEPTIONIST / CLINIC_ADMIN: one thread in full. When the API has no single-thread route the
 * query keeps the last full copy (the answer of a reply), or null.
 */
export const useSupportThread = (clinicId: string, threadId: string | null) => {
  const queryClient = useQueryClient();
  const key = supportKeys.thread(clinicId, threadId ?? "");
  return useQueryData(
    key,
    async () => {
      const thread = dataOrThrow(await getSupportThread(threadId ?? ""));
      return thread ?? queryClient.getQueryData<SupportThread | null>(key) ?? null;
    },
    {
      enabled: !!clinicId && !!threadId,
      refetchInterval: SUPPORT_POLL_MS,
    },
  );
};

/** RECEPTIONIST / CLINIC_ADMIN: reply in a thread. */
export const useReplySupportThread = (clinicId: string) => {
  const queryClient = useQueryClient();
  return useMutationOperation(
    async ({ threadId, body }: { threadId: string; body: string }) => dataOrThrow(await replySupportThread(threadId, body)),
    {
      toastId: SUPPORT_TOAST_ID,
      loadingMessage: "Sending the reply...",
      successMessage: "Reply sent",
      showLoading: false,
      invalidateQueries: [[...supportKeys.threads(clinicId)]],
      onSuccess: (thread: SupportThread) => {
        queryClient.setQueryData(supportKeys.thread(clinicId, thread.id), thread);
      },
    },
  );
};
