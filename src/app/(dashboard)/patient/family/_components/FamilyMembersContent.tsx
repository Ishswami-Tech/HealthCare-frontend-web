"use client";

import { useState } from "react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useCreateMyFamilyMember, useMyFamilyMembers } from "@/hooks/query/useMyFamilyMembers";
import { FamilyMemberFormDialog } from "./FamilyMemberDialogs";
import { FamilyMembersView, type FamilyMembersState } from "./FamilyMembersView";
import { errorText, toCreateInput, type FamilyMemberFormValues } from "./family.logic";
import { useFamilyIdentity } from "./useFamilyIdentity";

/** Data container for /patient/family: the hooks live here, the layout is `FamilyMembersView`. */
export function FamilyMembersContent() {
  const { user, userId, clinicId, userName, authLoading } = useFamilyIdentity();
  const { data: members, error, refetch } = useMyFamilyMembers(clinicId, { enabled: !!userId });
  const createMember = useCreateMyFamilyMember();
  const [addOpen, setAddOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // A failed background refresh keeps the list that is already on screen.
  const state: FamilyMembersState =
    members !== undefined ? "ready" : error ? "error" : authLoading || userId ? "loading" : "error";

  const openAdd = () => {
    setSaveError(null);
    setAddOpen(true);
  };

  const handleAdd = async (values: FamilyMemberFormValues) => {
    setSaveError(null);
    try {
      await createMember.mutateAsync({ clinicId, input: toCreateInput(values) });
      setAddOpen(false);
    } catch (failure) {
      setSaveError(errorText(failure) || "Please try again.");
    }
  };

  return (
    <DashboardPageShell>
      <FamilyMembersView
        state={state}
        you={{
          name: userName,
          dateOfBirth: user?.dateOfBirth ?? null,
          gender: user?.gender ?? null,
          ...(user?.profilePicture ? { avatarUrl: user.profilePicture } : {}),
        }}
        members={members ?? []}
        onAdd={openAdd}
        onRetry={() => void refetch()}
      />
      <FamilyMemberFormDialog
        open={addOpen}
        isSaving={createMember.isPending}
        errorMessage={saveError}
        onSubmit={(values) => void handleAdd(values)}
        onClose={() => setAddOpen(false)}
      />
    </DashboardPageShell>
  );
}
