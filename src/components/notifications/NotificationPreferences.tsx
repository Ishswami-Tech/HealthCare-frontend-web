'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/query';
import { Loader2, Bell, Save } from 'lucide-react';

interface NotificationPreferencesData {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  whatsappEnabled?: boolean;
  socketEnabled?: boolean;
  appointmentEnabled?: boolean;
  ehrEnabled?: boolean;
  billingEnabled?: boolean;
  systemEnabled?: boolean;
}

export function NotificationPreferences({ userId, onSave }: { userId?: string; onSave?: () => void }) {
  const { data: preferences, isPending: isLoading } = useNotificationPreferences();
  const preferencesData = preferences as NotificationPreferencesData | undefined;
  const { mutate: updatePreferences, isPending: isSaving } = useUpdateNotificationPreferences();

  const [settings, setSettings] = useState({
    emailEnabled: false,
    smsEnabled: false,
    pushEnabled: false,
    whatsappEnabled: false,
    socketEnabled: false,
    appointmentEnabled: false,
    ehrEnabled: false,
    billingEnabled: false,
    systemEnabled: false,
  });

  useEffect(() => {
    if (preferencesData) {
      setSettings({
        emailEnabled: preferencesData.emailEnabled ?? false,
        smsEnabled: preferencesData.smsEnabled ?? false,
        pushEnabled: preferencesData.pushEnabled ?? false,
        whatsappEnabled: preferencesData.whatsappEnabled ?? false,
        socketEnabled: preferencesData.socketEnabled ?? false,
        appointmentEnabled: preferencesData.appointmentEnabled ?? false,
        ehrEnabled: preferencesData.ehrEnabled ?? false,
        billingEnabled: preferencesData.billingEnabled ?? false,
        systemEnabled: preferencesData.systemEnabled ?? false,
      });
    }
  }, [preferencesData]);

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updatePreferences(
      { ...settings, ...(userId ? { userId } : {}) },
      {
        onSuccess: () => {
          onSave?.();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        {/* Channel Preferences */}
        <div className="flex flex-col gap-y-4">
          <h4 className="font-semibold">Notification Channels</h4>

          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => handleToggle('emailEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
              </div>
              <Switch
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => handleToggle('smsEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={(checked) => handleToggle('pushEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>WhatsApp Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via WhatsApp</p>
              </div>
              <Switch
                checked={settings.whatsappEnabled}
                onCheckedChange={(checked) => handleToggle('whatsappEnabled', checked)}
              />
            </div>
          </div>
        </div>

        {/* Category Preferences */}
        <div className="flex flex-col gap-y-4">
          <h4 className="font-semibold">Notification Categories</h4>

          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Appointments</Label>
                <p className="text-sm text-muted-foreground">Appointment confirmations, reminders, and changes</p>
              </div>
              <Switch
                checked={settings.appointmentEnabled}
                onCheckedChange={(checked) => handleToggle('appointmentEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Medical Records (EHR)</Label>
                <p className="text-sm text-muted-foreground">Prescriptions, lab reports, and medical notes</p>
              </div>
              <Switch
                checked={settings.ehrEnabled}
                onCheckedChange={(checked) => handleToggle('ehrEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Billing & Payments</Label>
                <p className="text-sm text-muted-foreground">Invoices, receipts, and payment updates</p>
              </div>
              <Switch
                checked={settings.billingEnabled}
                onCheckedChange={(checked) => handleToggle('billingEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>System</Label>
                <p className="text-sm text-muted-foreground">Security alerts, account updates, and system notifications</p>
              </div>
              <Switch
                checked={settings.systemEnabled}
                onCheckedChange={(checked) => handleToggle('systemEnabled', checked)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}





