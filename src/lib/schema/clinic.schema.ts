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
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  email: z.string().email().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().max(500).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});
