"use client";

import { useState } from "react";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { useUpdateUserProfile } from "@/hooks/query/useUsers";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { PharmacistProfileView } from "./PharmacistProfileView";
import {
  PHARMACIST_PROFILE_TABS,
  readPharmacistProfileMeta,
  toPharmacistProfileForm,
  toPharmacistProfilePayload,
  type PharmacistProfileForm,
} from "./pharmacist-profile.logic";

interface PharmacistProfileContentProps {
  /** The profile from `useUserProfile`. The page remounts this component when it arrives. */
  userProfile: unknown;
  isLoading: boolean;
  loadError?: string | null;
  onRetry?: () => void;
}

/** Form state, tabs and the save for the pharmacist profile. The layout is `PharmacistProfileView`. */
export function PharmacistProfileContent({ userProfile, isLoading, loadError = null, onRetry }: PharmacistProfileContentProps) {
  const updateProfile = useUpdateUserProfile();
  const [form, setForm] = useState<PharmacistProfileForm>(() => toPharmacistProfileForm(userProfile));
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const { tab, setTab } = useHashTab({ tabs: PHARMACIST_PROFILE_TABS, defaultValue: "personal" });
  const meta = readPharmacistProfileMeta(userProfile);

  const handleSubmit = async () => {
    try {
      const result = (await updateProfile.mutateAsync(toPharmacistProfilePayload(form))) as
        | { success?: boolean; error?: string }
        | undefined;
      if (!result?.success) {
        showErrorToast(result?.error || "Your profile could not be saved.", { id: TOAST_IDS.PROFILE.UPDATE });
        return;
      }
      showSuccessToast("Profile saved", { id: TOAST_IDS.PROFILE.UPDATE });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.PROFILE.UPDATE });
    }
  };

  return (
    <PharmacistProfileView
      tab={tab}
      onTabChange={setTab}
      form={form}
      onFieldChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
      onSubmit={() => void handleSubmit()}
      saving={updateProfile.isPending}
      loading={isLoading && !userProfile}
      loadError={userProfile ? null : loadError}
      onRetry={onRetry}
      photoUrl={meta.photoUrl}
      isVerified={meta.isVerified}
      passwordDialogOpen={passwordDialogOpen}
      onPasswordDialogChange={setPasswordDialogOpen}
      // The shared change-password flow (`useAuth().changePasswordAsync`), mounted only while the dialog is open.
      changePasswordForm={passwordDialogOpen ? <ChangePasswordForm /> : null}
    />
  );
}
