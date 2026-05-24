"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Activity } from "lucide-react";
import type { ReceptionistProfileFormState } from "./receptionist-profile.types";

interface ReceptionistProfilePreferencesTabProps {
  profileData: ReceptionistProfileFormState;
  updatePreferences: (field: string, value: string) => void;
  updateNotificationSettings: (field: string, value: boolean) => void;
}

export function ReceptionistProfilePreferencesTab({
  profileData,
  updatePreferences,
  updateNotificationSettings,
}: ReceptionistProfilePreferencesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5" />
          System Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="language">Language</Label>
            <Select value={profileData.preferences.language} onValueChange={(value) => updatePreferences("language", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Marathi">Marathi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={profileData.preferences.timezone} onValueChange={(value) => updatePreferences("timezone", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select value={profileData.preferences.dateFormat} onValueChange={(value) => updatePreferences("dateFormat", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select value={profileData.preferences.timeFormat} onValueChange={(value) => updatePreferences("timeFormat", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12-hour">12-hour</SelectItem>
                <SelectItem value="24-hour">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select value={profileData.preferences.theme} onValueChange={(value) => updatePreferences("theme", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Light">Light</SelectItem>
                <SelectItem value="Dark">Dark</SelectItem>
                <SelectItem value="System">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="gap-y-4">
          <h4 className="font-semibold">Notification Preferences</h4>
          <div className="gap-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={profileData.notificationSettings.emailNotifications}
                onCheckedChange={(checked) => updateNotificationSettings("emailNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
              </div>
              <Switch
                checked={profileData.notificationSettings.smsNotifications}
                onCheckedChange={(checked) => updateNotificationSettings("smsNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Appointment Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified of upcoming appointments</p>
              </div>
              <Switch
                checked={profileData.notificationSettings.appointmentAlerts}
                onCheckedChange={(checked) => updateNotificationSettings("appointmentAlerts", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Patient Updates</Label>
                <p className="text-sm text-muted-foreground">Notifications about patient status changes</p>
              </div>
              <Switch
                checked={profileData.notificationSettings.patientUpdates}
                onCheckedChange={(checked) => updateNotificationSettings("patientUpdates", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>System Updates</Label>
                <p className="text-sm text-muted-foreground">System maintenance and update notifications</p>
              </div>
              <Switch
                checked={profileData.notificationSettings.systemUpdates}
                onCheckedChange={(checked) => updateNotificationSettings("systemUpdates", checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
