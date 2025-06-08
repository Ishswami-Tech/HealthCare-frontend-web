import * as z from 'zod';

export const sessionInfoSchema = z.object({
  id: z.string(),
  device: z.string(),
  lastActive: z.string(),
  ipAddress: z.string(),
  location: z.string(),
  isCurrentSession: z.boolean().optional(),
  createdAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const terminateSessionSchema = z.object({
  sessionId: z.string(),
});

export const terminateAllSessionsSchema = z.object({
  allDevices: z.boolean().optional(),
});

export type SessionInfo = z.infer<typeof sessionInfoSchema>;
export type TerminateSessionData = z.infer<typeof terminateSessionSchema>;
export type TerminateAllSessionsData = z.infer<typeof terminateAllSessionsSchema>; 