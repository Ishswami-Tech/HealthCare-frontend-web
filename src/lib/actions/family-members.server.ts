"use server";

import { authenticatedApi, getServerSession } from "./auth.server";
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

const MY_FAMILY_MEMBERS = "/family-members/me";
const myFamilyMember = (id: string) => `${MY_FAMILY_MEMBERS}/${encodeURIComponent(id)}`;

/** Body of `POST /family-members/me` (`CreateMyFamilyMemberDto`). */
type CreateMyFamilyMemberInput = Omit<CreateFamilyMemberInput, "primaryPatientId">;

/**
 * Body of `PATCH /family-members/me/:id` (`UpdateFamilyMemberDto`).
 * `dateOfBirth: null` clears the date; an empty string is rejected by the backend.
 */
type UpdateMyFamilyMemberInput = Omit<UpdateFamilyMemberInput, "dateOfBirth"> & {
  dateOfBirth?: string | null;
};

async function requireSession(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }
}

function clinicHeaders(clinicId: string): Record<string, string> {
  return clinicId ? { "X-Clinic-ID": clinicId } : {};
}

export async function listMyFamilyMembers(clinicId: string): Promise<FamilyMember[]> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyMember[]>(MY_FAMILY_MEMBERS, {
    headers: clinicHeaders(clinicId),
  });
  return Array.isArray(data) ? data : [];
}

export async function createMyFamilyMember(
  clinicId: string,
  input: CreateMyFamilyMemberInput,
): Promise<FamilyMember> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyMember>(MY_FAMILY_MEMBERS, {
    method: "POST",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function updateMyFamilyMember(
  clinicId: string,
  id: string,
  input: UpdateMyFamilyMemberInput,
): Promise<FamilyMember> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyMember>(myFamilyMember(id), {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

/** Soft delete: the member leaves the family list; their clinical records are kept. */
export async function deleteMyFamilyMember(clinicId: string, id: string): Promise<void> {
  await requireSession();
  await authenticatedApi<void>(myFamilyMember(id), {
    method: "DELETE",
    headers: clinicHeaders(clinicId),
  });
}
