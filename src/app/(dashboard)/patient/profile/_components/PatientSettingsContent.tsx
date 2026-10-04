"use client";

import { useState } from "react";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { PasswordChangeModal } from "@/components/patient/password-change-modal";
import { useAuth } from "@/hooks/auth/useAuth";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { useLanguage } from "@/lib/i18n/context";
import { PatientSettingsView } from "./PatientSettingsView";
import { useDeactivateAccount } from "./useDeactivateAccount";

/**
 * Language, security, data and notification settings of the patient. The layout is `PatientSettingsView`.
 * There is no privacy-settings API and no download-my-data API, so no switch pretends to save one.
 */
export function PatientSettingsContent() {
  const { language, setLanguage, supportedLanguages, isLoading: languageChanging } = useLanguage();
  const { logoutAsync } = useAuth();
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
      dialogs={<PasswordChangeModal open={passwordOpen} onOpenChange={setPasswordOpen} />}
    />
  );
}
