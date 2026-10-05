"use client";

import Link from "next/link";
import {
  Bell,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  Loader2,
  LogOut,
  Pencil,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHead, Pill, Surface } from "@/components/tbd";
import { LoadErrorNote, MenuRow, ProfileAvatar } from "./ProfileParts";
import { HELP_ROUTE, PROFILE_EDIT_ROUTE, PROFILE_SETTINGS_ROUTE } from "./patient-profile.logic";

export interface ProfileHubStat {
  key: string;
  label: string;
  /** `null` = the number is not known (still shown as a dash, never a made-up value). */
  value: number | null;
  loading?: boolean;
  href: string;
}

export interface PatientProfileHubViewProps {
  name: string;
  phone: string;
  email: string;
  photoUrl?: string | undefined;
  phoneVerified?: boolean;

  loading?: boolean;
  /** Set when the profile could not be loaded. */
  loadError?: string | null;
  onRetry?: (() => void) | undefined;

  stats: ProfileHubStat[];
  /** The language the app is shown in ("English"). */
  languageLabel: string;
  /** Channels that are switched on ("Email, WhatsApp"); left out while not known. */
  notificationsLabel?: string | undefined;
  appVersion?: string | undefined;

  logoutOpen: boolean;
  onLogoutOpenChange: (open: boolean) => void;
  onLogout: () => void;
  loggingOut?: boolean;
}

/** Profile hub: who is signed in, three numbers, and the way into every account screen. Props only. */
export function PatientProfileHubView({
  name,
  phone,
  email,
  photoUrl,
  phoneVerified = false,
  loading = false,
  loadError = null,
  onRetry,
  stats,
  languageLabel,
  notificationsLabel,
  appVersion,
  logoutOpen,
  onLogoutOpenChange,
  onLogout,
  loggingOut = false,
}: PatientProfileHubViewProps) {
  return (
    <DashboardPageShell>
      <PageHead title="Profile" />

      {loadError ? (
        <LoadErrorNote title="Your profile could not be loaded." message={loadError} onRetry={onRetry} />
      ) : null}

      <Surface as="section" className="p-6" aria-label="Your account">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
          {loading ? (
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:min-w-[280px]" aria-busy="true" aria-label="Loading profile">
              <Skeleton className="size-[72px] shrink-0 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-44 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-52 rounded" />
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:min-w-[280px]">
              <ProfileAvatar
                name={name}
                photoUrl={photoUrl}
                size={72}
                className="border-[3px] border-[#d1fae5] dark:border-emerald-900"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-xl font-extrabold tracking-[-0.3px] text-ink">
                  {name || (loadError ? "Profile not loaded" : "Your profile")}
                </span>
                {phone ? (
                  <span className="flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
                    {phone}
                    {phoneVerified ? <Pill tone="green">Verified</Pill> : null}
                  </span>
                ) : null}
                {email ? <span className="truncate text-[13px] text-ink-muted">{email}</span> : null}
                {!phone && !email && !loadError ? (
                  <span className="text-[13px] text-ink-muted">Add your phone number and email in Personal details.</span>
                ) : null}
              </div>
            </div>
          )}

          <ul className="m-0 grid w-full list-none grid-cols-3 rounded-2xl bg-[#f6f5fd] p-0 py-3.5 lg:w-[420px] dark:bg-white/5">
            {stats.map((stat, index) => (
              <li key={stat.key} className={index < stats.length - 1 ? "border-r border-line" : undefined}>
                <Link
                  href={stat.href}
                  className="flex flex-col items-center gap-0.5 rounded-lg px-3 text-ink transition-colors hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {stat.loading ? (
                    <Skeleton className="my-0.5 h-[22px] w-8 rounded" />
                  ) : (
                    <span className="text-[22px] font-extrabold leading-[1.2]">
                      {stat.value === null ? (
                        <>
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">Not available</span>
                        </>
                      ) : (
                        stat.value
                      )}
                    </span>
                  )}
                  <span className="text-xs text-ink-muted">{stat.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <Button asChild variant="soft" size="md" className="w-full sm:w-auto">
            <Link href={PROFILE_EDIT_ROUTE}>
              <Pencil strokeWidth={2.4} aria-hidden="true" />
              Edit profile
            </Link>
          </Button>
        </div>
      </Surface>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Surface as="section" className="gap-0 px-5 py-1.5" aria-label="Your details and records">
          <MenuRow icon={UserRound} tone="blue" label="Personal details" href={PROFILE_EDIT_ROUTE} />
          <MenuRow icon={FileText} tone="orange" label="Medical records" href="/patient/health/reports" />
          <MenuRow icon={Users} tone="violet" label="Family members" href="/patient/family" />
          <MenuRow icon={CreditCard} tone="mint" label="Payments & invoices" href="/patient/payments" />
        </Surface>

        <Surface as="section" className="gap-0 px-5 py-1.5" aria-label="Settings and help">
          <MenuRow
            icon={Bell}
            tone="amber"
            label="Notifications"
            value={notificationsLabel}
            href={`${PROFILE_SETTINGS_ROUTE}#notifications`}
          />
          <MenuRow icon={Globe} tone="sky" label="Language" value={languageLabel} href={PROFILE_SETTINGS_ROUTE} />
          <MenuRow icon={ShieldCheck} tone="slate" label="Privacy & security" href={`${PROFILE_SETTINGS_ROUTE}#privacy`} />
          <MenuRow icon={HelpCircle} tone="pink" label="Help & support" href={HELP_ROUTE} />
        </Surface>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="danger" size="md" onClick={() => onLogoutOpenChange(true)}>
          <LogOut strokeWidth={2.4} aria-hidden="true" />
          Log out
        </Button>
        {appVersion ? <span className="text-xs text-ink-muted">TestByDoctor · Version {appVersion}</span> : null}
      </div>

      <Dialog open={logoutOpen} onOpenChange={(open) => (loggingOut ? undefined : onLogoutOpenChange(open))}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>You will need to sign in again to see your visits and records.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="md" onClick={() => onLogoutOpenChange(false)} disabled={loggingOut}>
              Stay signed in
            </Button>
            <Button variant="danger" size="md" onClick={onLogout} disabled={loggingOut}>
              {loggingOut ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
              {loggingOut ? "Logging out…" : "Log out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
