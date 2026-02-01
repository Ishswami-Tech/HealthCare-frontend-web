import * as z from "zod";
import { Role } from "@/types/auth.types";

// Schema for requesting OTP
export const requestOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Schema for password login
export const passwordLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

// Schema for OTP verification/login
export const otpVerifySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  rememberMe: z.boolean().optional(),
});

// Helper function to safely use Role enum with Zod
const createRoleEnum = () => {
  return z.enum([
    Role.SUPER_ADMIN,
    Role.CLINIC_ADMIN,
    Role.DOCTOR,
    Role.RECEPTIONIST,
    Role.PATIENT,
  ] as [string, ...string[]]);
};

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    gender: z.enum(["male", "female", "other"]).default("male"),
    role: createRoleEnum().default(Role.PATIENT),
    age: z.number().optional(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    token: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Profile completion schema - only essential fields are required
export const profileCompletionSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      // Check if the date is not in the future
      return new Date(date) <= new Date();
    }, "Date of birth cannot be in the future")
    .refine((date) => {
      // Calculate age
      const birthDate = new Date(date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Check if age is at least 12
      return age >= 12;
    }, "You must be at least 12 years old to register"),
  gender: z.enum(["male", "female", "other"], {
    message: "Please select a gender",
  }),
  address: z.string().min(10, "Address must be at least 10 characters"),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
  emergencyContactRelationship: z.string().min(2, "Emergency contact relationship is required"),
  // Optional fields for profile updates
  specialization: z.string().optional(),
  experience: z.string().optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
});

export type PasswordLoginFormData = z.infer<typeof passwordLoginSchema>;
export type OtpRequestFormData = z.infer<typeof requestOtpSchema>;
export type OtpVerifyFormData = z.infer<typeof otpVerifySchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;

// Helper type for backend format
export interface ProfileData extends Omit<ProfileCompletionFormData, 'emergencyContact'> {
  profileComplete: boolean;
  emergencyContact: string; // String format for the backend
}
