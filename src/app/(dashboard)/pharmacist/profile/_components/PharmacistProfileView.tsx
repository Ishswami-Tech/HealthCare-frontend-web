"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Note } from "@/components/tbd";
import { PharmacistProfilePersonalCard } from "./PharmacistProfilePersonalCard";
import { PharmacistProfileSecurityCard } from "./PharmacistProfileSecurityCard";
import { PharmacistProfileSummaryCard } from "./PharmacistProfileSummaryCard";
import type { PharmacistProfileForm } from "./pharmacist-profile.logic";

export interface PharmacistProfileViewProps {
  tab: string;
  onTabChange: (tab: string) => void;

  form: PharmacistProfileForm;
  onFieldChange: (field: keyof PharmacistProfileForm, value: string) => void;
  onSubmit: () => void;
  saving?: boolean;

  loading?: boolean;
  /** Set when the profile could not be loaded. */
  loadError?: string | null;
  onRetry?: (() => void) | undefined;

  photoUrl?: string | undefined;
  isVerified: boolean;

  passwordDialogOpen: boolean;
  onPasswordDialogChange: (open: boolean) => void;
  changePasswordForm: ReactNode;
}

/** Pharmacist profile layout. Props only — data and the save live in the page. */
export function PharmacistProfileView({
  tab,
  onTabChange,
  form,
  onFieldChange,
  onSubmit,
  saving = false,
  loading = false,
  loadError = null,
  onRetry,
  photoUrl,
  isVerified,
  passwordDialogOpen,
  onPasswordDialogChange,
  changePasswordForm,
}: PharmacistProfileViewProps) {
  const unavailable = Boolean(loadError) && !loading;

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Account"
        title="Pharmacist Profile"
        description="Manage your personal information and account settings"
      />

      {loadError ? (
        <Note tone="rose" icon={AlertCircle} className="[&>div]:flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
            <span>
              <strong className="font-bold">Your profile could not be loaded.</strong> {loadError}
            </span>
            {onRetry ? (
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </div>
        </Note>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Tabs value={tab} onValueChange={onTabChange} className="min-w-0 gap-5">
          <TabsList>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PharmacistProfilePersonalCard
              form={form}
              onFieldChange={onFieldChange}
              onSubmit={onSubmit}
              saving={saving}
              loading={loading}
              unavailable={unavailable}
            />
          </TabsContent>

          <TabsContent value="security">
            <PharmacistProfileSecurityCard
              loading={loading}
              passwordDialogOpen={passwordDialogOpen}
              onPasswordDialogChange={onPasswordDialogChange}
              changePasswordForm={changePasswordForm}
            />
          </TabsContent>
        </Tabs>

        {unavailable ? null : (
          <PharmacistProfileSummaryCard form={form} photoUrl={photoUrl} isVerified={isVerified} loading={loading} />
        )}
      </div>
    </DashboardPageShell>
  );
}
