import { z } from 'zod';

export const createClinicSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  email: z.string().email(),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  mainLocation: z.object({
    name: z.string().min(2).max(100),
    address: z.string().min(5).max(200),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    country: z.string().min(2).max(50),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
    email: z.string().email(),
    timezone: z.string(),
  }),
  clinicAdminIdentifier: z.string().email().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().max(500).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
});

export const updateClinicSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().min(5).max(200).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  // Stored/displayed phone numbers may contain spaces, dashes or parens (e.g. "+91-9876543210");
  // strip those before checking the digits-only pattern so re-submitting an unchanged, already-saved
  // number doesn't fail validation.
  phone: z
    .string()
    .transform((value) => value.replace(/[\s()-]/g, ''))
    .refine((value) => /^\+?[1-9]\d{9,14}$/.test(value), { message: 'Invalid phone number' })
    .optional(),
  email: z.string().email().optional(),
  // Empty string means "no logo/website set" (the form's default), not an invalid URL.
  logo: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  operatingHours: z.string().optional(),
  description: z.string().max(500).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});
