/** App store reviewer login, managed by a super admin. Mirrors the backend ReviewLoginService. */
export const REVIEW_LOGIN_DURATION_DAYS = [7, 14, 30] as const;
export type ReviewLoginDurationDays = (typeof REVIEW_LOGIN_DURATION_DAYS)[number];

export interface ReviewLoginStatus {
  enabled: boolean;
  phone: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

/** Returned only when a code is generated. The code cannot be fetched again. */
export interface ReviewLoginIssued {
  status: ReviewLoginStatus;
  otp: string;
}

export interface EnableReviewLoginInput {
  phone: string;
  days: ReviewLoginDurationDays;
}
