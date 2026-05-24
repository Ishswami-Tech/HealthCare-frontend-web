export interface ReceptionistProfileFormState {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    emergencyContact: string;
    emergencyPhone: string;
    occupation: string;
    maritalStatus: string;
  };
  workInfo: {
    employeeId: string;
    department: string;
    position: string;
    joiningDate: string;
    workSchedule: string;
    supervisor: string;
    workLocation: string;
    experience: string;
    skills: string[];
  };
  systemAccess: {
    canScheduleAppointments: boolean;
    canEditPatientInfo: boolean;
    canProcessPayments: boolean;
    canAccessReports: boolean;
    canManageInventory: boolean;
    systemRole: string;
    lastLogin: string;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    theme: string;
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    appointmentAlerts: boolean;
    patientUpdates: boolean;
    systemUpdates: boolean;
    reminderNotifications: boolean;
  };
  vitals: {
    height: string;
    weight: string;
    bloodGroup: string;
    bmi: string;
    bloodPressure: string;
  };
}

export interface ReceptionistProfileUser {
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  email?: string | null | undefined;
  role?: string | null | undefined;
}
