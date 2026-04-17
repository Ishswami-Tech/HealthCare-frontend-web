/**
 * User-Facing Error Messages
 * Centralized error messages for UI display
 */

export const ERROR_MESSAGES = {
  // Authentication
  LOGIN_FAILED: 'Login failed. Please check your credentials and try again.',
  LOGIN_REQUIRED: 'Please log in to continue.',
  LOGOUT_FAILED: 'Logout failed. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  
  // Registration
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  REGISTER_FAILED: 'Registration failed. Please try again.', // Alias for consistency
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  PHONE_ALREADY_EXISTS: 'An account with this phone number already exists.',
  
  // Password
  FORGOT_PASSWORD_FAILED: 'Failed to send password reset email. Please try again.',
  RESET_PASSWORD_FAILED: 'Password reset failed. Please try again.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  PASSWORD_TOO_WEAK: 'Password is too weak. Please use a stronger password.',
  
  // OTP
  OTP_FAILED: 'OTP verification failed. Please try again.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  OTP_INVALID: 'Invalid OTP. Please check and try again.',
  
  // Registration
  
  // Network & System
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  
  // Validation
  VALIDATION_ERROR: 'Please check your input and try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  
  // Resources
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  FORBIDDEN: 'Access denied.',
  
  // Appointments
  APPOINTMENT_NOT_FOUND: 'Appointment not found.',
  APPOINTMENT_CONFLICT: 'This appointment time conflicts with an existing appointment.',
  APPOINTMENT_CANNOT_CANCEL: 'This appointment cannot be cancelled.',
  
  // Clinic
  CLINIC_NOT_FOUND: 'Clinic not found.',
  CLINIC_CREATE_FAILED: 'Failed to create clinic. Please try again.',
  CLINIC_UPDATE_FAILED: 'Failed to update clinic. Please try again.',
  
  // Users
  USER_NOT_FOUND: 'User not found.',
  USER_UPDATE_FAILED: 'Failed to update user. Please try again.',
  
  // Notifications
  NOTIFICATION_FAILED: 'Failed to send notification. Please try again.',
  NOTIFICATION_SETTINGS_UPDATE_FAILED: 'Failed to update notification settings. Please try again.',
  
  // Health
  HEALTH_CHECK_FAILED: 'Health check failed. Please try again later.',
  
  // Video Appointments
  VIDEO_APPOINTMENT_FAILED: 'Video appointment operation failed. Please try again.',
  VIDEO_APPOINTMENT_NOT_FOUND: 'Video appointment not found.',
  
  // Billing
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  PAYMENT_NOT_FOUND: 'Payment not found.',
  
  // Medical Records
  MEDICAL_RECORD_NOT_FOUND: 'Medical record not found.',
  MEDICAL_RECORD_CREATE_FAILED: 'Failed to create medical record. Please try again.',
  
  // Session Management
  SESSION_TERMINATED: 'Session terminated successfully.',
  SESSION_TERMINATE_FAILED: 'Failed to terminate session. Please try again.',
  ALL_SESSIONS_TERMINATED: 'All sessions have been terminated.',
  
  // Video Appointments
  VIDEO_JOIN_FAILED: 'Failed to join video consultation. Please try again.',
  VIDEO_END_FAILED: 'Failed to end video consultation. Please try again.',
  VIDEO_PERMISSION_DENIED: 'You do not have permission to perform this video action.',
  VIDEO_NOT_READY: 'Video consultation is not ready yet. Please wait.',
  
  // Push Notifications
  PUSH_PERMISSION_DENIED: 'Notification permission denied. Please enable it in your browser settings.',
  PUSH_REGISTRATION_FAILED: 'Failed to register for push notifications.',
  PUSH_NOT_SUPPORTED: 'Push notifications are not supported in this browser.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  TRY_AGAIN: 'Something went wrong. Please try again.',
  CONTACT_SUPPORT: 'If the problem persists, please contact support.',
} as const;

export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
