"use server";

import { authenticatedApi, getServerSession } from "./auth.server";
import { API_ENDPOINTS } from "../config/config";
import {
  actionSuccess,
  caughtFailure,
  requireSession as requireActionSession,
  type ActionResult,
} from "./_shared";
import type {
  CreateConsultationInvoiceInput,
  PatientBillHistory,
  PatientBillFilters,
  RecordInvoicePaymentInput,
} from "@/types/billing.types";

async function requireSession(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }
}

function clinicHeaders(clinicId: string): Record<string, string> {
  return clinicId ? { "X-Clinic-ID": clinicId } : {};
}

const EMPTY_BILL_HISTORY: PatientBillHistory = {
  rows: [],
  total: 0,
  summary: { totalBilled: 0, totalPaid: 0, outstanding: 0 },
};

/**
 * Per-patient Bill History: consultation + pharmacy invoices (and their
 * payments) plus legacy orphan payments that predate the Invoice
 * bill-history columns. Backend: GET /billing/patients/:patientId/bills
 */
export async function getPatientBills(
  clinicId: string,
  patientId: string,
  filters: PatientBillFilters = {},
): Promise<PatientBillHistory> {
  await requireSession();
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));
  const query = params.toString();
  const endpoint = `${API_ENDPOINTS.BILLING.PATIENT_BILLS(patientId)}${query ? `?${query}` : ""}`;

  const { data } = await authenticatedApi<PatientBillHistory>(endpoint, {
    headers: clinicHeaders(clinicId),
  });
  return data ?? EMPTY_BILL_HISTORY;
}

type ConsultationInvoiceResult =
  | { invoice: Record<string, unknown> }
  | { invoice: Record<string, unknown>; payment: Record<string, unknown> };

/**
 * Creates (or fetches, idempotently) the OPD consultation invoice for a
 * visit. When `input.collect` is present, also records the payment and
 * returns `{ invoice, payment }`. Backend:
 * POST /billing/visits/:visitId/consultation-invoice
 */
export async function createConsultationInvoice(
  clinicId: string,
  visitId: string,
  input: CreateConsultationInvoiceInput = {},
): Promise<ConsultationInvoiceResult> {
  await requireSession();
  const { data } = await authenticatedApi<ConsultationInvoiceResult>(
    API_ENDPOINTS.BILLING.VISIT_CONSULTATION_INVOICE(visitId),
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    },
  );
  return data;
}

/**
 * Records a manual (cash/UPI/card/net-banking) payment against an invoice.
 * Backend: POST /billing/invoices/:id/record-payment
 *
 * Returns an `ActionResult` instead of throwing: a thrown error loses its message on the way to
 * the browser (the dialog only saw a 500), so a refusal such as "Amount … exceeds the remaining
 * balance" (400) reaches the dialog with the backend wording.
 */
export async function recordInvoicePayment(
  clinicId: string,
  invoiceId: string,
  input: RecordInvoicePaymentInput,
): Promise<ActionResult<{ invoice: Record<string, unknown>; payment: Record<string, unknown> }>> {
  const session = await requireActionSession();
  if (!session.success) return session;
  try {
    const { data } = await authenticatedApi<{
      invoice: Record<string, unknown>;
      payment: Record<string, unknown>;
    }>(API_ENDPOINTS.BILLING.INVOICES.RECORD_PAYMENT(invoiceId), {
      method: "POST",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    });
    return actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}
