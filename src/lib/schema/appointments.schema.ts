import { z } from 'zod';

export const appointmentTypeSchema = z.enum(['IN_PERSON', 'VIDEO_CALL', 'HOME_VISIT']);

export const scanQRSchema = z.object({
  code: z.string().min(1, 'QR code is required'),
  locationId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duration: z.number().min(3).max(480),
  type: appointmentTypeSchema,
  notes: z.string().max(1000).optional(),
  clinicId: z.string().trim().min(1).max(100).optional(),
  locationId: z.string().uuid().optional(),
  symptoms: z.array(z.string()).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

export const updateAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().min(3).max(480).optional(),
  type: appointmentTypeSchema.optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  symptoms: z.array(z.string()).optional(),
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  treatmentPlan: z.string().max(2000).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const completeAppointmentSchema = z.object({
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  followUpNotes: z.string().max(1000).optional(),
});

export const proposeVideoSlotsSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  clinicId: z.string().min(1),
  locationId: z.string().uuid().optional(),
  duration: z.number().min(3).max(120),
  treatmentType: z.string().min(1).max(100),
  proposedSlots: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{1,2}:\d{2}$/),
  })).min(3).max(4),
  notes: z.string().max(1000).optional(),
});

export const confirmVideoFinalSlotSchema = z
  .object({
    confirmedSlotIndex: z.number().int().min(0).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    reason: z.string().max(1000).optional(),
  })
  .refine((value) => value.confirmedSlotIndex !== undefined || (value.date && value.time), {
    message: 'Provide either a slot index or a custom date and time',
  });

export const rescheduleAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)'),
  reason: z.string().optional(),
});

export const rejectVideoProposalSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'PENDING',
    'RESCHEDULED',
    'FOLLOW_UP_SCHEDULED',
    'AWAITING_SLOT_CONFIRMATION',
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  // Check-in
  locationId: z.string().uuid().optional(),
  qrCode: z.string().optional(),
  checkInMethod: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  // Consultation
  consultationType: z.string().optional(),
  // Completion
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  prescription: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().optional(),
  followUpType: z.string().optional(),
  followUpInstructions: z.string().optional(),
  followUpPriority: z.string().optional(),
  medications: z.array(z.any()).optional(),
  tests: z.array(z.any()).optional(),
  restrictions: z.array(z.string()).optional(),
});
