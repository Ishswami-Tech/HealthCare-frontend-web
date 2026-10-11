"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import {
  createMyFamilyMember,
  deleteMyFamilyMember,
  listMyFamilyMembers,
  updateMyFamilyMember,
} from "@/lib/actions/family-members.server";
import type { CreateFamilyMemberInput, UpdateFamilyMemberInput } from "@/types/patient-visit.types";

/**
 * Family members of the signed-in patient (`/family-members/me`).
 * The staff hooks (`useFamilyMembers` in `usePatientVisits.ts`) call routes a patient may not use.
 */

/** Body of `POST /family-members/me`: the head of the family is the signed-in patient. */
export type CreateMyFamilyMemberInput = Omit<CreateFamilyMemberInput, "primaryPatientId">;

/** Body of `PATCH /family-members/me/:id`. `dateOfBirth: null` clears the date. */
export type UpdateMyFamilyMemberInput = Omit<UpdateFamilyMemberInput, "dateOfBirth"> & {
  dateOfBirth?: string | null;
};

/** The data of a family-members action result; a failure becomes the error the query or mutation reports. */
function unwrap<T>(result: { success: true; data: T } | { success: false; error: string }, fallback: string): T {
  if (!result.success) {
    throw new Error(result.error || fallback);
  }
  return result.data;
}

export const myFamilyMemberKeys = {
  all: ["my-family-members"] as const,
  list: (clinicId: string) => ["my-family-members", "list", clinicId] as const,
};

export const useMyFamilyMembers = (clinicId: string, options: { enabled?: boolean } = {}) =>
  useQueryData(
    myFamilyMemberKeys.list(clinicId),
    async () => unwrap(await listMyFamilyMembers(clinicId), "Failed to fetch your family members"),
    { enabled: options.enabled ?? true },
  );

export const useCreateMyFamilyMember = () =>
  useMutationOperation(
    async ({ clinicId, input }: { clinicId: string; input: CreateMyFamilyMemberInput }) =>
      unwrap(await createMyFamilyMember(clinicId, input), "Failed to add the family member"),
    {
      toastId: "my-family-member-create",
      loadingMessage: "Adding family member...",
      successMessage: "Family member added",
      errorMessage: "We could not add this family member. Please try again.",
      invalidateQueries: [[...myFamilyMemberKeys.all]],
    },
  );

export const useUpdateMyFamilyMember = () =>
  useMutationOperation(
    async ({ clinicId, id, input }: { clinicId: string; id: string; input: UpdateMyFamilyMemberInput }) =>
      unwrap(await updateMyFamilyMember(clinicId, id, input), "Failed to update the family member"),
    {
      toastId: "my-family-member-update",
      loadingMessage: "Saving...",
      successMessage: "Family member updated",
      errorMessage: "We could not save these details. Please try again.",
      invalidateQueries: [[...myFamilyMemberKeys.all]],
    },
  );

export const useDeleteMyFamilyMember = () =>
  useMutationOperation(
    async ({ clinicId, id }: { clinicId: string; id: string }) => {
      unwrap(await deleteMyFamilyMember(clinicId, id), "Failed to remove the family member");
    },
    {
      toastId: "my-family-member-delete",
      loadingMessage: "Removing...",
      successMessage: "Family member removed",
      errorMessage: "We could not remove this family member. Please try again.",
      invalidateQueries: [[...myFamilyMemberKeys.all]],
    },
  );
