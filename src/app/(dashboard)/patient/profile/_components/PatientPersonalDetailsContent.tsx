"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUpdateUserProfile } from "@/hooks/query/useUsers";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { PatientPersonalDetailsView, profileFieldId } from "./PatientPersonalDetailsView";
import {
  readPatientProfileMeta,
  serverFieldErrors,
  toPatientProfileForm,
  toPatientProfilePayload,
  validatePatientProfile,
  type PatientProfileErrors,
  type PatientProfileField,
  type PatientProfileForm,
} from "./patient-profile.logic";

interface PatientPersonalDetailsContentProps {
  /** The profile from `useUserProfile`. The page remounts this component when it arrives. */
  userProfile: unknown;
  isLoading: boolean;
  loadError?: string | null;
  onRetry?: () => void;
}

type SaveResult = { success?: boolean; error?: string; validationErrors?: unknown } | undefined;

function focusFirstError(errors: PatientProfileErrors) {
  const first = Object.keys(errors)[0] as PatientProfileField | undefined;
  if (first) document.getElementById(profileFieldId(first))?.focus();
}

/** Form state, checks and the save for "Personal details". The layout is `PatientPersonalDetailsView`. */
export function PatientPersonalDetailsContent({
  userProfile,
  isLoading,
  loadError = null,
  onRetry,
}: PatientPersonalDetailsContentProps) {
  const { session } = useAuth();
  const updateProfile = useUpdateUserProfile();
  const [saved, setSaved] = useState<PatientProfileForm>(() => toPatientProfileForm(userProfile, session?.user));
  const [form, setForm] = useState<PatientProfileForm>(saved);
  const [errors, setErrors] = useState<PatientProfileErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const meta = readPatientProfileMeta(userProfile);

  const handleFieldChange = (field: PatientProfileField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _cleared, ...rest } = current;
      return rest;
    });
  };

  const handleSubmit = async () => {
    setSaveError(null);
    const found = validatePatientProfile(form, { phone: Boolean(saved.phone), email: Boolean(saved.email) });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }

    try {
      const result = (await updateProfile.mutateAsync(toPatientProfilePayload(form))) as SaveResult;
      if (!result?.success) {
        const fromServer = serverFieldErrors(result);
        setErrors(fromServer);
        focusFirstError(fromServer);
        const message = result?.error || "Your details could not be saved. Please try again.";
        setSaveError(message);
        showErrorToast(message, { id: TOAST_IDS.PROFILE.UPDATE });
        return;
      }
      setSaved(form);
      showSuccessToast("Your details are saved", { id: TOAST_IDS.PROFILE.UPDATE });
    } catch (error) {
      setSaveError(error instanceof Error && error.message ? error.message : "Your details could not be saved. Please try again.");
      showErrorToast(error, { id: TOAST_IDS.PROFILE.UPDATE });
    }
  };

  return (
    <PatientPersonalDetailsView
      form={form}
      errors={errors}
      onFieldChange={handleFieldChange}
      onSubmit={() => void handleSubmit()}
      saving={updateProfile.isPending}
      saveError={saveError}
      loading={isLoading && !userProfile}
      loadError={userProfile ? null : loadError}
      onRetry={onRetry}
      photoUrl={meta.photoUrl}
      // A changed number has to be verified again, so the tag only stands for the saved one.
      phoneVerified={meta.phoneVerified && form.phone.trim() === saved.phone}
    />
  );
}
