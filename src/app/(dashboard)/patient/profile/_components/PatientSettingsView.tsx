"use client";

import type { ReactNode } from "react";
import { Check, FileText, Globe, KeyRound, ScrollText, ShieldCheck } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { PageHead, Pill, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { DeactivateAccountDialog } from "./DeactivateAccountDialog";
import { IconHeading, MenuRow } from "./ProfileParts";
import { PROFILE_HUB_ROUTE } from "./patient-profile.logic";

export interface SettingsLanguageOption {
  code: string;
  /** The language in its own script ("मराठी"). */
  nativeName: string;
  /** The language in English ("Marathi"). */
  name: string;
}

export interface PatientSettingsViewProps {
  languages: SettingsLanguageOption[];
  language: string;
  onLanguageChange: (code: string) => void;
  languageChanging?: boolean;

  onChangePassword: () => void;

  /** `false` while there is no download-my-data API: the row shows "Not available yet". */
  dataExportAvailable?: boolean;
  onExportData?: (() => void) | undefined;

  deactivateOpen: boolean;
  onDeactivateOpenChange: (open: boolean) => void;
  onDeactivate: () => void;
  deactivating?: boolean;
  deactivateError?: string | null;

  /** The notification preferences card (it loads and saves its own data). */
  notifications: ReactNode;
  /** Dialogs owned by the container (change password, export). */
  dialogs?: ReactNode;
}

/** "Language & privacy": app language, account security, data and notification settings. Props only. */
export function PatientSettingsView({
  languages,
  language,
  onLanguageChange,
  languageChanging = false,
  onChangePassword,
  dataExportAvailable = false,
  onExportData,
  deactivateOpen,
  onDeactivateOpenChange,
  onDeactivate,
  deactivating = false,
  deactivateError = null,
  notifications,
  dialogs,
}: PatientSettingsViewProps) {
  return (
    <DashboardPageShell>
      <PageHead title="Language & privacy" backHref={PROFILE_HUB_ROUTE} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="flex min-w-0 flex-col gap-3" aria-labelledby="settings-language-title">
            <IconHeading id="settings-language-title" icon={Globe} iconClassName="bg-[#0284c7]">
              App language
            </IconHeading>
            <fieldset
              className="m-0 grid min-w-0 grid-cols-1 gap-3 border-0 p-0 sm:grid-cols-2"
              disabled={languageChanging}
              aria-labelledby="settings-language-title"
            >
              {languages.map((option) => {
                const checked = option.code === language;
                return (
                  <label
                    key={option.code}
                    className={cn(
                      "flex min-h-[84px] cursor-pointer items-center gap-3 rounded-2xl border-2 px-[18px] text-ink transition-colors",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 has-[:disabled]:cursor-wait",
                      checked
                        ? "border-[#047857] bg-mint-soft"
                        : "border-line bg-card hover:border-[#a7f3d0] dark:hover:border-emerald-800",
                    )}
                  >
                    <input
                      type="radio"
                      name="app-language"
                      value={option.code}
                      checked={checked}
                      onChange={() => onLanguageChange(option.code)}
                      className="sr-only"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-lg font-extrabold leading-tight" lang={option.code}>
                        {option.nativeName}
                      </span>
                      <span className="text-xs text-ink-muted">{option.name}</span>
                    </span>
                    {checked ? (
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#047857] text-white"
                        aria-hidden="true"
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="size-6 shrink-0 rounded-full border-2 border-[#cbd5e1] dark:border-white/25" aria-hidden="true" />
                    )}
                  </label>
                );
              })}
            </fieldset>
            <p className="m-0 text-xs text-ink-muted">Some screens are still shown in English.</p>
          </section>

          <section
            className="flex min-w-0 flex-col rounded-[20px] border border-[#fecaca] bg-[#fef2f2] px-5 py-1 dark:border-rose-900 dark:bg-rose-950/30"
            aria-label="Your data and account"
          >
            <div className="flex min-h-[68px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#fecaca] py-3 dark:border-rose-900">
              <span className="flex min-w-[180px] flex-1 flex-col gap-0.5">
                <span className="text-sm font-extrabold text-[#991b1b] dark:text-rose-200">Download my data</span>
                <span className="text-[13px] text-[#7f1d1d] dark:text-rose-200/80">
                  Get a copy of your records and account details
                </span>
              </span>
              {dataExportAvailable && onExportData ? (
                <Button variant="danger" size="lg" className="px-4" onClick={onExportData}>
                  Request
                </Button>
              ) : (
                <Pill tone="slate" className="bg-white/80 dark:bg-white/10">Not available yet</Pill>
              )}
            </div>
            <div className="flex min-h-[68px] flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="flex min-w-[180px] flex-1 flex-col gap-0.5">
                <span className="text-sm font-extrabold text-[#991b1b] dark:text-rose-200">Deactivate my account</span>
                <span className="text-[13px] text-[#7f1d1d] dark:text-rose-200/80">
                  You are signed out and cannot sign in again. Your medical records are kept.
                </span>
              </span>
              <Button variant="danger" size="lg" className="px-4" onClick={() => onDeactivateOpenChange(true)}>
                Deactivate
              </Button>
            </div>
          </section>
        </div>

        <section id="privacy" className="flex min-w-0 scroll-mt-24 flex-col gap-3" aria-labelledby="settings-privacy-title">
          <IconHeading id="settings-privacy-title" icon={ShieldCheck} iconClassName="bg-[#3b4a5e]">
            Privacy & security
          </IconHeading>
          <Surface className="gap-0 px-5 py-1">
            <MenuRow
              icon={KeyRound}
              tone="mint"
              label="Password"
              description="Change the password you sign in with"
              right={
                <Button variant="outline" onClick={onChangePassword}>
                  Change
                </Button>
              }
            />
            <MenuRow
              icon={FileText}
              tone="blue"
              label="Privacy policy"
              description="How we use and protect your data"
              href="/privacy-policy"
              external
            />
            <MenuRow
              icon={ScrollText}
              tone="slate"
              label="Terms of service"
              description="The rules for using TestByDoctor"
              href="/terms-of-service"
              external
            />
          </Surface>
        </section>
      </div>

      <div id="notifications" className="min-w-0 scroll-mt-24">
        {notifications}
      </div>

      <DeactivateAccountDialog
        open={deactivateOpen}
        onOpenChange={onDeactivateOpenChange}
        onConfirm={onDeactivate}
        pending={deactivating}
        error={deactivateError}
      />
      {dialogs}
    </DashboardPageShell>
  );
}
