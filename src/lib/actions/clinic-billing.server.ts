'use server';

import { API_ENDPOINTS } from '../config/config';
import { clinicOpsRequest, withQuery } from './_ops-request';
import type { ActionResult } from './_shared';
import type {
  BillingOpsSummary,
  InvoiceReceipt,
  InvoiceReminder,
  OverdueInvoice,
  SendReminderInput,
} from '@/types/clinic-admin-ops.types';
import type { Invoice } from '@/types/billing.types';

/**
 * Clinic admin billing actions (CaBilling, CaInvoices, CaInvoiceDetail, CaSendReminders).
 * New `billing-ops` routes plus the existing invoice / refund routes the screens need that had
 * no server action yet. Listing invoices and payments, creating invoices, mark-paid and WhatsApp
 * stay in `hooks/query/useBilling.ts`; recording a payment stays in `usePatientBilling`.
 * Backend roles: CLINIC_ADMIN, FINANCE_BILLING, SUPER_ADMIN (+ RECEPTIONIST for reminders / receipt).
 */

const OPS = API_ENDPOINTS.CLINIC_ADMIN_OPS;

export async function fetchBillingSummary(range: { from?: string; to?: string } = {}): Promise<ActionResult<BillingOpsSummary>> {
  return clinicOpsRequest<BillingOpsSummary>(withQuery(OPS.BILLING_SUMMARY, range), { what: 'Billing summary' });
}

export async function fetchOverdueInvoices(limit = 100): Promise<ActionResult<OverdueInvoice[]>> {
  return clinicOpsRequest<OverdueInvoice[]>(withQuery(OPS.OVERDUE_INVOICES, { limit }), { what: 'Unpaid invoices' });
}

export async function fetchInvoiceReminders(invoiceId: string): Promise<ActionResult<InvoiceReminder[]>> {
  return clinicOpsRequest<InvoiceReminder[]>(OPS.INVOICE_REMINDERS(invoiceId), { what: 'Invoice reminders' });
}

export async function sendInvoiceReminder(
  invoiceId: string,
  input: SendReminderInput
): Promise<ActionResult<InvoiceReminder>> {
  return clinicOpsRequest<InvoiceReminder>(OPS.INVOICE_REMINDERS(invoiceId), {
    method: 'POST',
    body: input,
    what: 'Payment reminder',
  });
}

export async function fetchInvoiceReceipt(invoiceId: string): Promise<ActionResult<InvoiceReceipt>> {
  return clinicOpsRequest<InvoiceReceipt>(OPS.INVOICE_RECEIPT(invoiceId), { what: 'Receipt' });
}

/** GET /billing/invoices/:id (existing). */
export async function fetchClinicInvoice(invoiceId: string): Promise<ActionResult<Invoice & Record<string, unknown>>> {
  return clinicOpsRequest<Invoice & Record<string, unknown>>(API_ENDPOINTS.BILLING.INVOICES.GET_BY_ID(invoiceId), {
    what: 'Invoice',
  });
}

/** POST /billing/payments/:id/refund (existing; CLINIC_ADMIN, FINANCE_BILLING). Full refund to the original mode. */
export async function refundClinicPayment(paymentId: string, reason: string): Promise<ActionResult<unknown>> {
  return clinicOpsRequest<unknown>(API_ENDPOINTS.BILLING.PAYMENTS.REFUND(paymentId), {
    method: 'POST',
    body: { reason },
    what: 'Refund',
  });
}
