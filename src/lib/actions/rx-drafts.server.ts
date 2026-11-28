"use server";

import { authenticatedApi } from "./auth.server";
import {
  actionSuccess,
  caughtFailure,
  clinicHeaders,
  requireSession,
  statusFailure,
  type ActionResult,
} from "./_shared";
import { API_ENDPOINTS } from "../config/config";
import type { RxDraft, UpdateRxDraftInput } from "@/types/rx-drafts.types";

/**
 * Prescription drafts (API_CONTRACT section 5, `RxDraftController`).
 *
 * - The assistant doctor creates a draft with the normal `POST /pharmacy/prescriptions` (the
 *   server stores it as DRAFT because of the caller's role); that call stays in
 *   `QuickPrescriptionModal` (`mode="draft"`).
 * - `GET /rx-drafts` answers the doctor with the drafts awaiting approval and the assistant with
 *   their own DRAFT + RETURNED drafts.
 * - Edits go through `PATCH /pharmacy/prescriptions/:id` (assistant: own DRAFT / RETURNED;
 *   doctor: before approving "with my changes").
 */

const WHAT = "Prescription draft";

async function send<T>(
  clinicId: string,
  endpoint: string,
  init: RequestInit = {},
  what: string = WHAT,
): Promise<ActionResult<T>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;
    const { status, data } = await authenticatedApi<T>(endpoint, {
      ...init,
      headers: { ...clinicHeaders(clinicId), ...(init.headers as Record<string, string> | undefined) },
    });
    return statusFailure(status, what) ?? actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}

const post = (body?: unknown): RequestInit => ({
  method: "POST",
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

/** `status=APPROVED` lists recently approved drafts (`days`, default 30; the assistant sees own). */
export async function listRxDrafts(clinicId: string, status?: string, days?: number): Promise<ActionResult<RxDraft[]>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (status === "APPROVED" && days) params.set("days", String(days));
  const query = params.toString() ? `?${params.toString()}` : "";
  const result = await send<RxDraft[]>(clinicId, `${API_ENDPOINTS.RX_DRAFTS.LIST}${query}`, {}, "Prescription drafts");
  return result.success ? actionSuccess(Array.isArray(result.data) ? result.data : []) : result;
}

export async function getRxDraft(clinicId: string, draftId: string): Promise<ActionResult<RxDraft>> {
  return send<RxDraft>(clinicId, API_ENDPOINTS.RX_DRAFTS.GET(draftId));
}

export async function updateRxDraft(
  clinicId: string,
  draftId: string,
  input: UpdateRxDraftInput,
): Promise<ActionResult<unknown>> {
  return send<unknown>(clinicId, API_ENDPOINTS.RX_DRAFTS.UPDATE(draftId), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function approveRxDraft(clinicId: string, draftId: string): Promise<ActionResult<RxDraft>> {
  return send<RxDraft>(clinicId, API_ENDPOINTS.RX_DRAFTS.APPROVE(draftId), post());
}

export async function returnRxDraft(clinicId: string, draftId: string, note: string): Promise<ActionResult<RxDraft>> {
  return send<RxDraft>(clinicId, API_ENDPOINTS.RX_DRAFTS.RETURN(draftId), post({ note }));
}

/** RETURNED -> DRAFT. `note` (optional) tells the doctor what changed (`resubmitNote`). */
export async function resubmitRxDraft(clinicId: string, draftId: string, note?: string): Promise<ActionResult<RxDraft>> {
  const trimmed = note?.trim();
  return send<RxDraft>(clinicId, API_ENDPOINTS.RX_DRAFTS.RESUBMIT(draftId), post(trimmed ? { note: trimmed } : undefined));
}

export async function discardRxDraft(
  clinicId: string,
  draftId: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  return send<{ id: string; status: string }>(clinicId, API_ENDPOINTS.RX_DRAFTS.DISCARD(draftId), post());
}
