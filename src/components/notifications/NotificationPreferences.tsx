'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Bell, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { IconBox, Note, Surface } from '@/components/tbd';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/query';

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

type SettingKey = keyof Required<NotificationPreferencesData>;

const CHANNELS: Array<{ key: SettingKey; label: string; description: string }> = [
  { key: 'emailEnabled', label: 'Email Notifications', description: 'Receive notifications via email' },
  { key: 'smsEnabled', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
  { key: 'pushEnabled', label: 'Push Notifications', description: 'Receive push notifications' },
  { key: 'whatsappEnabled', label: 'WhatsApp Notifications', description: 'Receive notifications via WhatsApp' },
];

const CATEGORIES: Array<{ key: SettingKey; label: string; description: string }> = [
  { key: 'appointmentEnabled', label: 'Appointments', description: 'Appointment confirmations, reminders, and changes' },
  { key: 'ehrEnabled', label: 'Medical Records (EHR)', description: 'Prescriptions, lab reports, and medical notes' },
  { key: 'billingEnabled', label: 'Billing & Payments', description: 'Invoices, receipts, and payment updates' },
  { key: 'systemEnabled', label: 'System', description: 'Security alerts, account updates, and system notifications' },
];

/** The design switch: 48 × 28 with a 22 px thumb. */
const SWITCH_CLASS =
  'h-7 w-12 border-0 p-[3px] shadow-none data-[state=unchecked]:bg-[#cbd5e1] dark:data-[state=unchecked]:bg-white/20 [&>span]:size-[22px] [&>span]:shadow-[0_1px_3px_rgba(0,0,0,0.2)] [&>span[data-state=checked]]:translate-x-5';

const GROUP_TITLE = 'm-0 text-[11px] font-extrabold uppercase tracking-[0.8px] text-ink-muted';

function PreferenceGroup({
  title,
  rows,
  settings,
  disabled,
  onToggle,
}: {
  title: string;
  rows: Array<{ key: SettingKey; label: string; description: string }>;
  settings: Record<SettingKey, boolean>;
  disabled: boolean;
  onToggle: (key: SettingKey, value: boolean) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <h3 className={GROUP_TITLE}>{title}</h3>
      {rows.map((row) => {
        const id = `notification-${row.key}`;
        return (
          <div key={row.key} className="flex items-center gap-4 border-b border-hair py-[13px] last:border-b-0">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <label htmlFor={id} className="text-sm font-bold text-ink">
                {row.label}
              </label>
              <span id={`${id}-hint`} className="text-xs text-ink-muted">
                {row.description}
              </span>
            </div>
            <Switch
              id={id}
              aria-describedby={`${id}-hint`}
              className={SWITCH_CLASS}
              checked={settings[row.key]}
              disabled={disabled}
              onCheckedChange={(checked) => onToggle(row.key, checked)}
            />
          </div>
        );
      })}
    </div>
  );
}

export function NotificationPreferences({ userId, onSave }: { userId?: string; onSave?: () => void }) {
  const { data: preferences, isPending: isLoading, error, refetch } = useNotificationPreferences();
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

  // The saved choices are not known: no switches, so "all off" is never saved over them by mistake.
  const loadFailed = Boolean(error) && !preferencesData;

  return (
    <Surface as="section" className="@container gap-3.5 p-[22px]" aria-labelledby="notification-preferences-title">
      <div className="flex items-center gap-3">
        <IconBox icon={Bell} size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id="notification-preferences-title" className="m-0 text-base font-bold text-ink">
            Notification Preferences
          </h2>
          <p className="m-0 text-[13px] text-ink-muted">Manage how you receive notifications</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col" aria-busy="true" aria-label="Loading notification preferences">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 border-b border-hair py-[13px] last:border-b-0">
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-56 max-w-full rounded" />
              </div>
              <Skeleton className="h-7 w-12 rounded-full" />
            </div>
          ))}
        </div>
      ) : loadFailed ? (
        <Note tone="rose" icon={AlertCircle} className="[&>div]:flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
            <span>
              <strong className="font-bold">Your notification settings could not be loaded.</strong> Please try again.
            </span>
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        </Note>
      ) : (
        <>
          {/* One column in a narrow card, two side by side when the card spans the page. */}
          <div className="mt-0.5 grid grid-cols-1 gap-x-10 gap-y-3.5 @3xl:grid-cols-2">
            <PreferenceGroup
              title="Notification Channels"
              rows={CHANNELS}
              settings={settings}
              disabled={isSaving}
              onToggle={handleToggle}
            />
            <PreferenceGroup
              title="Notification Categories"
              rows={CATEGORIES}
              settings={settings}
              disabled={isSaving}
              onToggle={handleToggle}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button size="md" className="w-full sm:w-auto" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
              {isSaving ? 'Saving…' : 'Save Preferences'}
            </Button>
          </div>
        </>
      )}
    </Surface>
  );
}
