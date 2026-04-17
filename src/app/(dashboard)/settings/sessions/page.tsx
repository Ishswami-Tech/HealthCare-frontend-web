import { Metadata } from 'next';
import { ActiveSessionsList } from '@/components/settings/ActiveSessionsList';

export const metadata: Metadata = {
  title: 'Active Sessions',
  description: 'Manage your active sessions and devices',
};

export default function SessionsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Manage devices and sessions where you're currently logged in
          </p>
        </div>

        <ActiveSessionsList />
      </div>
    </div>
  );
}
