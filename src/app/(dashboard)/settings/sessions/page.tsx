import { Metadata } from 'next';
import { Monitor } from 'lucide-react';
import { ActiveSessionsList } from '@/components/settings/ActiveSessionsList';
import { DashboardPageShell } from '@/components/dashboard/DashboardPageShell';
import { PageHead } from '@/components/tbd';
import { SettingsSection } from '../_components/SettingsSection';

export const metadata: Metadata = {
  title: 'Active Sessions',
  description: 'Manage your active sessions and devices',
};

export default function SessionsPage() {
  return (
    <DashboardPageShell>
      <PageHead
        title="Active Sessions"
        description="Manage devices and sessions where you're currently logged in"
        backHref="/settings"
        backLabel="Settings"
      />

      <SettingsSection
        id="sessions"
        icon={Monitor}
        title="Signed-in devices"
        description="Sign out a device you no longer use."
        className="max-w-[640px] gap-1.5"
      >
        <ActiveSessionsList />
      </SettingsSection>
    </DashboardPageShell>
  );
}
