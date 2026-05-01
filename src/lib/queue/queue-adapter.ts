/**
 * Shared Queue Adapter
 * @module @/lib/queue/queue-adapter
 * @description Centralized queue normalization for all queue lanes (doctor and medicine desk)
 */

import { QueueCategory, type CanonicalQueueEntry } from '@/types/queue.types';

type QueueLabelSource = {
  serviceBucket?: string | null;
  queueCategory?: string | null;
  treatmentType?: string | null;
  displayLabel?: string | null;
  serviceType?: string | null;
};

type ServiceCatalogEntry = {
  label?: string;
  serviceBucket?: string;
  queueCategory?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function toTitleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize raw queue entry data to canonical format
 * Used by receptionist, clinic-admin, doctor, pharmacist, and patient dashboards
 */
export function normalizeQueueEntry(raw: any): CanonicalQueueEntry {
  const metadata = asRecord(raw?.metadata);
  const appointmentObj = asRecord(raw?.appointment);
  const metadataAppointmentId =
    typeof metadata['appointmentId'] === 'string' ? metadata['appointmentId'] : '';
  const appointmentId =
    raw?.appointmentId ||
    appointmentObj.id ||
    metadataAppointmentId ||
    raw?.id ||
    '';
  const position =
    typeof raw.position === 'number'
      ? raw.position
      : typeof raw.queuePosition === 'number'
        ? raw.queuePosition
        : 0;

  return {
    entryId: raw.entryId || raw.id || raw._id || (raw.patient?.id ? `queue_${raw.patient.id}` : ""),
    queueCategory: 
      raw.queueCategory || 
      raw.category || 
      raw.queueLane || 
      raw.lane || 
      QueueCategory.DOCTOR_CONSULTATION,
    queueOwnerId: raw.queueOwnerId || raw.doctorId || raw.staffId || raw.pharmacyId || 'medicine-desk',
    clinicId: raw.clinicId || '',
    locationId: raw.locationId,
    appointmentId,
    patientId: raw.patientId || raw.patient?.id || '',
    patientName: 
      raw.patientName || 
      raw.patient?.name || 
      raw.patient?.user?.name || 
      raw.userName ||
      raw.user?.name ||
      raw.name ||
      'Unknown Patient',
    doctorName: raw.doctorName || raw.doctor?.name || raw.doctor?.user?.name || '',
    displayLabel: raw.displayLabel || raw.raw?.displayLabel || undefined,
    queueType: raw.queueType || raw.raw?.queueType || raw.type || raw.raw?.type,
    serviceType: raw.serviceType || raw.raw?.serviceType || undefined,
    primaryDoctorId:
      raw.primaryDoctorId ||
      (typeof metadata['primaryDoctorId'] === 'string' ? metadata['primaryDoctorId'] : undefined),
    assignedDoctorId:
      raw.assignedDoctorId ||
      raw.doctorId ||
      (typeof metadata['assignedDoctorId'] === 'string'
        ? metadata['assignedDoctorId']
        : undefined),
    position,
    totalInQueue: typeof raw.totalInQueue === 'number' ? raw.totalInQueue : 0,
    status: raw.status || 'WAITING',
    serviceBucket: raw.serviceBucket || asRecord(raw.raw)?.serviceBucket,
    treatmentType: raw.treatmentType || asRecord(raw.raw)?.treatmentType,
    appointmentTime: raw.appointmentTime || raw.time || raw.raw?.appointmentTime || raw.raw?.time,
    checkedInAt: raw.checkedInAt || raw.raw?.checkedInAt,
    confirmedAt: raw.confirmedAt || raw.raw?.confirmedAt,
    updatedAt: raw.updatedAt || raw.raw?.updatedAt,
    waitTime: raw.waitTime || raw.raw?.waitTime,
    estimatedWaitTime: raw.estimatedWaitTime || asRecord(raw.raw)?.estimatedWaitTime,
    estimatedDuration: raw.estimatedDuration || asRecord(raw.raw)?.estimatedDuration,
    paymentStatus: raw.paymentStatus || asRecord(raw.raw)?.paymentStatus,
    waitingForPayment:
      typeof raw.waitingForPayment === 'boolean'
        ? raw.waitingForPayment
        : (raw.paymentStatus || asRecord(raw.raw)?.paymentStatus) === 'PENDING',
    readyForHandover:
      typeof raw.readyForHandover === 'boolean'
        ? raw.readyForHandover
        : (raw.paymentStatus || asRecord(raw.raw)?.paymentStatus) === 'PAID',
    // Projection fields
    paused: typeof raw.paused === 'boolean' ? raw.paused : (typeof asRecord(raw.raw)?.paused === 'boolean' ? asRecord(raw.raw)?.paused : false),
    ...(raw.tokenNumber != null ? { tokenNumber: String(raw.tokenNumber) } : asRecord(raw.raw)?.tokenNumber != null ? { tokenNumber: String(asRecord(raw.raw)?.tokenNumber) } : {}),
    ...(raw.scheduledDate != null ? { scheduledDate: raw.scheduledDate as string } : {}),
    ...(raw.startedAt != null ? { startedAt: raw.startedAt as string } : {}),
    ...(raw.completedAt != null ? { completedAt: raw.completedAt as string } : {}),
  };
}

/**
 * Get normalized status label for display
 */
export function getQueueStatusLabel(entry: CanonicalQueueEntry): string {
  const statusMap: Record<string, string> = {
    WAITING: 'Queued',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    READY: 'Ready',
    PAID: 'Paid',
    PENDING: 'Pending',
    WAITING_FOR_PAYMENT: 'Payment pending',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  };
  return statusMap[entry.status] || entry.status;
}

/**
 * Get normalized status color class for display
 */
export function getQueueStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    WAITING: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300',
    IN_PROGRESS: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
    COMPLETED: 'text-violet-700 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300',
    READY: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300',
    PAID: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300',
    PENDING: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300',
    WAITING_FOR_PAYMENT: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300',
    CANCELLED: 'text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300',
    NO_SHOW: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300',
  };
  return colorMap[status] || 'text-slate-700 bg-slate-100 dark:bg-slate-900/30 dark:text-slate-300';
}

/**
 * Normalize array of queue entries
 */
export function normalizeQueueEntries(rawArray: any[]): CanonicalQueueEntry[] {
  if (!Array.isArray(rawArray)) {
    return [];
  }
  return rawArray.map(normalizeQueueEntry);
}

export function hasQueuePatientIdentity(
  entry: Pick<CanonicalQueueEntry, 'patientId' | 'appointmentId' | 'patientName'>
): boolean {
  const patientName = String(entry.patientName || '').trim().toLowerCase();
  return Boolean(
    entry.patientId ||
      entry.appointmentId ||
      (patientName && patientName !== 'unknown patient')
  );
}

export function getQueuePatientDisplayName(
  entry: Pick<CanonicalQueueEntry, 'patientName' | 'patientId' | 'appointmentId'>
): string {
  const patientName = String(entry.patientName || '').trim();
  if (patientName && patientName.toLowerCase() !== 'unknown patient') {
    return patientName;
  }

  if (entry.patientId || entry.appointmentId) {
    return 'Patient';
  }

  return 'Unknown Patient';
}

function extractRawQueueItems(queueData: unknown): any[] {
  const payload = queueData as Record<string, unknown> | unknown[] | null | undefined;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray((payload as Record<string, unknown>).data)) {
      return (payload as Record<string, unknown>).data as any[];
    }
    if (Array.isArray((payload as Record<string, unknown>).queue)) {
      return (payload as Record<string, unknown>).queue as any[];
    }
    if (Array.isArray((payload as Record<string, unknown>).items)) {
      return (payload as Record<string, unknown>).items as any[];
    }
    for (const key of Object.keys(payload as Record<string, unknown>)) {
      const candidate = (payload as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) {
        return candidate as any[];
      }
    }
  }

  return [];
}

export function extractQueueEntries(queueData: unknown): CanonicalQueueEntry[] {
  return extractRawQueueItems(queueData).map(normalizeQueueEntry);
}

export function resolveQueueDisplayLabel(
  raw: QueueLabelSource,
  serviceCatalogMap?: Map<string, ServiceCatalogEntry>
): string {
  const treatmentType = String(raw.treatmentType || '').toUpperCase();
  const service = treatmentType ? serviceCatalogMap?.get(treatmentType) : undefined;

  if (typeof raw.displayLabel === 'string' && raw.displayLabel.trim()) {
    return raw.displayLabel.trim();
  }

  if (service?.serviceBucket) {
    return toTitleCase(service.serviceBucket);
  }

  if (service?.label) {
    return service.label;
  }

  if (typeof raw.serviceType === 'string' && raw.serviceType) {
    return toTitleCase(raw.serviceType);
  }

  if (typeof raw.serviceBucket === 'string' && raw.serviceBucket) {
    return toTitleCase(raw.serviceBucket);
  }

  if (typeof raw.queueCategory === 'string' && raw.queueCategory) {
    return toTitleCase(raw.queueCategory);
  }

  if (typeof raw.treatmentType === 'string' && raw.treatmentType) {
    return toTitleCase(raw.treatmentType);
  }

  return 'General Consultation';
}

export function getQueuePositionLabel(entry: Pick<CanonicalQueueEntry, 'position'>): string {
  return entry.position > 0 ? `Queue #${entry.position}` : 'Pending';
}

/**
 * Filter queue entries by category
 */
export function filterQueueByCategory(
  entries: CanonicalQueueEntry[],
  category: QueueCategory
): CanonicalQueueEntry[] {
  return entries.filter(entry => entry.queueCategory === category);
}

/**
 * Filter queue entries by status
 */
export function filterQueueByStatus(
  entries: CanonicalQueueEntry[],
  status: string | string[]
): CanonicalQueueEntry[] {
  const statusFilter = Array.isArray(status) ? status : [status];
  return entries.filter(entry => statusFilter.includes(entry.status));
}

/**
 * Sort queue entries by position
 */
export function sortQueueByPosition(entries: CanonicalQueueEntry[]): CanonicalQueueEntry[] {
  return [...entries].sort((a, b) => a.position - b.position);
}

/**
 * Get queue statistics
 */
export function getQueueStats(entries: CanonicalQueueEntry[]) {
  const total = entries.length;
  const waiting = entries.filter(e => e.status === 'WAITING').length;
  const inProgress = entries.filter(e => e.status === 'IN_PROGRESS').length;
  const completed = entries.filter(e => e.status === 'COMPLETED').length;
  const ready = entries.filter(e => e.status === 'READY' || e.status === 'PAID').length;
  const waitingForPayment = entries.filter(e => e.waitingForPayment).length;

  return {
    total,
    waiting,
    inProgress,
    completed,
    ready,
    waitingForPayment,
  };
}
