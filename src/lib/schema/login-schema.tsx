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

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    role: z.nativeEnum(Role).default(Role.PATIENT),
    age: z.number().min(0).max(150),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    profilePicture: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    appName: z.string().optional(),
    medicalConditions: z.array(z.string()).optional(),
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

export type PasswordLoginFormData = z.infer<typeof passwordLoginSchema>;
export type OtpRequestFormData = z.infer<typeof requestOtpSchema>;
export type OtpVerifyFormData = z.infer<typeof otpVerifySchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
