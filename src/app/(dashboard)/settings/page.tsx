import { Metadata } from 'next';
import { Lock, Monitor } from 'lucide-react';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';
import { ActiveSessionsList } from '@/components/settings/ActiveSessionsList';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { DashboardPageShell } from '@/components/dashboard/DashboardPageShell';
import { PageHead } from '@/components/tbd';
import { SettingsSection } from './_components/SettingsSection';

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your account settings and security',
};

export default function SettingsPage() {
  return (
    <DashboardPageShell>
      <PageHead
        title="Settings"
        description="Manage your account settings and security preferences"
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          <SettingsSection
            icon={Lock}
            title="Security"
            description="Update your password to keep your account secure"
          >
            <ChangePasswordForm />
          </SettingsSection>

          <SettingsSection
            id="sessions"
            icon={Monitor}
            title="Active Sessions"
            description="Manage devices and sessions where you're currently logged in"
            className="gap-1.5"
          >
            <ActiveSessionsList />
          </SettingsSection>
        </div>

        <div className="min-w-0">
          <NotificationPreferences />
        </div>
      </div>
    </DashboardPageShell>
  );
}
