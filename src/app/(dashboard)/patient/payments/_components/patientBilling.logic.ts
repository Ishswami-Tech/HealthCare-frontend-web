import { isPaidPayment, paymentKind, type PaymentKind } from "@/components/billing/PaymentHistory";
import { paymentDateValue, sortPaymentsNewestFirst } from "@/components/billing/staff/billing.logic";
import { formatDateInIST, formatMonthShortInIST } from "@/lib/utils/date-time";
import type { Invoice, Payment, Subscription } from "@/types/billing.types";

// ── Routes ─────────────────────────────────────────────────────────────────

export const BILLING_ROUTE = "/patient/payments";
export const TRANSACTIONS_ROUTE = "/patient/payments/transactions";
export const HELP_ROUTE = "/patient/help";
export const PROFILE_ROUTE = "/patient/profile";

export function invoiceRoute(invoiceId: string): string {
  return `/patient/payments/invoices/${encodeURIComponent(invoiceId)}`;
}

// ── Money and dates ────────────────────────────────────────────────────────

/**
 * Rupee amount as this page has always shown it (₹1,250). Amounts are in rupees, never paise.
 * Paise are shown only when the amount has them (₹114.50).
 */
export function formatAmount(amount: number | null | undefined, currency?: string | null): string {
  const value = Number(amount ?? 0);
  const digits = Number.isInteger(value) ? 0 : 2;
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** The same amount with paise always shown (₹570.00) — used on the invoice itself. */
export function formatAmountExact(amount: number | null | undefined, currency?: string | null): string {
  return Number(amount ?? 0).toLocaleString("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "--";
  return formatDateInIST(date, { day: "2-digit", month: "short", year: "numeric" }, "en-IN") || "--";
}

/** "28 Sept 2026, 09:12 AM" */
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "--";
  const text = formatDateInIST(
    date,
    { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true },
    "en-IN",
  );
  return text ? text.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase()) : "--";
}

// ── Invoices ───────────────────────────────────────────────────────────────

/** One payment as it comes inside an invoice (`GET /billing/invoices/user/:userId` includes them). */
export interface InvoicePaymentRef {
  id?: string;
  amount?: number | null;
  method?: string | null;
  status?: string | null;
  transactionId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Fields the invoices API sends that the shared `Invoice` type does not list. */
interface InvoiceExtras {
  totalAmount?: number | null;
  tax?: number | null;
  discount?: number | null;
  description?: string | null;
  billType?: string | null;
  lineItems?: unknown;
  payments?: InvoicePaymentRef[] | null;
  appointmentId?: string | null;
  prescriptionId?: string | null;
  subscription?: { plan?: { name?: string | null } | null } | null;
}

export type PatientInvoice = Invoice & InvoiceExtras;

export interface InvoiceLine {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

function finite(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return value !== null && value !== undefined && value !== "" && Number.isFinite(number) ? number : null;
}

/** What the patient pays for this invoice: amount + tax − discount (the backend total). */
export function invoiceTotal(invoice: Invoice): number {
  const record = invoice as PatientInvoice;
  return finite(record.totalAmount) ?? finite(record.amount) ?? 0;
}

export function invoiceTax(invoice: Invoice): number {
  return finite((invoice as PatientInvoice).tax) ?? 0;
}

export function invoiceDiscount(invoice: Invoice): number {
  return finite((invoice as PatientInvoice).discount) ?? 0;
}

export function isPayableInvoice(invoice: Pick<Invoice, "status">): boolean {
  return String(invoice.status || "").toUpperCase() === "PENDING";
}

export function isPaidInvoice(invoice: Pick<Invoice, "status">): boolean {
  return String(invoice.status || "").toUpperCase() === "PAID";
}

function rawLines(invoice: PatientInvoice): unknown[] {
  if (Array.isArray(invoice.items) && invoice.items.length > 0) return invoice.items;
  const lineItems = invoice.lineItems;
  if (Array.isArray(lineItems)) return lineItems;
  if (lineItems && typeof lineItems === "object") {
    const nested = (lineItems as { items?: unknown }).items;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

/**
 * The lines of an invoice. The API stores them as `lineItems` (a list, or `{ items: [...] }`);
 * an invoice without lines gets one line with its description and amount.
 */
export function invoiceLines(invoice: Invoice): InvoiceLine[] {
  const record = invoice as PatientInvoice;
  const lines = rawLines(record)
    .filter((line): line is Record<string, unknown> => !!line && typeof line === "object")
    .map((line, index) => {
      const quantity = finite(line["quantity"]) ?? 1;
      const total = finite(line["total"]) ?? finite(line["amount"]);
      const unitPrice = finite(line["unitPrice"]) ?? (total !== null && quantity > 0 ? total / quantity : 0);
      return {
        key: String(line["id"] ?? line["refId"] ?? index),
        description: String(line["description"] ?? "").trim() || "Item",
        quantity,
        unitPrice,
        total: total ?? unitPrice * quantity,
      };
    });
  if (lines.length > 0) return lines;
  const amount = finite(record.amount) ?? 0;
  return [
    {
      key: "invoice",
      description: plainDescription(record.description) || invoiceTypeLabel(invoice),
      quantity: 1,
      unitPrice: amount,
      total: amount,
    },
  ];
}

const BILL_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: "Consultation",
  PHARMACY: "Pharmacy",
  APPOINTMENT: "Appointment",
  SUBSCRIPTION: "Plan",
  IPD: "Hospital stay",
};

/** What the invoice is for, in one or two words. */
export function invoiceTypeLabel(invoice: Invoice): string {
  const record = invoice as PatientInvoice;
  const known = BILL_TYPE_LABELS[String(record.billType ?? "").toUpperCase()];
  if (known) return known;
  if (record.subscriptionId) return "Plan";
  if (record.appointmentId) return "Appointment";
  return "Bill";
}

const VISIT_WORDS: Record<string, string> = {
  VIDEO_CALL: "Video consult",
  IN_PERSON: "In-clinic visit",
  HOME_VISIT: "Home visit",
};

/**
 * The backend writes some descriptions for its own records ("Payment for VIDEO_CALL appointment",
 * "Pharmacy bill for prescription <id>"). Show them in plain words.
 */
export function plainDescription(text: string | null | undefined): string {
  const value = String(text ?? "").trim();
  const visit = /^Payment for (VIDEO_CALL|IN_PERSON|HOME_VISIT) appointment$/i.exec(value);
  if (visit?.[1]) return VISIT_WORDS[visit[1].toUpperCase()] ?? value;
  if (/^Pharmacy bill for prescription\b/i.test(value)) return "Pharmacy bill";
  return value;
}

/** One line under an invoice number in a list: what it is for. */
export function invoiceSubject(invoice: Invoice): string {
  const record = invoice as PatientInvoice;
  const planName = record.subscription?.plan?.name?.trim();
  if (planName) return planName;
  return plainDescription(record.description) || invoiceTypeLabel(invoice);
}

export function invoicePaidAt(invoice: Invoice): string | undefined {
  return invoice.paidDate || invoice.paidAt || undefined;
}

export function invoiceIssuedAt(invoice: Invoice): string | undefined {
  return invoice.invoiceDate || invoice.createdAt || undefined;
}

export interface InvoicePaymentInfo {
  method: string | null;
  transactionId: string | null;
  date: string | null;
}

/** How a paid invoice was paid: its own completed payment, or the matching one from the payments list. */
export function invoicePaymentInfo(invoice: Invoice, payments: Payment[]): InvoicePaymentInfo | null {
  const own = ((invoice as PatientInvoice).payments ?? [])
    .filter((payment) => String(payment.status ?? "").toUpperCase() === "COMPLETED")
    .toSorted((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())[0];
  if (own) {
    return {
      method: own.method ?? null,
      transactionId: own.transactionId ?? null,
      date: own.updatedAt ?? own.createdAt ?? null,
    };
  }
  const listed = sortPaymentsNewestFirst(payments).find(
    (payment) => payment.invoiceId === invoice.id && isPaidPayment(payment),
  );
  if (!listed) return null;
  return {
    method: listed.method ?? null,
    transactionId: listed.transactionId ?? null,
    date: paymentDateValue(listed) ?? null,
  };
}

/** Invoices still to pay, the one due first on top. */
export function pendingInvoices(invoices: Invoice[]): Invoice[] {
  const time = (invoice: Invoice) => {
    const value = new Date(invoice.dueDate || invoice.createdAt || 0).getTime();
    return Number.isFinite(value) ? value : 0;
  };
  return invoices.filter(isPayableInvoice).toSorted((left, right) => time(left) - time(right));
}

export interface DueSummary {
  /** Sum of the pending invoices, in rupees. */
  total: number;
  count: number;
  /** The pending invoice due first. */
  next: Invoice | null;
}

export function buildDueSummary(invoices: Invoice[]): DueSummary {
  const pending = pendingInvoices(invoices);
  return {
    total: pending.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0),
    count: pending.length,
    next: pending[0] ?? null,
  };
}

// ── Spending ───────────────────────────────────────────────────────────────

export type SpendCategoryKey = "consultations" | "medicines" | "plans" | "other";

export interface SpendCategory {
  key: SpendCategoryKey;
  label: string;
  amount: number;
  /** Share of this month's spend, 0 to 100. */
  share: number;
}

export interface SpendMonth {
  key: string;
  /** "Sep" */
  label: string;
  /** "September" */
  name: string;
  total: number;
  current: boolean;
}

export interface SpendSummary {
  months: SpendMonth[];
  current: SpendMonth;
  previous: SpendMonth | null;
  /** This month against the last one, in percent (negative = spent less). Null when last month was 0. */
  change: number | null;
  categories: SpendCategory[];
}

const CATEGORY_OF_KIND: Record<PaymentKind, SpendCategoryKey> = {
  video: "consultations",
  clinic: "consultations",
  home: "consultations",
  consultation: "consultations",
  pharmacy: "medicines",
  plan: "plans",
  other: "other",
};

const CATEGORY_LABELS: Record<SpendCategoryKey, string> = {
  consultations: "Consultations",
  medicines: "Medicines",
  plans: "Plans",
  other: "Other",
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function monthKey(date: Date): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * What the patient paid in each of the last `count` months (completed payments only, IST months),
 * and this month split by what it was for.
 */
export function buildSpendSummary(payments: Payment[], now: Date = new Date(), count = 6): SpendSummary {
  const shiftedNow = new Date(now.getTime() + IST_OFFSET_MS);
  const months: SpendMonth[] = Array.from({ length: count }, (_, index) => {
    const start = new Date(Date.UTC(shiftedNow.getUTCFullYear(), shiftedNow.getUTCMonth() - (count - 1 - index), 15));
    return {
      key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
      label: formatMonthShortInIST(start),
      name: formatDateInIST(start, { month: "long" }, "en-IN"),
      total: 0,
      current: index === count - 1,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  const current = months[months.length - 1]!;
  const sums: Record<SpendCategoryKey, number> = { consultations: 0, medicines: 0, plans: 0, other: 0 };

  for (const payment of payments) {
    if (!isPaidPayment(payment)) continue;
    const value = paymentDateValue(payment);
    const date = value ? new Date(value) : null;
    if (!date || !Number.isFinite(date.getTime())) continue;
    const month = byKey.get(monthKey(date));
    if (!month) continue;
    const amount = Number(payment.amount ?? 0);
    month.total += amount;
    if (month === current) sums[CATEGORY_OF_KIND[paymentKind(payment)]] += amount;
  }

  const previous = months.length > 1 ? months[months.length - 2]! : null;
  const change =
    previous && previous.total > 0 ? Math.round(((current.total - previous.total) / previous.total) * 100) : null;
  const categories = (Object.keys(sums) as SpendCategoryKey[])
    .filter((key) => sums[key] > 0)
    .map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      amount: sums[key],
      share: current.total > 0 ? (sums[key] / current.total) * 100 : 0,
    }));

  return { months, current, previous, change, categories };
}

/** "8 transactions · Aug–Sept 2026" */
export function transactionsRangeLabel(payments: Payment[]): string {
  const count = payments.length;
  const noun = `${count} transaction${count === 1 ? "" : "s"}`;
  const times = payments
    .map((payment) => new Date(paymentDateValue(payment) ?? "").getTime())
    .filter((time) => Number.isFinite(time));
  if (times.length === 0) return noun;
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  const month = (date: Date) => formatDateInIST(date, { month: "short" }, "en-IN");
  const year = (date: Date) => formatDateInIST(date, { year: "numeric" }, "en-IN");
  if (monthKey(first) === monthKey(last)) return `${noun} · ${month(last)} ${year(last)}`;
  if (year(first) === year(last)) return `${noun} · ${month(first)}–${month(last)} ${year(last)}`;
  return `${noun} · ${month(first)} ${year(first)}–${month(last)} ${year(last)}`;
}

// ── Subscriptions ──────────────────────────────────────────────────────────

function daysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function cycleLabel(cycle: string | undefined): string {
  switch (cycle) {
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    case "QUARTERLY":
      return "Quarterly";
    case "YEARLY":
      return "Annual";
    default:
      return cycle ?? "";
  }
}

export function getVisitProgress(sub: Subscription) {
  const used = sub.appointmentsUsed ?? 0;
  const limit = sub.appointmentsLimit;
  if (limit == null || limit === 0) return null;
  return { used, limit, remaining: Math.max(0, limit - used), pct: Math.min(100, Math.round((used / limit) * 100)) };
}

export function getExpiryInfo(sub: Subscription) {
  const target = sub.currentPeriodEnd || sub.nextBillingDate || sub.endDate;
  const days = daysUntil(target);
  return days === null ? null : { days, target };
}

export function getPeriodStart(sub: Subscription) {
  return sub.currentPeriodStart || sub.startDate;
}

export function getPeriodEnd(sub: Subscription) {
  return sub.currentPeriodEnd || sub.endDate;
}

export function getPeriodEndLabel(sub: Subscription) {
  const periodEnd = getPeriodEnd(sub);
  return periodEnd ? formatDate(periodEnd) : sub.autoRenew ? "Renews automatically" : "Ongoing";
}

/** The status to show: an active plan whose period is over reads "EXPIRED". */
export function getSubscriptionDisplayStatus(sub: Subscription): string {
  const rawStatus = sub.status?.toUpperCase?.() || "UNKNOWN";
  const expiryInfo = getExpiryInfo(sub);
  if (expiryInfo && expiryInfo.days < 0 && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(rawStatus)) return "EXPIRED";
  return rawStatus;
}

export function isEffectivelyActive(sub: Subscription): boolean {
  if (!["ACTIVE", "TRIALING"].includes(sub.status)) return false;
  const expiry = getExpiryInfo(sub);
  return expiry === null || expiry.days >= 0;
}

export interface SubscriptionGroups {
  /** Every subscription, the active one from the backend first. */
  all: Subscription[];
  active: Subscription[];
  ended: Subscription[];
  current: Subscription | undefined;
  currentPlanId: string | undefined;
}

/** Merges the list with the backend's "active subscription" answer, exactly as the page always did. */
export function groupSubscriptions(
  subscriptions: Subscription[],
  backendActive: Subscription | null | undefined,
): SubscriptionGroups {
  const merged = !backendActive
    ? subscriptions
    : subscriptions.some((sub) => sub.id === backendActive.id)
      ? subscriptions.map((sub) => (sub.id === backendActive.id ? backendActive : sub))
      : [backendActive, ...subscriptions];
  const all = backendActive
    ? merged.toSorted((left, right) => {
        if (left.id === backendActive.id) return -1;
        if (right.id === backendActive.id) return 1;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      })
    : merged;
  const active = all.filter(isEffectivelyActive);
  const ended = all.filter((sub) => !isEffectivelyActive(sub));
  const current = active[0];
  return { all, active, ended, current, currentPlanId: current?.planId || current?.plan?.id };
}
