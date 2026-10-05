import type { PillTone } from "@/components/tbd";
import { statusTone } from "@/components/tbd";
import { buildGatewayOrderId } from "@/lib/utils/gateway-order-id";
import { formatDateInIST } from "@/lib/utils/date-time";
import type { Invoice, Payment } from "@/types/billing.types";

/** What the signed-in role may do on the billing screen. Decided once, in the container. */
export interface BillingAccess {
  isPatient: boolean;
  isReceptionist: boolean;
  /** New invoice and "send on WhatsApp" (admin, finance, receptionist, doctor). */
  canManageBilling: boolean;
  /** "Mark paid" on a pending invoice (admin, finance, receptionist). */
  canMarkInvoicesPaid: boolean;
  /** Ledger tab and the analytics summary (admin, finance). */
  showLedgerTab: boolean;
}

export interface BillingFilterState {
  searchTerm: string;
  invoiceStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
}

export const EMPTY_BILLING_FILTERS: BillingFilterState = {
  searchTerm: "",
  invoiceStatus: "all",
  paymentStatus: "all",
  paymentMethod: "all",
  startDate: "",
  endDate: "",
};

export const INVOICE_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "VOID", label: "Void" },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "all", label: "All Methods" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "NET_BANKING", label: "Net Banking" },
  { value: "WALLET", label: "Wallet" },
  { value: "INSURANCE", label: "Insurance" },
] as const;

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  NET_BANKING: "Net Banking",
  WALLET: "Wallet",
  INSURANCE: "Insurance",
  CHEQUE: "Cheque",
};

/** Rupee amount as the billing screen has always shown it: ₹1,05,000. */
export function formatRupees(amount: number | null | undefined): string {
  return `₹${(amount ?? 0).toLocaleString("en-IN")}`;
}

export function formatBillingDate(value: string | null | undefined, day: "numeric" | "2-digit" = "numeric"): string {
  if (!value) return "-";
  return formatDateInIST(value, { day, month: "short", year: "numeric" }) || "-";
}

export function invoiceNumberLabel(invoice: Invoice): string {
  return invoice.invoiceNumber || `#${invoice.id.slice(-8).toUpperCase()}`;
}

export function invoiceOrderId(invoice: Invoice): string {
  return invoice.gatewayOrderId || buildGatewayOrderId(invoice.invoiceNumber, invoice.id);
}

export function paymentReference(payment: Payment): string {
  return payment.transactionId || `Payment #${payment.id.slice(-6).toUpperCase()}`;
}

export function paymentMethodLabel(method: string | null | undefined): string {
  const key = String(method ?? "").toUpperCase();
  return METHOD_LABELS[key] ?? (key ? key.replace(/_/g, " ") : "-");
}

export function paymentDateValue(payment: Payment): string | undefined {
  return payment.paymentDate ?? payment.updatedAt ?? payment.createdAt;
}

/**
 * Tag colour for a payment. Money that arrived is green and money that went back is blue;
 * every other status uses the shared mapping.
 */
export function paymentStatusTone(status: string | null | undefined): PillTone {
  const key = String(status ?? "").toUpperCase();
  if (key === "COMPLETED") return "green";
  if (key === "REFUNDED") return "blue";
  return statusTone(key);
}

function dayStart(date: string): number | null {
  return date ? new Date(`${date}T00:00:00+05:30`).getTime() : null;
}

function dayEnd(date: string): number | null {
  return date ? new Date(`${date}T23:59:59.999+05:30`).getTime() : null;
}

/** Invoices tab filter: status, created (or due) date inside the range, and the search text. */
export function filterInvoices(invoices: Invoice[], filters: BillingFilterState): Invoice[] {
  const query = filters.searchTerm.toLowerCase();
  const startAt = dayStart(filters.startDate);
  const endAt = dayEnd(filters.endDate);
  return invoices.filter((invoice) => {
    if (filters.invoiceStatus !== "all" && invoice.status !== filters.invoiceStatus) return false;
    const dateValue = invoice.createdAt || invoice.dueDate;
    const date = dateValue ? new Date(dateValue).getTime() : null;
    if (date !== null && ((startAt !== null && date < startAt) || (endAt !== null && date > endAt))) return false;
    if (!filters.searchTerm.trim()) return true;
    return (
      (invoice.invoiceNumber || "").toLowerCase().includes(query) ||
      invoice.id.toLowerCase().includes(query) ||
      (invoice.patientName || "").toLowerCase().includes(query)
    );
  });
}

/** Payments tab filter: status, method, payment date inside the range, and the search text. */
export function filterPayments(payments: Payment[], filters: BillingFilterState): Payment[] {
  const query = filters.searchTerm.toLowerCase();
  const startAt = dayStart(filters.startDate);
  const endAt = dayEnd(filters.endDate);
  return payments.filter((payment) => {
    if (filters.paymentStatus !== "all" && payment.status !== filters.paymentStatus) return false;
    if (filters.paymentMethod !== "all" && payment.method !== filters.paymentMethod) return false;
    const dateValue = payment.paymentDate || payment.createdAt;
    const date = dateValue ? new Date(dateValue).getTime() : null;
    if (date !== null && ((startAt !== null && date < startAt) || (endAt !== null && date > endAt))) return false;
    if (!filters.searchTerm.trim()) return true;
    return (
      (payment.transactionId || `payment-${payment.id}`).toLowerCase().includes(query) ||
      payment.id.toLowerCase().includes(query) ||
      (typeof payment.patientName === "string" ? payment.patientName : "").toLowerCase().includes(query)
    );
  });
}

export function sortPaymentsNewestFirst(payments: Payment[]): Payment[] {
  const time = (payment: Payment) =>
    new Date(payment.paymentDate || payment.createdAt || payment.updatedAt || 0).getTime();
  return payments.toSorted((left, right) => time(right) - time(left));
}

export interface BillingTotals {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  voidInvoices: number;
  /** Sum of the pending invoices. */
  pendingAmount: number;
  totalPayments: number;
  completedPayments: number;
  /** Sum of the completed payments. */
  paidAmount: number;
  /** Paid part of paid + pending, 0 to 100. Null when there is nothing billed. */
  paidShare: number | null;
}

export function buildBillingTotals(invoices: Invoice[], payments: Payment[]): BillingTotals {
  const pending = invoices.filter((invoice) => invoice.status === "PENDING");
  const completed = payments.filter((payment) => payment.status === "COMPLETED");
  const pendingAmount = pending.reduce((sum, invoice) => sum + (invoice.amount ?? 0), 0);
  const paidAmount = completed.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const billed = paidAmount + pendingAmount;
  return {
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((invoice) => invoice.status === "PAID").length,
    pendingInvoices: pending.length,
    voidInvoices: invoices.filter((invoice) => invoice.status === "VOID").length,
    pendingAmount,
    totalPayments: payments.length,
    completedPayments: completed.length,
    paidAmount,
    paidShare: billed > 0 ? Math.round((paidAmount / billed) * 100) : null,
  };
}

/** "3 paid · 1 pending · 1 void" — only the parts that are not zero. */
export function invoiceBreakdownLabel(totals: BillingTotals): string {
  const parts = [
    totals.paidInvoices > 0 ? `${totals.paidInvoices} paid` : "",
    totals.pendingInvoices > 0 ? `${totals.pendingInvoices} pending` : "",
    totals.voidInvoices > 0 ? `${totals.voidInvoices} void` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No invoices yet";
}

/** CLINIC_ADMIN -> "Clinic Admin" (the role in the banner text). */
export function roleLabel(role: string): string {
  return role
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Amber "pay" look for `PaymentButton`, which has no `variant` prop of its own. */
export const PAY_BUTTON_CLASS =
  "bg-action font-bold text-[#0f1b2d] shadow-action hover:bg-action hover:brightness-95 dark:shadow-none dark:hover:bg-action";
