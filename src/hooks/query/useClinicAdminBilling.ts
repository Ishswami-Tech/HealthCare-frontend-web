"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { useCurrentClinicId } from "./useClinics";
import { tbdKeys, TBD_CACHE } from "./tbdQueryKeys";
import { dataOrThrow, listOf } from "@/lib/utils/action-result";
import {
  fetchBillingSummary,
  fetchClinicInvoice,
  fetchInvoiceReceipt,
  fetchInvoiceReminders,
  fetchOverdueInvoices,
  refundClinicPayment,
  sendInvoiceReminder,
} from "@/lib/actions/clinic-billing.server";
import type {
  BillingOpsSummary,
  InvoiceReceipt,
  InvoiceReminder,
  OverdueInvoice,
  SendReminderInput,
} from "@/types/clinic-admin-ops.types";

/**
 * Clinic admin billing ops (CaBilling, CaInvoices, CaInvoiceDetail, CaSendReminders).
 * Lists of invoices / payments, create invoice, mark paid and WhatsApp come from `useBilling`;
 * recording a payment from `usePatientBilling` (`useRecordInvoicePayment`).
 */

/** Invalidated after any billing change made from these screens. */
const BILLING_FAMILIES = [["clinic-billing"], ["clinic-invoices"], ["clinic-payments"], ["invoices"], ["clinic-ledger"]];

export function useBillingOpsSummary(range: { from?: string; to?: string } = {}) {
  const clinicId = useCurrentClinicId();
  return useQueryData<BillingOpsSummary>(
    tbdKeys.clinicBilling.overview(clinicId, range),
    async () => dataOrThrow(await fetchBillingSummary(range)),
    { enabled: Boolean(clinicId), ...TBD_CACHE.working },
  );
}

export function useOverdueInvoices(limit = 100) {
  const clinicId = useCurrentClinicId();
  return useQueryData<OverdueInvoice[]>(
    [...tbdKeys.clinicBilling.reminders(clinicId), "overdue", limit],
    async () => listOf<OverdueInvoice>(dataOrThrow(await fetchOverdueInvoices(limit))),
    { enabled: Boolean(clinicId), ...TBD_CACHE.working },
  );
}

export function useClinicInvoice(invoiceId: string) {
  const clinicId = useCurrentClinicId();
  return useQueryData(
    tbdKeys.clinicBilling.invoice(clinicId, invoiceId),
    async () => dataOrThrow(await fetchClinicInvoice(invoiceId)),
    { enabled: Boolean(clinicId && invoiceId), ...TBD_CACHE.working },
  );
}

export function useInvoiceReceipt(invoiceId: string) {
  const clinicId = useCurrentClinicId();
  return useQueryData<InvoiceReceipt>(
    [...tbdKeys.clinicBilling.invoice(clinicId, invoiceId), "receipt"],
    async () => dataOrThrow(await fetchInvoiceReceipt(invoiceId)),
    { enabled: Boolean(clinicId && invoiceId), ...TBD_CACHE.working },
  );
}

export function useInvoiceReminders(invoiceId: string) {
  const clinicId = useCurrentClinicId();
  return useQueryData<InvoiceReminder[]>(
    [...tbdKeys.clinicBilling.invoice(clinicId, invoiceId), "reminders"],
    async () => listOf<InvoiceReminder>(dataOrThrow(await fetchInvoiceReminders(invoiceId))),
    { enabled: Boolean(clinicId && invoiceId), ...TBD_CACHE.working },
  );
}

/** Sends one reminder per invoice (the backend has no bulk route); resolves with the per-invoice outcome. */
export function useSendInvoiceReminders() {
  return useMutationOperation<
    { sent: number; failed: Array<{ invoiceId: string; error: string }> },
    { invoiceIds: string[]; input: SendReminderInput }
  >(
    async ({ invoiceIds, input }) => {
      const results = await Promise.all(invoiceIds.map((id) => sendInvoiceReminder(id, input)));
      const failed = results.flatMap((result, index) =>
        result.success ? [] : [{ invoiceId: invoiceIds[index] ?? "", error: result.error }],
      );
      if (failed.length === invoiceIds.length) throw new Error(failed[0]?.error || "No reminder could be sent");
      return { sent: invoiceIds.length - failed.length, failed };
    },
    {
      toastId: "clinic-billing-reminders",
      loadingMessage: "Sending reminders…",
      successMessage: "Reminders queued",
      invalidateQueries: BILLING_FAMILIES,
    },
  );
}

export function useRefundClinicPayment() {
  return useMutationOperation<unknown, { paymentId: string; reason: string }>(
    async ({ paymentId, reason }) => dataOrThrow(await refundClinicPayment(paymentId, reason)),
    {
      toastId: "clinic-billing-refund",
      loadingMessage: "Recording refund…",
      successMessage: "Refund recorded",
      invalidateQueries: BILLING_FAMILIES,
    },
  );
}
