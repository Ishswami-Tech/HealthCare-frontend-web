import type { SupportMessage, SupportQuickReply, SupportSender, SupportThread } from "@/types/support.types";

/**
 * Pure model of the help chat, shared by the patient chat and the staff inbox. Same chips and
 * wording as the mobile app (`features/support/chat.ts`).
 */

export const SUPPORT_MAX_MESSAGE = 1000;
/** Polling interval while a chat screen is open (there is no realtime support event yet). */
export const SUPPORT_POLL_MS = 15_000;

export const SUPPORT_QUICK_REPLIES: readonly { key: SupportQuickReply; label: string; body: string }[] = [
  { key: "RESCHEDULE", label: "Reschedule a visit", body: "I need to change my visit" },
  { key: "CHECK_IN_HELP", label: "Check-in help", body: "I need help checking in at the clinic" },
  { key: "REPORTS", label: "Reports", body: "I have a question about my reports" },
  { key: "BILLING", label: "Payments", body: "I have a question about a payment" },
  { key: "PRESCRIPTION", label: "Prescription", body: "I have a question about my prescription" },
  { key: "TALK_TO_STAFF", label: "Talk to a person", body: "I would like to talk to a person" },
];

const SENDERS = new Set<SupportSender>(["PATIENT", "ASSISTANT", "STAFF"]);
const QUICK_KEYS = new Set<string>(SUPPORT_QUICK_REPLIES.map((chip) => chip.key));

/** Trimmed text to send, or null when empty / too long. */
export function supportMessageToSend(text: string): string | null {
  const trimmed = text.trim();
  return trimmed && trimmed.length <= SUPPORT_MAX_MESSAGE ? trimmed : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * One message: `{ id, senderType, body, quickReply: boolean | key, quickReplyType?, at }`.
 * Older payloads keep only "was a chip" (boolean); the chip is then recovered from its body.
 */
export function normalizeSupportMessage(raw: unknown): SupportMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = text(record.id);
  const body = text(record.body);
  if (!id || !body) return null;
  const sender = text(record.senderType).toUpperCase() as SupportSender;
  const typed = text(record.quickReplyType) || text(record.quickReply);
  let quickReply: SupportQuickReply | null = null;
  if (QUICK_KEYS.has(typed)) {
    quickReply = typed as SupportQuickReply;
  } else if (record.quickReply === true) {
    quickReply = SUPPORT_QUICK_REPLIES.find((chip) => chip.body === body.trim())?.key ?? null;
  }
  return {
    id,
    senderType: SENDERS.has(sender) ? sender : "STAFF",
    body,
    quickReply,
    at: text(record.at) || text(record.createdAt),
  };
}

/** Messages oldest first, de-duplicated by id. */
export function orderedSupportMessages(list: readonly SupportMessage[]): SupportMessage[] {
  const byId = new Map<string, SupportMessage>();
  for (const message of list) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0));
}

/** The patient wrote last (the assistant's automatic answers do not count as a reply). */
export function threadNeedsReply(messages: readonly SupportMessage[]): boolean {
  const human = messages.filter((message) => message.senderType !== "ASSISTANT");
  return human.length > 0 && human[human.length - 1]?.senderType === "PATIENT";
}

/** A thread with its messages normalised; null when the response carries no thread. */
export function normalizeSupportThread(raw: unknown): SupportThread | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const body = typeof record.id === "string" ? record : (record.data as Record<string, unknown> | undefined);
  if (!body || typeof body.id !== "string" || !body.id) return null;
  const messages = orderedSupportMessages(
    (Array.isArray(body.messages) ? body.messages : [])
      .map(normalizeSupportMessage)
      .filter((message): message is SupportMessage => message !== null),
  );
  const lastMessage = messages[messages.length - 1];
  return {
    id: body.id,
    status: text(body.status) || "OPEN",
    subject: text(body.subject) || null,
    patientName: text(body.patientName),
    lastMessageAt: text(body.lastMessageAt) || lastMessage?.at || null,
    messages,
    needsReply: typeof body.needsReply === "boolean" ? body.needsReply : threadNeedsReply(messages),
  };
}

/** A list of threads (bare array or wrapped in `data` / `threads`). */
export function normalizeSupportThreads(raw: unknown): SupportThread[] {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(record?.data)
      ? record.data
      : Array.isArray(record?.threads)
        ? record.threads
        : [];
  return list.map(normalizeSupportThread).filter((thread): thread is SupportThread => thread !== null);
}

export const SUPPORT_SENDER_LABEL: Record<SupportSender, string> = {
  PATIENT: "Patient",
  ASSISTANT: "Care assistant",
  STAFF: "Clinic team",
};
