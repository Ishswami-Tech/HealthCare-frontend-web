"use server";

import { API_ENDPOINTS } from "../config/config";
import { actionFailure, actionSuccess, type ActionResult } from "./_shared";
import { clinicOpsRequest } from "./_ops-request";
import { normalizeSupportThread, normalizeSupportThreads, supportMessageToSend } from "@/lib/support/support-chat.logic";
import type { SendSupportMessageInput, SupportThread } from "@/types/support.types";

/**
 * Server actions of the help chat (`/support/*`). The clinic comes from the session
 * (`clinicOpsRequest`), and every action returns an `ActionResult` so the backend message
 * survives a production build.
 */

const invalid = (message: string) => actionFailure(message, "UNKNOWN");
const TOO_LONG = "Write a message of up to 1000 characters.";

function threadResult(result: ActionResult<unknown>): ActionResult<SupportThread> {
  if (!result.success) return result;
  const thread = normalizeSupportThread(result.data);
  return thread ? actionSuccess(thread) : actionFailure("The conversation could not be read", "UNKNOWN");
}

/** PATIENT: my help thread (created on first use). Backend: GET /support/thread. */
export async function getMySupportThread(): Promise<ActionResult<SupportThread>> {
  return threadResult(await clinicOpsRequest<unknown>(API_ENDPOINTS.SUPPORT.MY_THREAD, { what: "Conversation" }));
}

/** PATIENT: sends a message (or a quick-reply chip). Backend: POST /support/messages. */
export async function sendSupportMessage(input: SendSupportMessageInput): Promise<ActionResult<SupportThread>> {
  const body = supportMessageToSend(input.body);
  if (!body) return invalid(TOO_LONG);
  return threadResult(
    await clinicOpsRequest<unknown>(API_ENDPOINTS.SUPPORT.SEND, {
      method: "POST",
      what: "Message",
      body: { body, ...(input.quickReply ? { quickReply: input.quickReply } : {}) },
    }),
  );
}

/** RECEPTIONIST / CLINIC_ADMIN: the clinic's open threads, newest first. Backend: GET /support/threads. */
export async function listSupportThreads(): Promise<ActionResult<SupportThread[]>> {
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.SUPPORT.THREADS, { what: "Patient messages" });
  return result.success ? actionSuccess(normalizeSupportThreads(result.data)) : result;
}

/**
 * RECEPTIONIST / CLINIC_ADMIN: one thread with all its messages. Null when the API does not
 * serve single threads (older backends): the inbox then shows what the list carries.
 */
export async function getSupportThread(threadId: string): Promise<ActionResult<SupportThread | null>> {
  if (!threadId) return invalid("Choose a conversation.");
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.SUPPORT.THREAD(encodeURIComponent(threadId)), {
    what: "Conversation",
  });
  if (!result.success) {
    return result.code === "NOT_FOUND" ? actionSuccess(null) : result;
  }
  return actionSuccess(normalizeSupportThread(result.data));
}

/** RECEPTIONIST / CLINIC_ADMIN: replies in a thread. Backend: POST /support/threads/:id/reply. */
export async function replySupportThread(threadId: string, text: string): Promise<ActionResult<SupportThread>> {
  if (!threadId) return invalid("Choose a conversation.");
  const body = supportMessageToSend(text);
  if (!body) return invalid(TOO_LONG);
  return threadResult(
    await clinicOpsRequest<unknown>(API_ENDPOINTS.SUPPORT.REPLY(encodeURIComponent(threadId)), {
      method: "POST",
      what: "Reply",
      body: { body },
    }),
  );
}
