/**
 * In-app help chat (`/support/*`). The Care assistant answers common questions automatically;
 * the front desk and the clinic admin reply to the rest.
 */

export type SupportSender = "PATIENT" | "ASSISTANT" | "STAFF";

export type SupportQuickReply =
  | "RESCHEDULE"
  | "CHECK_IN_HELP"
  | "REPORTS"
  | "BILLING"
  | "PRESCRIPTION"
  | "TALK_TO_STAFF";

export interface SupportMessage {
  id: string;
  senderType: SupportSender;
  body: string;
  /** The chip the patient tapped, when known. */
  quickReply: SupportQuickReply | null;
  at: string;
}

export interface SupportThread {
  id: string;
  status: string;
  subject: string | null;
  /** Staff lists only. */
  patientName: string;
  lastMessageAt: string | null;
  /** Oldest first. The staff list may carry only the latest message. */
  messages: SupportMessage[];
  /** The patient wrote last and no staff member has answered yet. */
  needsReply: boolean;
}

export interface SendSupportMessageInput {
  body: string;
  quickReply?: SupportQuickReply;
}
