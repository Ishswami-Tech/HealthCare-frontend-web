// Billing Types for Healthcare Frontend
// These types match the backend billing structure

export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  appointmentsIncluded?: number;
  isUnlimitedAppointments: boolean;
  appointmentTypes?: string[];
  features?: string[];
  isActive: boolean;
  clinicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  clinicId: string;
  planId: string;
  plan?: BillingPlan;
  status:
    | 'ACTIVE'
    | 'PAST_DUE'
    | 'CANCELLED'
    | 'INCOMPLETE'
    | 'INCOMPLETE_EXPIRED'
    | 'TRIALING'
    | 'PAUSED';
  startDate: string;
  endDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  cancelAtPeriodEnd?: boolean;
  autoRenew: boolean;
  appointmentsUsed: number;
  appointmentsLimit?: number;
  appointmentsRemaining?: number;
  remainingVisits?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  clinicId: string;
  subscriptionId?: string;
  invoiceNumber: string;
  gatewayOrderId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'VOID';
  invoiceDate?: string;
  dueDate: string;
  paidAt?: string;
  paidDate?: string;
  items: InvoiceItem[];
  pdfUrl?: string;
  patientName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  userId: string;
  clinicId: string;
  invoiceId?: string;
  subscriptionId?: string;
  patientName?: string;
  amount: number;
  currency: string;
  method: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'INSURANCE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface LedgerSummary {
  totalCollections: number;
  totalDoctorPayable: number;
  totalPlatformRevenue: number;
  totalRefunded: number;
  totalPayoutReleased: number;
  pendingPayouts: number;
  byRevenueModel: {
    APPOINTMENT: number;
    SUBSCRIPTION: number;
    OTHER: number;
  };
  byAppointmentType: {
    VIDEO_CALL: number;
    IN_PERSON: number;
    HOME_VISIT: number;
    OTHER: number;
  };
}

export interface LedgerPaymentRow {
  paymentId: string;
  appointmentId: string | null;
  userId: string | null;
  amount: number;
  status: string;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
  payoutState: string;
  payoutDoctorId: string | null;
  payoutDoctorShareAmount: number;
  payoutPlatformFeeAmount: number;
  payoutReference: string | null;
  revenueModel: string;
  appointmentType: string | null;
  provider: string | null;
  ledgerEntries: Array<Record<string, unknown>>;
}

export interface ClinicLedgerResponse {
  payments: LedgerPaymentRow[];
  summary: LedgerSummary;
}

export interface BillingAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalInvoices: number;
  pendingInvoices: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface SubscriptionUsageStats {
  appointmentsUsed: number;
  appointmentsLimit?: number;
  appointmentsRemaining?: number;
  usagePercentage: number;
  lastResetDate?: string;
  nextResetDate?: string;
}

export interface CreateBillingPlanData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  appointmentsIncluded?: number;
  isUnlimitedAppointments?: boolean;
  isActive?: boolean;
  appointmentTypes?: string[];
  features?: string[];
  clinicId?: string;
}

export interface CreateSubscriptionData {
  userId: string;
  clinicId: string;
  planId: string;
  autoRenew?: boolean;
  startDate?: string;
  endDate?: string;
  trialStart?: string;
  trialEnd?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateInvoiceData {
  userId: string;
  clinicId: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  dueDate: string;
  lineItems?: Record<string, unknown>;
  items?: InvoiceItem[];
}

export interface CreatePaymentData {
  userId: string;
  clinicId: string;
  invoiceId?: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  method: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'CHEQUE';
  transactionId?: string;
}

// ============ Bill History (OPD consultation + pharmacy invoices) ============

export type BillType = 'CONSULTATION' | 'PHARMACY' | 'APPOINTMENT' | 'SUBSCRIPTION' | 'IPD' | 'OTHER';

export type PatientBillStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'VOID' | 'REFUNDED';

export type CollectionMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING';

export interface PatientBillPayment {
  id: string;
  amount: number;
  method: string | null;
  status: string;
  transactionId: string | null;
  createdAt: string;
}

export interface PatientBillRow {
  id: string;
  source: 'INVOICE' | 'PAYMENT';
  billType: BillType;
  invoiceNumber: string | null;
  date: string;
  description: string | null;
  visitId?: string | null;
  opdNumber?: string | null;
  prescriptionId?: string | null;
  appointmentId?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: PatientBillStatus;
  payments: PatientBillPayment[];
  downloadable: boolean;
}

export interface PatientBillHistory {
  rows: PatientBillRow[];
  total: number;
  summary: {
    totalBilled: number;
    totalPaid: number;
    outstanding: number;
  };
}

export interface PatientBillFilters {
  type?: BillType | string;
  status?: PatientBillStatus | string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface CreateConsultationInvoiceInput {
  amount?: number;
  discount?: number;
  waive?: boolean;
  collect?: {
    method: CollectionMethod;
    amount?: number;
    transactionId?: string;
    note?: string;
  };
}

export interface RecordInvoicePaymentInput {
  method: CollectionMethod;
  amount?: number;
  transactionId?: string;
  note?: string;
}

