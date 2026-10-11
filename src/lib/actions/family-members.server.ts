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
import type { CreateFamilyMemberInput, FamilyMember, UpdateFamilyMemberInput } from "@/types/patient-visit.types";

/**
 * Family members of the signed-in patient (patient self-service).
 *
 * Backend: `FamilyMembersController` — `GET/POST /family-members/me` and
 * `PATCH/DELETE /family-members/me/:id`. They allow the PATIENT role only and take the head of
 * the family from the session, never from the request, so no patient id is sent.
 * The staff routes (`/family-members`, `/family-members/patient/:patientId`) do not allow
 * patients; those live in `patient-visits.server.ts`.
 */

/** Body of `POST /family-members/me` (`CreateMyFamilyMemberDto`). */
type CreateMyFamilyMemberInput = Omit<CreateFamilyMemberInput, "primaryPatientId">;

/**
 * Body of `PATCH /family-members/me/:id` (`UpdateFamilyMemberDto`).
 * `dateOfBirth: null` clears the date; an empty string is rejected by the backend.
 */
type UpdateMyFamilyMemberInput = Omit<UpdateFamilyMemberInput, "dateOfBirth"> & {
  dateOfBirth?: string | null;
};

const WHAT = "Family member";

export async function listMyFamilyMembers(clinicId: string): Promise<ActionResult<FamilyMember[]>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;

    const { status, data } = await authenticatedApi<FamilyMember[]>(API_ENDPOINTS.FAMILY_MEMBERS.ME, {
      headers: clinicHeaders(clinicId),
    });
    return statusFailure(status, "Family members") ?? actionSuccess(Array.isArray(data) ? data : []);
  } catch (error) {
    return caughtFailure(error);
  }
}

export async function createMyFamilyMember(
  clinicId: string,
  input: CreateMyFamilyMemberInput,
): Promise<ActionResult<FamilyMember>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;

    const { status, data } = await authenticatedApi<FamilyMember>(API_ENDPOINTS.FAMILY_MEMBERS.ME, {
      method: "POST",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    });
    return statusFailure(status, WHAT) ?? actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}

export async function updateMyFamilyMember(
  clinicId: string,
  id: string,
  input: UpdateMyFamilyMemberInput,
): Promise<ActionResult<FamilyMember>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;

    const { status, data } = await authenticatedApi<FamilyMember>(API_ENDPOINTS.FAMILY_MEMBERS.ME_BY_ID(id), {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    });
    return statusFailure(status, WHAT) ?? actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}

/** Soft delete: the member leaves the family list; their clinical records are kept. */
export async function deleteMyFamilyMember(clinicId: string, id: string): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;

    const { status } = await authenticatedApi<void>(API_ENDPOINTS.FAMILY_MEMBERS.ME_BY_ID(id), {
      method: "DELETE",
      // The API client always sends `Content-Type: application/json`, and the backend (Fastify)
      // answers 400 "Body cannot be empty" to a JSON request without a body. The route reads no body.
      body: JSON.stringify({}),
      headers: clinicHeaders(clinicId),
    });
    return statusFailure(status, WHAT) ?? actionSuccess(null);
  } catch (error) {
    return caughtFailure(error);
  }
}
