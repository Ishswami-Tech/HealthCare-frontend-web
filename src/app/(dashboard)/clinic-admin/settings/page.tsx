"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinic, useUpdateClinic } from "@/hooks/query/useClinics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Building2, Clock, Bell, CreditCard } from "lucide-react";
import type { Clinic, UpdateClinicData } from "@/types/clinic.types";

type ClinicFormState = {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  timezone: string;
  currency: string;
  language: string;
  operatingHours: string;
};

type ClinicSettingsState = {
  maxAdvanceBooking: number;
  minAdvanceBooking: number;
  appointmentDuration: number;
  cancellationWindow: number;
  noShowWindowMinutes: number;
  noShowFee: number;
  cancellationFee: number;
  allowRescheduling: boolean;
  allowCancellation: boolean;
  autoConfirmation: boolean;
  walkInAllowed: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  appointmentReminders: boolean;
  cancellationAlerts: boolean;
  paymentMethodsText: string;
  autoBilling: boolean;
  operatingStart: string;
  operatingEnd: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ClinicAdminSettingsPage() {
  useAuth();
  const { data: clinicData, isPending: isLoadingClinic } = useCurrentClinic();
  const updateClinicMutation = useUpdateClinic();

  const [initialized, setInitialized] = useState(false);
  const [clinicForm, setClinicForm] = useState<ClinicFormState>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    language: "en",
    operatingHours: "Mon-Sun 11:00 AM - 11:59 PM",
  });
  const [settingsForm, setSettingsForm] = useState<ClinicSettingsState>({
    maxAdvanceBooking: 30,
    minAdvanceBooking: 2,
    appointmentDuration: 30,
    cancellationWindow: 24,
    noShowWindowMinutes: 15,
    noShowFee: 0,
    cancellationFee: 0,
    allowRescheduling: true,
    allowCancellation: true,
    autoConfirmation: true,
    walkInAllowed: true,
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    appointmentReminders: true,
    cancellationAlerts: true,
    paymentMethodsText: "Cash, Card, UPI",
    autoBilling: false,
    operatingStart: "11:00",
    operatingEnd: "23:59",
  });

  const clinic = useMemo(() => {
    if (!clinicData) return null;
    return clinicData as Clinic;
  }, [clinicData]);

  useEffect(() => {
    if (!clinic || initialized) return;

    const rawSettings = isRecord(clinic.settings) ? clinic.settings : {};
    const appointmentSettings = isRecord(rawSettings.appointmentSettings)
      ? rawSettings.appointmentSettings
      : {};
    const notifications = isRecord(rawSettings.notifications) ? rawSettings.notifications : {};
    const notificationSettings = isRecord(rawSettings.notificationSettings)
      ? rawSettings.notificationSettings
      : {};
    const paymentSettings = isRecord(rawSettings.paymentSettings) ? rawSettings.paymentSettings : {};
    const customPolicies = isRecord(rawSettings.customPolicies) ? rawSettings.customPolicies : {};
    const dailyWindow = isRecord(appointmentSettings.dailyOperatingWindow)
      ? appointmentSettings.dailyOperatingWindow
      : {};

    setClinicForm({
      name: typeof clinic.name === "string" ? clinic.name : "",
      address: typeof clinic.address === "string" ? clinic.address : "",
      city: typeof clinic.city === "string" ? clinic.city : "",
      state: typeof clinic.state === "string" ? clinic.state : "",
      country: typeof clinic.country === "string" ? clinic.country : "India",
      zipCode: typeof clinic.zipCode === "string" ? clinic.zipCode : "",
      phone: typeof clinic.phone === "string" ? clinic.phone : "",
      email: typeof clinic.email === "string" ? clinic.email : "",
      website: typeof clinic.website === "string" ? clinic.website : "",
      description: typeof clinic.description === "string" ? clinic.description : "",
      timezone: typeof clinic.timezone === "string" ? clinic.timezone : "Asia/Kolkata",
      currency: typeof clinic.currency === "string" ? clinic.currency : "INR",
      language: typeof clinic.language === "string" ? clinic.language : "en",
      operatingHours:
        typeof clinic.operatingHours === "string"
          ? clinic.operatingHours
          : "Mon-Sun 11:00 AM - 11:59 PM",
    });

    setSettingsForm({
      maxAdvanceBooking: toNumber(appointmentSettings.maxAdvanceBooking, 30),
      minAdvanceBooking: toNumber(appointmentSettings.minAdvanceBooking, 2),
      appointmentDuration: toNumber(appointmentSettings.appointmentDuration, 30),
      cancellationWindow: toNumber(appointmentSettings.cancellationWindow, 24),
      noShowWindowMinutes: toNumber(appointmentSettings.noShowWindowMinutes, 15),
      noShowFee: toNumber(customPolicies.noShowFee, 0),
      cancellationFee: toNumber(customPolicies.cancellationFee, 0),
      allowRescheduling:
        typeof appointmentSettings.allowRescheduling === "boolean"
          ? appointmentSettings.allowRescheduling
          : true,
      allowCancellation:
        typeof appointmentSettings.allowCancellation === "boolean"
          ? appointmentSettings.allowCancellation
          : true,
      autoConfirmation:
        typeof appointmentSettings.autoConfirmation === "boolean"
          ? appointmentSettings.autoConfirmation
          : true,
      walkInAllowed:
        typeof appointmentSettings.walkInAllowed === "boolean"
          ? appointmentSettings.walkInAllowed
          : true,
      emailNotifications:
        typeof notifications.email === "boolean"
          ? notifications.email
          : typeof notificationSettings.emailNotifications === "boolean"
          ? notificationSettings.emailNotifications
          : true,
      smsNotifications:
        typeof notifications.sms === "boolean"
          ? notifications.sms
          : typeof notificationSettings.smsNotifications === "boolean"
          ? notificationSettings.smsNotifications
          : true,
      pushNotifications:
        typeof notifications.push === "boolean"
          ? notifications.push
          : typeof notificationSettings.pushNotifications === "boolean"
          ? notificationSettings.pushNotifications
          : false,
      appointmentReminders:
        typeof notificationSettings.appointmentReminders === "boolean"
          ? notificationSettings.appointmentReminders
          : true,
      cancellationAlerts:
        typeof notificationSettings.cancellationAlerts === "boolean"
          ? notificationSettings.cancellationAlerts
          : true,
      paymentMethodsText: Array.isArray(paymentSettings.paymentMethods)
        ? paymentSettings.paymentMethods.filter((item): item is string => typeof item === "string").join(", ")
        : "Cash, Card, UPI",
      autoBilling: typeof paymentSettings.autoBilling === "boolean" ? paymentSettings.autoBilling : false,
      operatingStart: typeof dailyWindow.start === "string" ? dailyWindow.start : "11:00",
      operatingEnd: typeof dailyWindow.end === "string" ? dailyWindow.end : "23:59",
    });

    setInitialized(true);
  }, [clinic, initialized]);

  const updateClinicValue = (key: keyof ClinicFormState, value: string) => {
    setClinicForm(prev => ({ ...prev, [key]: value }));
  };

  const updateSettingValue = (
    key: keyof ClinicSettingsState,
    value: string | number | boolean
  ) => {
    setSettingsForm(prev => ({ ...prev, [key]: value as never }));
  };

  const handleSave = async () => {
    if (!clinic || typeof clinic.id !== "string") return;

    const baseSettings = isRecord(clinic.settings) ? clinic.settings : {};
    const existingAppointmentSettings = isRecord(baseSettings.appointmentSettings)
      ? baseSettings.appointmentSettings
      : {};
    const existingNotificationSettings = isRecord(baseSettings.notificationSettings)
      ? baseSettings.notificationSettings
      : {};
    const existingNotifications = isRecord(baseSettings.notifications) ? baseSettings.notifications : {};
    const existingPaymentSettings = isRecord(baseSettings.paymentSettings) ? baseSettings.paymentSettings : {};
    const existingCustomPolicies = isRecord(baseSettings.customPolicies) ? baseSettings.customPolicies : {};

    const paymentMethods = settingsForm.paymentMethodsText
      .split(",")
      .map(method => method.trim())
      .filter(Boolean);

    const payload: UpdateClinicData = {
      name: clinicForm.name.trim(),
      address: clinicForm.address.trim(),
      city: clinicForm.city.trim(),
      state: clinicForm.state.trim(),
      country: clinicForm.country.trim(),
      zipCode: clinicForm.zipCode.trim(),
      phone: clinicForm.phone.trim(),
      email: clinicForm.email.trim(),
      website: clinicForm.website.trim(),
      description: clinicForm.description.trim(),
      timezone: clinicForm.timezone.trim() || "Asia/Kolkata",
      currency: clinicForm.currency.trim() || "INR",
      language: clinicForm.language.trim() || "en",
      operatingHours: clinicForm.operatingHours.trim(),
      settings: {
        ...baseSettings,
        appointmentSettings: {
          ...existingAppointmentSettings,
          maxAdvanceBooking: settingsForm.maxAdvanceBooking,
          minAdvanceBooking: settingsForm.minAdvanceBooking,
          appointmentDuration: settingsForm.appointmentDuration,
          cancellationWindow: settingsForm.cancellationWindow,
          noShowWindowMinutes: settingsForm.noShowWindowMinutes,
          allowRescheduling: settingsForm.allowRescheduling,
          allowCancellation: settingsForm.allowCancellation,
          autoConfirmation: settingsForm.autoConfirmation,
          walkInAllowed: settingsForm.walkInAllowed,
          dailyOperatingWindow: {
            start: settingsForm.operatingStart,
            end: settingsForm.operatingEnd,
          },
        },
        notificationSettings: {
          ...existingNotificationSettings,
          appointmentReminders: settingsForm.appointmentReminders,
          cancellationAlerts: settingsForm.cancellationAlerts,
          emailNotifications: settingsForm.emailNotifications,
          smsNotifications: settingsForm.smsNotifications,
          pushNotifications: settingsForm.pushNotifications,
        },
        notifications: {
          ...existingNotifications,
          email: settingsForm.emailNotifications,
          sms: settingsForm.smsNotifications,
          push: settingsForm.pushNotifications,
        },
        paymentSettings: {
          ...existingPaymentSettings,
          currency: clinicForm.currency.trim() || "INR",
          paymentMethods,
          autoBilling: settingsForm.autoBilling,
        },
        customPolicies: {
          ...existingCustomPolicies,
          noShowFee: settingsForm.noShowFee,
          cancellationFee: settingsForm.cancellationFee,
        },
      },
    };

    await updateClinicMutation.mutateAsync({
      id: clinic.id,
      data: payload,
    });
  };

  if (isLoadingClinic || !initialized) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[420px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinic || typeof clinic.id !== "string") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Clinic Settings</CardTitle>
            <CardDescription>Clinic context is not available for this session.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clinic Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update clinic profile, timings, no-show policy, booking, notifications, and payments.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={handleSave}
          disabled={updateClinicMutation.isPending}
        >
          {updateClinicMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Clinic Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Clinic Name</Label>
            <Input value={clinicForm.name} onChange={e => updateClinicValue("name", e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={clinicForm.phone} onChange={e => updateClinicValue("phone", e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={clinicForm.email} onChange={e => updateClinicValue("email", e.target.value)} />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={clinicForm.website} onChange={e => updateClinicValue("website", e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={clinicForm.city} onChange={e => updateClinicValue("city", e.target.value)} />
          </div>
          <div>
            <Label>State</Label>
            <Input value={clinicForm.state} onChange={e => updateClinicValue("state", e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={clinicForm.country} onChange={e => updateClinicValue("country", e.target.value)} />
          </div>
          <div>
            <Label>Zip Code</Label>
            <Input value={clinicForm.zipCode} onChange={e => updateClinicValue("zipCode", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Textarea value={clinicForm.address} onChange={e => updateClinicValue("address", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={clinicForm.description}
              onChange={e => updateClinicValue("description", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operations And Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Timezone</Label>
            <Input value={clinicForm.timezone} onChange={e => updateClinicValue("timezone", e.target.value)} />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={clinicForm.currency} onChange={e => updateClinicValue("currency", e.target.value)} />
          </div>
          <div>
            <Label>Language</Label>
            <Input value={clinicForm.language} onChange={e => updateClinicValue("language", e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Label>Operating Hours Summary</Label>
            <Input
              value={clinicForm.operatingHours}
              onChange={e => updateClinicValue("operatingHours", e.target.value)}
            />
          </div>
          <div>
            <Label>Daily Start</Label>
            <Input
              type="time"
              value={settingsForm.operatingStart}
              onChange={e => updateSettingValue("operatingStart", e.target.value)}
            />
          </div>
          <div>
            <Label>Daily End</Label>
            <Input
              type="time"
              value={settingsForm.operatingEnd}
              onChange={e => updateSettingValue("operatingEnd", e.target.value)}
            />
          </div>
          <div>
            <Label>Slot Duration (minutes)</Label>
            <Input
              type="number"
              min={5}
              value={settingsForm.appointmentDuration}
              onChange={e => updateSettingValue("appointmentDuration", toNumber(e.target.value, 30))}
            />
          </div>
          <div>
            <Label>Max Advance Booking (days)</Label>
            <Input
              type="number"
              min={1}
              value={settingsForm.maxAdvanceBooking}
              onChange={e => updateSettingValue("maxAdvanceBooking", toNumber(e.target.value, 30))}
            />
          </div>
          <div>
            <Label>Min Advance Booking (hours)</Label>
            <Input
              type="number"
              min={0}
              value={settingsForm.minAdvanceBooking}
              onChange={e => updateSettingValue("minAdvanceBooking", toNumber(e.target.value, 2))}
            />
          </div>
          <div>
            <Label>Cancellation Window (hours)</Label>
            <Input
              type="number"
              min={0}
              value={settingsForm.cancellationWindow}
              onChange={e => updateSettingValue("cancellationWindow", toNumber(e.target.value, 24))}
            />
          </div>
          <div>
            <Label>No-Show Window (minutes)</Label>
            <Input
              type="number"
              min={0}
              value={settingsForm.noShowWindowMinutes}
              onChange={e => updateSettingValue("noShowWindowMinutes", toNumber(e.target.value, 15))}
            />
          </div>
          <div>
            <Label>No-Show Fee</Label>
            <Input
              type="number"
              min={0}
              value={settingsForm.noShowFee}
              onChange={e => updateSettingValue("noShowFee", toNumber(e.target.value, 0))}
            />
          </div>
          <div>
            <Label>Cancellation Fee</Label>
            <Input
              type="number"
              min={0}
              value={settingsForm.cancellationFee}
              onChange={e => updateSettingValue("cancellationFee", toNumber(e.target.value, 0))}
            />
          </div>
          <div className="space-y-4 md:col-span-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Allow Rescheduling</Label>
              <Switch
                checked={settingsForm.allowRescheduling}
                onCheckedChange={checked => updateSettingValue("allowRescheduling", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Allow Cancellation</Label>
              <Switch
                checked={settingsForm.allowCancellation}
                onCheckedChange={checked => updateSettingValue("allowCancellation", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Auto Confirmation</Label>
              <Switch
                checked={settingsForm.autoConfirmation}
                onCheckedChange={checked => updateSettingValue("autoConfirmation", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Allow Walk-In</Label>
              <Switch
                checked={settingsForm.walkInAllowed}
                onCheckedChange={checked => updateSettingValue("walkInAllowed", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Email Notifications</Label>
              <Switch
                checked={settingsForm.emailNotifications}
                onCheckedChange={checked => updateSettingValue("emailNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>SMS Notifications</Label>
              <Switch
                checked={settingsForm.smsNotifications}
                onCheckedChange={checked => updateSettingValue("smsNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Push Notifications</Label>
              <Switch
                checked={settingsForm.pushNotifications}
                onCheckedChange={checked => updateSettingValue("pushNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Appointment Reminders</Label>
              <Switch
                checked={settingsForm.appointmentReminders}
                onCheckedChange={checked => updateSettingValue("appointmentReminders", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Cancellation Alerts</Label>
              <Switch
                checked={settingsForm.cancellationAlerts}
                onCheckedChange={checked => updateSettingValue("cancellationAlerts", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Accepted Payment Methods (comma separated)</Label>
              <Input
                value={settingsForm.paymentMethodsText}
                onChange={e => updateSettingValue("paymentMethodsText", e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Auto Billing</Label>
              <Switch
                checked={settingsForm.autoBilling}
                onCheckedChange={checked => updateSettingValue("autoBilling", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
