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
  // Clinical service (e.g. AGNIKARMA). The backend defaults to GENERAL_CONSULTATION when it is missing.
  treatmentType: z.string().regex(/^[A-Z_]+$/).optional(),
  notes: z.string().max(1000).optional(),
  clinicId: z.string().trim().min(1).max(100).optional(),
  locationId: z.string().uuid().optional(),
  symptoms: z.array(z.string()).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

// Backend AppointmentPriority enum.
export const appointmentPrioritySchema = z.enum([
  'EMERGENCY',
  'URGENT',
  'HIGH',
  'MEDIUM',
  'NORMAL',
  'LOW',
  'ROUTINE',
]);

/**
 * Input of the update action, which calls PUT /appointments/:id (UpdateAppointmentDto).
 *
 * Sent to the backend: appointmentDate (built from date + time), duration, status,
 * priority, treatmentType, notes, metadata. `priority` has no @IsOptional() in the DTO,
 * so the action always sends one (the caller's, else the visit's current priority).
 *
 * `type` is not in the DTO (the request would be rejected), and symptoms / diagnosis /
 * prescription / treatmentPlan / followUpDate have no column on the appointment (the
 * update fails when they are sent). They are still accepted here so existing callers
 * keep compiling; the action stores the clinical ones in `metadata.consultationDraft`
 * and never sends any of them as top-level fields.
 */
export const updateAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().min(3).max(480).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED']).optional(),
  priority: appointmentPrioritySchema.optional(),
  treatmentType: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // Not sent as top-level fields (see above).
  type: appointmentTypeSchema.optional(),
  symptoms: z.array(z.string()).optional(),
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  treatmentPlan: z.union([z.string().max(2000), z.record(z.string(), z.unknown())]).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Body of POST /appointments/:id/complete (CompleteAppointmentDto), minus `doctorId`:
 * the backend takes the doctor from the appointment itself, which is also the queue
 * the patient is removed from. `followUpNotes` is not a DTO field; the action sends it
 * as `followUpInstructions`.
 */
export const completeAppointmentSchema = z.object({
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  followUpInstructions: z.string().max(1000).optional(),
  followUpNotes: z.string().max(1000).optional(),
});

export const bulkCompleteAppointmentsSchema = z.object({
  appointmentIds: z
    .array(z.string().uuid())
    .min(1, 'At least one appointment is required')
    .max(50, 'At most 50 appointments can be completed in one bulk request'),
  doctorId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
    'EXPIRED',
    'PENDING',
    'RESCHEDULED',
    'FOLLOW_UP_SCHEDULED',
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
  // UpdateAppointmentStatusDto: treatmentPlan is an object, medications / tests are string lists.
  treatmentPlan: z.record(z.string(), z.unknown()).optional(),
  prescription: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().optional(),
  followUpType: z.string().optional(),
  followUpInstructions: z.string().optional(),
  followUpPriority: z.string().optional(),
  medications: z.array(z.string()).optional(),
  tests: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
});
