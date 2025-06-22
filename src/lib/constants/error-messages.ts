export const ERROR_MESSAGES = {
  // General validation errors
  REQUIRED: (field: string) => `${field} is required`,
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PHONE: "Please enter a valid phone number",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_MISMATCH: "Passwords don't match",
  CONFIRM_PASSWORD_MISMATCH: "The passwords do not match",
  TERMS_REQUIRED: "You must accept the terms and conditions",
  INVALID_OTP: "OTP must be 6 digits",

  // Field-specific errors
  FIRST_NAME_MIN_LENGTH: "First name must be at least 2 characters",
  LAST_NAME_MIN_LENGTH: "Last name must be at least 2 characters",
  PHONE_MIN_LENGTH: "Phone number must be at least 10 digits",
  ADDRESS_MIN_LENGTH: "Address must be at least 10 characters",
  EMERGENCY_CONTACT_MIN_LENGTH: "Emergency contact information is required",
  EMERGENCY_CONTACT_NAME_REQUIRED: "Contact name is required",
  EMERGENCY_CONTACT_PHONE_REQUIRED: "A valid phone number is required for the emergency contact",
  EMERGENCY_CONTACT_RELATIONSHIP_REQUIRED: "Relationship is required",
  DATE_OF_BIRTH_REQUIRED: "Date of birth is required",
  DATE_OF_BIRTH_FUTURE: "Date of birth cannot be in the future",
  AGE_REQUIREMENT: "You must be at least 12 years old to register",
  GENDER_REQUIRED: "Please select a gender",

  // Password complexity
  PASSWORD_UPPERCASE: "Password must contain at least one uppercase letter",
  PASSWORD_LOWERCASE: "Password must contain at least one lowercase letter",
  PASSWORD_NUMBER: "Password must contain at least one number",
  PASSWORD_SPECIAL_CHAR: "Password must contain at least one special character",

  // Auth errors
  LOGIN_FAILED: "Failed to sign in. Please check your credentials",
  REGISTER_FAILED: "Registration failed. Please try again.",
  OTP_FAILED: "Failed to verify OTP. Please try again.",
  RESET_PASSWORD_FAILED: "Failed to reset password. Please try again.",
  FORGOT_PASSWORD_FAILED: "Failed to send reset instructions. Please try again.",
  
  // Server errors
  SERVER_ERROR: "The server encountered an error processing your request. Please try again later.",
  SESSION_INVALID: "Your session appears to be invalid or expired. Please log in again.",
}; 