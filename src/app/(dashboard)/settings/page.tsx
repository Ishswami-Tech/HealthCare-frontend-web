import { Metadata } from 'next';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your account settings and security',
};

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and security preferences
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <NotificationPreferences />
        </div>
      </div>
    </div>
  );
}

