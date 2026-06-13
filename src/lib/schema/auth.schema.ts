import * as z from "zod";
import { Role } from "@/types/auth.types";

const createRoleEnum = () => {
  return z.enum([
    Role.SUPER_ADMIN,
    Role.CLINIC_ADMIN,
    Role.DOCTOR,
    Role.ASSISTANT_DOCTOR,
    Role.RECEPTIONIST,
    Role.PHARMACIST,
    Role.FINANCE_BILLING,
    Role.CLINIC_LOCATION_HEAD,
    Role.PATIENT,
  ] as [string, ...string[]]);
};

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const passwordLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const requestOtpSchema = z.object({
  identifier: z.string().refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    { message: "Please enter a valid email address or phone number" },
  ),
});

export const otpSchema = z.object({
  identifier: z.string().refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    { message: "Please enter a valid email address or phone number" },
  ),
  otp: z.string().length(6, "OTP must be 6 digits"),
  rememberMe: z.boolean().optional().default(false),
});

export const otpVerifySchema = otpSchema;

const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const profileCompletionBaseSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  dateOfBirth: z
    .string()
    .optional()
    .refine((date) => {
      if (!date || date.trim() === "") return true;
      return new Date(date) <= new Date();
    }, "Date of birth cannot be in the future")
    .refine((date) => {
      if (!date || date.trim() === "") return true;
      const birthDate = new Date(date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age >= 12;
    }, "You must be at least 12 years old to register"),
  gender: z
    .enum(["male", "female", "other"], {
      message: "Please select a gender",
    })
    .optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  // Optional fields for profile updates
  specialization: z.string().optional(),
  experience: z.string().optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
});

export type ProfileCompletionSchemaOptions = {
  isPhoneOtpLogin?: boolean;
  isEmailOtpLogin?: boolean;
  isGoogleLogin?: boolean;
};

export const createProfileCompletionSchema = (
  options: ProfileCompletionSchemaOptions = {},
) => {
  // For phone OTP login, phone is already verified by the backend, so skip phone validation
  // For email OTP and Google login, phone is required and needs verification
  const phoneRequired = !options.isPhoneOtpLogin;

  return profileCompletionBaseSchema.superRefine((data, ctx) => {
    if (phoneRequired && (!data.phone || !data.phone.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Phone number is required",
      });
    }
  });
};

export const profileCompletionSchema = createProfileCompletionSchema();

export type SchemaLoginFormData = z.infer<typeof loginSchema>;
export type SchemaPasswordLoginFormData = z.infer<typeof passwordLoginSchema>;
export type SchemaOtpRequestFormData = z.infer<typeof requestOtpSchema>;
export type SchemaOtpVerifyFormData = z.infer<typeof otpVerifySchema>;
export type SchemaForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type SchemaResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type SchemaChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type SchemaProfileCompletionFormData = z.infer<
  typeof profileCompletionSchema
>;
