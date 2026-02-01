import { z } from 'zod';

export const createInvoiceSchema = z.object({
  userId: z.string().uuid(),
  clinicId: z.string().uuid().or(z.string().regex(/^CL\d+$/)),
  subscriptionId: z.string().uuid().optional(),
  amount: z.number().positive(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  description: z.string().optional(),
  lineItems: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  clinicId: z.string().uuid().or(z.string().regex(/^CL\d+$/)),
  appointmentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  method: z.enum(['CASH', 'CARD', 'UPI', 'NET_BANKING', 'INSURANCE']).optional(),
  transactionId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
