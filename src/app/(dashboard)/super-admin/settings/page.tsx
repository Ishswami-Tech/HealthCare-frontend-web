"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinics, useUpdateClinic } from "@/hooks/query/useClinics";
import { Loader2, Bell, Globe, Palette, Save, Shield } from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import type { ClinicWithRelations } from "@/types/clinic.types";

type SystemSettingsState = {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoBackup: boolean;
  maxFileSize: string;
  sessionTimeout: string;
  defaultLanguage: string;
};

type SecuritySettingsState = {
  twoFactorRequired: boolean;
  passwordExpiry: string;
  maxLoginAttempts: string;
  ipWhitelist: string;
  auditLogging: boolean;
  dataEncryption: boolean;
};

type NotificationSettingsState = {
  appointmentReminders: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
  emergencyAlerts: boolean;
};

const defaultSystemSettings: SystemSettingsState = {
  siteName: "Ayurveda Healthcare System",
  siteDescription: "Comprehensive healthcare management platform",
  supportEmail: "support@healthcareapp.com",
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  smsNotifications: true,
  autoBackup: true,
  maxFileSize: "10",
  sessionTimeout: "30",
  defaultLanguage: "en",
};

const defaultSecuritySettings: SecuritySettingsState = {
  twoFactorRequired: false,
  passwordExpiry: "90",
  maxLoginAttempts: "5",
  ipWhitelist: "",
  auditLogging: true,
  dataEncryption: true,
};

const defaultNotificationSettings: NotificationSettingsState = {
  appointmentReminders: true,
  systemAlerts: true,
  marketingEmails: false,
  weeklyReports: true,
  emergencyAlerts: true,
};

export default function SuperAdminSettings() {
  useAuth();
  const { data: clinicsData, isPending: clinicsLoading } = useClinics();
  const updateClinic = useUpdateClinic();
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [systemSettings, setSystemSettings] = useState<SystemSettingsState>(defaultSystemSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsState>(defaultSecuritySettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsState>(defaultNotificationSettings);

  const clinics = useMemo(() => {
    const data = clinicsData as any;
    const clinicsArray =
      (Array.isArray(clinicsData) ? clinicsData : data?.clinics || data?.data || []) as ClinicWithRelations[];
    return clinicsArray;
  }, [clinicsData]);

  const selectedClinic = useMemo(
    () => clinics.find(clinic => clinic.id === selectedClinicId) || clinics[0] || null,
    [clinics, selectedClinicId]
  );

  const updateSystemSetting = <K extends keyof SystemSettingsState>(key: K, value: SystemSettingsState[K]) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSecuritySetting = <K extends keyof SecuritySettingsState>(key: K, value: SecuritySettingsState[K]) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNotificationSetting = <K extends keyof NotificationSettingsState>(
    key: K,
    value: NotificationSettingsState[K]
  ) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!selectedClinicId && clinics[0]?.id) {
      setSelectedClinicId(clinics[0].id);
    }
  }, [clinics, selectedClinicId]);

  useEffect(() => {
    const settings = (selectedClinic as any)?.settings;
    if (!selectedClinic || !settings) {
      return;
    }

    setSystemSettings({
      siteName: settings.siteName || selectedClinic.name || defaultSystemSettings.siteName,
      siteDescription: settings.siteDescription || selectedClinic.description || defaultSystemSettings.siteDescription,
      supportEmail: settings.supportEmail || selectedClinic.email || defaultSystemSettings.supportEmail,
      maintenanceMode: !!settings.maintenanceMode,
      registrationEnabled:
        settings.registrationEnabled ?? settings.appointmentSettings?.allowOnlineBooking ?? true,
      emailNotifications:
        settings.emailNotifications ?? settings.notificationSettings?.emailEnabled ?? true,
      smsNotifications:
        settings.smsNotifications ?? settings.notificationSettings?.smsEnabled ?? true,
      autoBackup: settings.autoBackup ?? true,
      maxFileSize: String(settings.maxFileSize ?? defaultSystemSettings.maxFileSize),
      sessionTimeout: String(settings.sessionTimeout ?? settings.securitySettings?.sessionTimeout ?? defaultSystemSettings.sessionTimeout),
      defaultLanguage: settings.defaultLanguage || selectedClinic.language || defaultSystemSettings.defaultLanguage,
    });

    setSecuritySettings({
      twoFactorRequired: settings.twoFactorRequired ?? settings.securitySettings?.mfaRequired ?? false,
      passwordExpiry: String(
        settings.passwordExpiry ?? settings.securitySettings?.passwordPolicy?.expirationDays ?? defaultSecuritySettings.passwordExpiry
      ),
      maxLoginAttempts: String(settings.maxLoginAttempts ?? defaultSecuritySettings.maxLoginAttempts),
      ipWhitelist: Array.isArray(settings.ipWhitelist) ? settings.ipWhitelist.join(", ") : (settings.ipWhitelist || ""),
      auditLogging: settings.auditLogging ?? true,
      dataEncryption: settings.dataEncryption ?? true,
    });

    setNotificationSettings({
      appointmentReminders:
        settings.appointmentReminders ?? settings.notificationSettings?.emailEnabled ?? true,
      systemAlerts: settings.systemAlerts ?? true,
      marketingEmails: settings.marketingEmails ?? false,
      weeklyReports: settings.weeklyReports ?? true,
      emergencyAlerts: settings.emergencyAlerts ?? true,
    });
  }, [selectedClinic]);

  const save = async () => {
    if (!selectedClinic?.id) {
      showErrorToast("Select a clinic first", { id: TOAST_IDS.GLOBAL.ERROR });
      return;
    }

    const payload = {
      siteName: systemSettings.siteName.trim(),
      siteDescription: systemSettings.siteDescription.trim(),
      supportEmail: systemSettings.supportEmail.trim(),
      maintenanceMode: systemSettings.maintenanceMode,
      registrationEnabled: systemSettings.registrationEnabled,
      emailNotifications: systemSettings.emailNotifications,
      smsNotifications: systemSettings.smsNotifications,
      autoBackup: systemSettings.autoBackup,
      maxFileSize: Number(systemSettings.maxFileSize) || 0,
      sessionTimeout: Number(systemSettings.sessionTimeout) || 0,
      defaultLanguage: systemSettings.defaultLanguage,
      appointmentSettings: {
        allowOnlineBooking: systemSettings.registrationEnabled,
        requireApproval: systemSettings.maintenanceMode,
        defaultDuration: 30,
        bufferTime: 15,
        maxAdvanceBooking: 30,
      },
      notificationSettings: {
        emailEnabled: systemSettings.emailNotifications,
        smsEnabled: systemSettings.smsNotifications,
        reminderHours: [24, 2],
      },
      securitySettings: {
        mfaRequired: securitySettings.twoFactorRequired,
        sessionTimeout: Number(systemSettings.sessionTimeout) || 0,
        passwordPolicy: {
          minLength: 8,
          requireSpecialChars: true,
          requireNumbers: true,
          expirationDays: Number(securitySettings.passwordExpiry) || 90,
        },
      },
      integrationSettings: {
        enabledIntegrations: systemSettings.autoBackup ? ["email", "sms"] : ["email"],
      },
      auditLogging: securitySettings.auditLogging,
      dataEncryption: securitySettings.dataEncryption,
      maxLoginAttempts: Number(securitySettings.maxLoginAttempts) || 5,
      ipWhitelist: securitySettings.ipWhitelist
        .split(",")
        .map(item => item.trim())
        .filter(Boolean),
      marketingEmails: notificationSettings.marketingEmails,
      systemAlerts: notificationSettings.systemAlerts,
      weeklyReports: notificationSettings.weeklyReports,
      emergencyAlerts: notificationSettings.emergencyAlerts,
      appointmentReminders: notificationSettings.appointmentReminders,
    };

    try {
      await updateClinic.mutateAsync({
        id: selectedClinic.id,
        data: { settings: payload },
      });
      showSuccessToast("Clinic settings saved", { id: TOAST_IDS.GLOBAL.SUCCESS });
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to save settings",
        { id: TOAST_IDS.GLOBAL.ERROR }
      );
    }
  };

  if (clinicsLoading) {
    return (
      <div className="p-6 flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage clinic-level defaults and operational controls from one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select clinic" />
            </SelectTrigger>
            <SelectContent>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="flex items-center gap-2" onClick={save} disabled={updateClinic.isPending || !selectedClinic?.id}>
            {updateClinic.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" value={systemSettings.siteName} onChange={e => updateSystemSetting("siteName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" type="email" value={systemSettings.supportEmail} onChange={e => updateSystemSetting("supportEmail", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea id="siteDescription" value={systemSettings.siteDescription} onChange={e => updateSystemSetting("siteDescription", e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input id="maxFileSize" type="number" value={systemSettings.maxFileSize} onChange={e => updateSystemSetting("maxFileSize", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input id="sessionTimeout" type="number" value={systemSettings.sessionTimeout} onChange={e => updateSystemSetting("sessionTimeout", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Input id="defaultLanguage" value={systemSettings.defaultLanguage} onChange={e => updateSystemSetting("defaultLanguage", e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                {[
                  ["Maintenance Mode", "Temporarily disable access", "maintenanceMode", systemSettings.maintenanceMode],
                  ["User Registration", "Allow new users to register", "registrationEnabled", systemSettings.registrationEnabled],
                  ["Auto Backup", "Backup data automatically", "autoBackup", systemSettings.autoBackup],
                ].map(([label, desc, key, value]) => (
                  <div key={String(key)} className="flex items-center justify-between gap-4">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={checked =>
                        updateSystemSetting(key as keyof SystemSettingsState, checked as boolean)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Input id="passwordExpiry" type="number" value={securitySettings.passwordExpiry} onChange={e => updateSecuritySetting("passwordExpiry", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input id="maxLoginAttempts" type="number" value={securitySettings.maxLoginAttempts} onChange={e => updateSecuritySetting("maxLoginAttempts", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP Whitelist (comma-separated)</Label>
                <Textarea id="ipWhitelist" value={securitySettings.ipWhitelist} onChange={e => updateSecuritySetting("ipWhitelist", e.target.value)} rows={3} />
              </div>
              <div className="space-y-4">
                {[
                  ["Two-Factor Authentication Required", "Require 2FA for admin users", "twoFactorRequired", securitySettings.twoFactorRequired],
                  ["Audit Logging", "Record all critical actions", "auditLogging", securitySettings.auditLogging],
                  ["Data Encryption", "Encrypt sensitive data at rest", "dataEncryption", securitySettings.dataEncryption],
                ].map(([label, desc, key, value]) => (
                  <div key={String(key)} className="flex items-center justify-between gap-4">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={checked =>
                        updateSecuritySetting(key as keyof SecuritySettingsState, checked as boolean)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Appointment Reminders", "Send appointment reminders to patients", "appointmentReminders", notificationSettings.appointmentReminders],
                ["System Alerts", "Receive alerts for system issues", "systemAlerts", notificationSettings.systemAlerts],
                ["Emergency Alerts", "Urgent notifications for critical issues", "emergencyAlerts", notificationSettings.emergencyAlerts],
                ["Weekly Reports", "Receive weekly system performance reports", "weeklyReports", notificationSettings.weeklyReports],
                ["Marketing Emails", "Promotional communications", "marketingEmails", notificationSettings.marketingEmails],
              ].map(([label, desc, key, value]) => (
                  <div key={String(key)} className="flex items-center justify-between gap-4">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  <Switch
                    checked={Boolean(value)}
                    onCheckedChange={checked =>
                      updateNotificationSetting(
                        key as keyof NotificationSettingsState,
                        checked as boolean
                      )
                    }
                  />
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Theme and branding controls remain clinic-scoped. This screen now saves real clinic settings while keeping visual theming in the shared UI system.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
