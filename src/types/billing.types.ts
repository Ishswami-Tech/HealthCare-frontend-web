// Billing Types for Healthcare Frontend
// These types match the backend billing structure

export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
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
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  autoRenew: boolean;
  appointmentsUsed: number;
  appointmentsLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  clinicId: string;
  subscriptionId?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  pdfUrl?: string;
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
  amount: number;
  currency: string;
  method: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'CHEQUE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
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
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  appointmentsIncluded?: number;
  isUnlimitedAppointments?: boolean;
  appointmentTypes?: string[];
  features?: string[];
  clinicId?: string;
}

export interface CreateSubscriptionData {
  userId: string;
  clinicId: string;
  planId: string;
  autoRenew?: boolean;
}

export interface CreateInvoiceData {
  userId: string;
  clinicId: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  dueDate: string;
  items: InvoiceItem[];
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

