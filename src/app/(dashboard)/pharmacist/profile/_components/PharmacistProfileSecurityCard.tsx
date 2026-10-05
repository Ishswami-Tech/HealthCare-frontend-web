"use client";

import type { ReactNode } from "react";
import { Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { IconBox, Pill, Surface, type TbdIcon } from "@/components/tbd";

interface PharmacistProfileSecurityCardProps {
  loading?: boolean;
  passwordDialogOpen: boolean;
  onPasswordDialogChange: (open: boolean) => void;
  /** The change-password form (the page passes the shared `ChangePasswordForm`). */
  changePasswordForm: ReactNode;
}

function SecurityRow({
  icon,
  title,
  description,
  children,
}: {
  icon: TbdIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-line px-4 py-3.5">
      <IconBox icon={icon} tone="slate" size={40} />
      <span className="flex min-w-[130px] flex-1 flex-col gap-0.5">
        <span className="text-sm font-bold text-ink">{title}</span>
        <span className="text-[13px] text-ink-muted">{description}</span>
      </span>
      {children}
    </li>
  );
}

/** "Account Security": change the password; two-factor is shown as not available yet. */
export function PharmacistProfileSecurityCard({
  loading = false,
  passwordDialogOpen,
  onPasswordDialogChange,
  changePasswordForm,
}: PharmacistProfileSecurityCardProps) {
  return (
    <Surface as="section" className="gap-4 p-[22px]" aria-labelledby="pharmacist-security-title">
      <div className="flex items-center gap-3">
        <IconBox icon={Shield} tone="mint" size={36} />
        <h2 id="pharmacist-security-title" className="m-0 text-base font-bold text-ink">
          Account Security
        </h2>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading security settings">
          <Skeleton className="h-[70px] w-full rounded-[14px]" />
          <Skeleton className="h-[70px] w-full rounded-[14px]" />
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          <SecurityRow icon={Lock} title="Password" description="Change your account password">
            <Button variant="outline" className="h-10" onClick={() => onPasswordDialogChange(true)}>
              Update
            </Button>
          </SecurityRow>
          <SecurityRow icon={Shield} title="Two-Factor Authentication" description="Add an extra layer of security">
            <Pill tone="slate">Not available yet</Pill>
          </SecurityRow>
        </ul>
      )}

      <Dialog open={passwordDialogOpen} onOpenChange={onPasswordDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Enter your current password, then the new one.</DialogDescription>
          </DialogHeader>
          {changePasswordForm}
        </DialogContent>
      </Dialog>
    </Surface>
  );
}
