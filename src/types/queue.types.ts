// ===== QUEUE TYPES =====

export interface QueueItem {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  queueType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PHARMACY' | 'LAB' | 'REGISTRATION';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'CALLED';
  position: number;
  estimatedWaitTime?: number; // in minutes
  actualWaitTime?: number; // in minutes
  serviceTime?: number; // in minutes
  checkedInAt: string;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    age?: number;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  appointment?: {
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    reason?: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
}

export interface QueueStats {
  totalInQueue: number;
  waitingCount: number;
  inProgressCount: number;
  completedToday: number;
  cancelledToday: number;
  noShowToday: number;
  averageWaitTime: number;
  averageServiceTime: number;
  longestWaitTime: number;
  queuesByType: {
    consultation: number;
    followUp: number;
    emergency: number;
    pharmacy: number;
    lab: number;
    registration: number;
  };
  queuesByPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
    emergency: number;
  };
  hourlyStats: {
    hour: number;
    count: number;
    averageWaitTime: number;
  }[];
}

export interface QueueConfiguration {
  id: string;
  clinicId: string;
  queueType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PHARMACY' | 'LAB' | 'REGISTRATION';
  isActive: boolean;
  maxCapacity?: number;
  estimatedServiceTime: number; // in minutes
  autoAdvance: boolean;
  allowWalkIns: boolean;
  priorityEnabled: boolean;
  notificationsEnabled: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  displaySettings: {
    showPosition: boolean;
    showWaitTime: boolean;
    showDoctorName: boolean;
    refreshInterval: number; // in seconds
  };
  workingHours: {
    startTime: string;
    endTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ===== QUEUE FILTERS =====

export interface QueueFilters {
  queueType?: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PHARMACY' | 'LAB' | 'REGISTRATION';
  status?: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'CALLED';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  doctorId?: string;
  patientId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'position' | 'checkedInAt' | 'priority' | 'estimatedWaitTime';
  sortOrder?: 'asc' | 'desc';
}

// ===== QUEUE OPERATIONS =====

export interface AddToQueueData {
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  queueType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PHARMACY' | 'LAB' | 'REGISTRATION';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  notes?: string;
}

export interface UpdateQueueStatusData {
  queueItemId: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'CALLED';
  notes?: string;
}

export interface CallNextPatientData {
  queueType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PHARMACY' | 'LAB' | 'REGISTRATION';
  doctorId?: string;
}

export interface TransferQueueItemData {
  queueItemId: string;
  newQueueType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PHARMACY' | 'LAB' | 'REGISTRATION';
  newDoctorId?: string;
  reason?: string;
}

// ===== QUEUE NOTIFICATIONS =====

export interface QueueNotification {
  id: string;
  queueItemId: string;
  patientId: string;
  type: 'POSITION_UPDATE' | 'CALLED' | 'READY' | 'DELAYED' | 'CANCELLED';
  message: string;
  channels: ('SMS' | 'EMAIL' | 'PUSH' | 'DISPLAY')[];
  sentAt?: string;
  deliveredAt?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  createdAt: string;
  
  // Relations
  queueItem?: QueueItem;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

// ===== QUEUE DISPLAY =====

export interface QueueDisplay {
  id: string;
  clinicId: string;
  name: string;
  queueTypes: ('CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PHARMACY' | 'LAB' | 'REGISTRATION')[];
  displaySettings: {
    layout: 'LIST' | 'GRID' | 'TICKER';
    theme: 'LIGHT' | 'DARK' | 'CUSTOM';
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    showPatientNames: boolean;
    showDoctorNames: boolean;
    showWaitTimes: boolean;
    showPositions: boolean;
    refreshInterval: number;
    maxItemsToShow: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== QUEUE ANALYTICS =====

export interface QueueAnalytics {
  date: string;
  clinicId: string;
  totalPatients: number;
  averageWaitTime: number;
  averageServiceTime: number;
  patientSatisfactionScore?: number;
  peakHours: {
    hour: number;
    patientCount: number;
  }[];
  queueEfficiency: number; // percentage
  noShowRate: number; // percentage
  cancellationRate: number; // percentage
  
  // By queue type
  byQueueType: {
    queueType: string;
    totalPatients: number;
    averageWaitTime: number;
    averageServiceTime: number;
  }[];
  
  // By doctor
  byDoctor: {
    doctorId: string;
    doctorName: string;
    totalPatients: number;
    averageServiceTime: number;
    patientSatisfactionScore?: number;
  }[];
}

// ===== QUEUE REPORTS =====

export interface QueueReport {
  id: string;
  clinicId: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  startDate: string;
  endDate: string;
  data: QueueAnalytics[];
  generatedAt: string;
  generatedBy: string;
  
  // Relations
  clinic?: {
    id: string;
    name: string;
  };
  generatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ===== QUEUE SETTINGS =====

export interface QueueSettings {
  clinicId: string;
  globalSettings: {
    defaultServiceTime: number;
    maxWaitTime: number;
    autoAdvanceEnabled: boolean;
    notificationsEnabled: boolean;
    smsNotificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;
    displayRefreshInterval: number;
  };
  queueTypeSettings: {
    queueType: string;
    isEnabled: boolean;
    estimatedServiceTime: number;
    maxCapacity?: number;
    priorityEnabled: boolean;
    allowWalkIns: boolean;
  }[];
  notificationTemplates: {
    type: string;
    smsTemplate?: string;
    emailTemplate?: string;
    pushTemplate?: string;
  }[];
  updatedAt: string;
  updatedBy: string;
}

