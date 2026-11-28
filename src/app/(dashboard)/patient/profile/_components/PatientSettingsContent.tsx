"use client";

import { useState } from "react";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { PasswordChangeModal } from "@/components/patient/password-change-modal";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHasPassword } from "@/hooks/auth/useHasPassword";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { useLanguage } from "@/lib/i18n/context";
import { PatientSettingsView } from "./PatientSettingsView";
import { useDeactivateAccount } from "@/hooks/query/useDeactivateAccount";
import { useClinicBrandName } from "@/hooks/query/useClinicBrandName";

/**
 * Language, security, data and notification settings of the patient. The layout is `PatientSettingsView`.
 * There is no privacy-settings API and no download-my-data API, so no switch pretends to save one.
 */
export function PatientSettingsContent() {
  const { language, setLanguage, supportedLanguages, isLoading: languageChanging } = useLanguage();
  const { session, logoutAsync } = useAuth();
  const clinic = useClinicBrandName();
  // Patients usually sign in with a one-time code; the password row only makes sense for an
  // account that has a password (`hasPassword` from the API; older payloads: the login method).
  const showPassword = useHasPassword() === true;
  const deactivate = useDeactivateAccount();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const languages = Object.values(supportedLanguages).map((entry) => ({
    code: entry.code,
    nativeName: entry.nativeName,
    name: entry.name,
  }));

  const handleLanguageChange = (code: string) => {
    if (code in supportedLanguages) setLanguage(code as SupportedLanguage);
  };

  const handleDeactivate = async () => {
    setDeactivateError(null);
    try {
      await deactivate.mutateAsync();
    } catch (error) {
      setDeactivateError(
        error instanceof Error && error.message ? error.message : "We could not deactivate your account. Please try again.",
      );
      return;
    }
    // The backend has revoked every session; the normal log-out clears this device and opens the sign-in page.
    setSigningOut(true);
    try {
      await logoutAsync();
    } catch {
      // `useAuth` clears the local session and redirects even when the server call fails.
    }
  };

  return (
    <PatientSettingsView
      languages={languages}
      language={language}
      onLanguageChange={handleLanguageChange}
      languageChanging={languageChanging}
      onChangePassword={() => setPasswordOpen(true)}
      showPassword={showPassword}
      clinicName={clinic.isKnown ? clinic.name : ""}
      dataExportAvailable={false}
      deactivateOpen={deactivateOpen}
      onDeactivateOpenChange={(open) => {
        setDeactivateOpen(open);
        if (!open) setDeactivateError(null);
      }}
      onDeactivate={() => void handleDeactivate()}
      deactivating={deactivate.isPending || signingOut}
      deactivateError={deactivateError}
      notifications={<NotificationPreferences />}
      // The shared change-password flow (`useAuth().changePasswordAsync`).
      dialogs={showPassword ? <PasswordChangeModal open={passwordOpen} onOpenChange={setPasswordOpen} /> : null}
    />
  );
}
