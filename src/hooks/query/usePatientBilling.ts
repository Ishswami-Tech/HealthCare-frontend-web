import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import {
  createConsultationInvoice,
  getPatientBills,
  recordInvoicePayment,
} from "@/lib/actions/patient-billing.server";
import type {
  CreateConsultationInvoiceInput,
  PatientBillFilters,
  RecordInvoicePaymentInput,
} from "@/types/billing.types";

export const patientBillingKeys = {
  all: ["patient-bills"] as const,
  list: (clinicId: string, patientId: string, filters: PatientBillFilters) =>
    ["patient-bills", clinicId, patientId, filters] as const,
};

/** Per-patient Bill History (consultation + pharmacy + legacy payments). */
export const usePatientBills = (
  clinicId: string,
  patientId: string,
  filters: PatientBillFilters = {},
) =>
  useQueryData(
    patientBillingKeys.list(clinicId, patientId, filters),
    async () => getPatientBills(clinicId, patientId, filters),
    { enabled: !!clinicId && !!patientId },
  );

const BILLING_INVALIDATE_KEYS = [
  [...patientBillingKeys.all],
  ["invoices"],
  ["payments"],
  ["clinic-invoices"],
  ["clinic-payments"],
];

export const useCreateConsultationInvoice = () =>
  useMutationOperation(
    async ({
      clinicId,
      visitId,
      input,
    }: {
      clinicId: string;
      visitId: string;
      input?: CreateConsultationInvoiceInput;
    }) => createConsultationInvoice(clinicId, visitId, input),
    {
      toastId: "consultation-invoice-create",
      loadingMessage: "Creating consultation bill...",
      successMessage: "Consultation bill ready",
      invalidateQueries: BILLING_INVALIDATE_KEYS,
    },
  );

export const useRecordInvoicePayment = () =>
  useMutationOperation(
    async ({
      clinicId,
      invoiceId,
      input,
    }: {
      clinicId: string;
      invoiceId: string;
      input: RecordInvoicePaymentInput;
    }) => recordInvoicePayment(clinicId, invoiceId, input),
    {
      toastId: "invoice-record-payment",
      loadingMessage: "Recording payment...",
      successMessage: "Payment recorded",
      invalidateQueries: [
        ...BILLING_INVALIDATE_KEYS,
        ["prescriptions"],
        ["medicineDeskQueue"],
      ],
    },
  );
