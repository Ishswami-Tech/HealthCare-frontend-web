"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import {
  useDeleteMyFamilyMember,
  useMyFamilyMembers,
  useUpdateMyFamilyMember,
} from "@/hooks/query/useMyFamilyMembers";
import { FamilyMemberFormDialog, RemoveFamilyMemberDialog } from "./FamilyMemberDialogs";
import { FamilyMemberView, type FamilyMemberState } from "./FamilyMemberView";
import { errorText, toUpdateInput, type FamilyMemberFormValues } from "./family.logic";
import { useFamilyIdentity } from "./useFamilyIdentity";
import type { FamilyMember } from "@/types/patient-visit.types";

type OpenDialog = "edit" | "remove" | null;

/**
 * Data container for /patient/family/[id]. The member is read from the patient's own list
 * (`GET /family-members/me`; there is no single-member route), so an id that is not theirs
 * shows "Family member not found".
 */
export function FamilyMemberContent({ memberId }: { memberId: string }) {
  const router = useRouter();
  const { userId, clinicId, authLoading } = useFamilyIdentity();
  const { data: members, error, refetch } = useMyFamilyMembers(clinicId, { enabled: !!userId });
  const updateMember = useUpdateMyFamilyMember();
  const deleteMember = useDeleteMyFamilyMember();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  // After a remove the list refreshes before the redirect lands. The member being removed stays
  // on screen until then, so "not found" never flashes.
  const [leaving, setLeaving] = useState<FamilyMember | null>(null);

  const member = members?.find((candidate) => candidate.id === memberId) ?? leaving;
  const state: FamilyMemberState = member
    ? "ready"
    : members !== undefined
      ? "missing"
      : error
        ? "error"
        : authLoading || userId
          ? "loading"
          : "error";

  const open = (next: Exclude<OpenDialog, null>) => {
    setDialogError(null);
    setDialog(next);
  };

  const handleSave = async (values: FamilyMemberFormValues) => {
    if (!member) return;
    setDialogError(null);
    try {
      await updateMember.mutateAsync({ clinicId, id: member.id, input: toUpdateInput(values) });
      setDialog(null);
    } catch (failure) {
      setDialogError(errorText(failure) || "Please try again.");
    }
  };

  const handleRemove = async () => {
    if (!member) return;
    setDialogError(null);
    setLeaving(member);
    try {
      await deleteMember.mutateAsync({ clinicId, id: member.id });
      setDialog(null);
      router.replace("/patient/family");
    } catch (failure) {
      setLeaving(null);
      setDialogError(errorText(failure) || "Please try again.");
    }
  };

  return (
    <DashboardPageShell>
      <FamilyMemberView
        state={state}
        member={member}
        onEdit={() => open("edit")}
        onRemove={() => open("remove")}
        onRetry={() => void refetch()}
      />
      <FamilyMemberFormDialog
        open={dialog === "edit" && !!member}
        member={member}
        isSaving={updateMember.isPending}
        errorMessage={dialogError}
        onSubmit={(values) => void handleSave(values)}
        onClose={() => setDialog(null)}
      />
      <RemoveFamilyMemberDialog
        open={dialog === "remove" && !!member}
        member={member}
        isRemoving={deleteMember.isPending}
        errorMessage={dialogError}
        onConfirm={() => void handleRemove()}
        onClose={() => setDialog(null)}
      />
    </DashboardPageShell>
  );
}
