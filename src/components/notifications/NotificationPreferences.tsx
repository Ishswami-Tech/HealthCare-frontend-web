'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/utils/useNotificationPreferences';
import { Loader2, Bell, Save } from 'lucide-react';
import { showSuccessToast, showErrorToast, TOAST_IDS } from '@/hooks/utils/use-toast';

interface NotificationPreferencesProps {
  userId?: string;
  onSave?: () => void;
}

interface NotificationPreferencesData {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  whatsapp?: boolean;
  types?: {
    appointments?: boolean;
    prescriptions?: boolean;
    reminders?: boolean;
    marketing?: boolean;
  };
}

export function NotificationPreferences({ userId, onSave }: NotificationPreferencesProps) {
  const { data: preferences, isPending: isLoading } = useNotificationPreferences();
  const preferencesData = preferences as NotificationPreferencesData | undefined;
  const { mutate: updatePreferences, isPending: isSaving } = useUpdateNotificationPreferences();
  
  const [settings, setSettings] = useState({
    email: false,
    sms: false,
    push: false,
    whatsapp: false,
    types: {
      appointments: false,
      prescriptions: false,
      reminders: false,
      marketing: false,
    },
  });

  useEffect(() => {
    if (preferencesData) {
      setSettings({
        email: preferencesData.email ?? false,
        sms: preferencesData.sms ?? false,
        push: preferencesData.push ?? false,
        whatsapp: preferencesData.whatsapp ?? false,
        types: {
          appointments: preferencesData.types?.appointments ?? false,
          prescriptions: preferencesData.types?.prescriptions ?? false,
          reminders: preferencesData.types?.reminders ?? false,
          marketing: preferencesData.types?.marketing ?? false,
        },
      });
    }
  }, [preferencesData]);

  const handleToggle = (key: 'email' | 'sms' | 'push' | 'whatsapp', value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypeToggle = (key: 'appointments' | 'prescriptions' | 'reminders' | 'marketing', value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      types: { ...prev.types, [key]: value },
    }));
  };

  const handleSave = () => {
    updatePreferences(
      { ...settings, ...(userId ? { userId } : {}) },
      {
        onSuccess: () => {
          showSuccessToast('Notification preferences updated successfully', {
            id: TOAST_IDS.NOTIFICATION.PREFERENCE_UPDATE,
          });
          onSave?.();
        },
        onError: (error: Error) => {
          showErrorToast(error.message || 'Failed to update preferences', {
            id: TOAST_IDS.NOTIFICATION.PREFERENCE_UPDATE,
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Preferences */}
        <div className="space-y-4">
          <h4 className="font-semibold">Notification Channels</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={settings.email}
                onCheckedChange={(checked) => handleToggle('email', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
              </div>
              <Switch
                checked={settings.sms}
                onCheckedChange={(checked) => handleToggle('sms', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
              <Switch
                checked={settings.push}
                onCheckedChange={(checked) => handleToggle('push', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>WhatsApp Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via WhatsApp</p>
              </div>
              <Switch
                checked={settings.whatsapp}
                onCheckedChange={(checked) => handleToggle('whatsapp', checked)}
              />
            </div>
          </div>
        </div>

        {/* Category Preferences */}
        <div className="space-y-4">
          <h4 className="font-semibold">Notification Types</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Appointment Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified about appointments</p>
              </div>
              <Switch
                checked={settings.types.appointments}
                onCheckedChange={(checked) => handleTypeToggle('appointments', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Prescription Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified about prescriptions</p>
              </div>
              <Switch
                checked={settings.types.prescriptions}
                onCheckedChange={(checked) => handleTypeToggle('prescriptions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Reminder Notifications</Label>
                <p className="text-sm text-muted-foreground">Get medication and appointment reminders</p>
              </div>
              <Switch
                checked={settings.types.reminders}
                onCheckedChange={(checked) => handleTypeToggle('reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive promotional and marketing updates</p>
              </div>
              <Switch
                checked={settings.types.marketing}
                onCheckedChange={(checked) => handleTypeToggle('marketing', checked)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



