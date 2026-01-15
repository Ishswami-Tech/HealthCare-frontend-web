"use client";

import { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  Building2,
  Users,
  Settings as SettingsIcon,
  Activity,
  LogOut,
  Save,
  Bell,
  Shield,
  Globe,
  Palette,
} from "lucide-react";

export default function SuperAdminSettings() {
  const { session } = useAuth();
  const user = session?.user;

  // Mock settings state - in real app, fetch with server action
  const [systemSettings, setSystemSettings] = useState({
    siteName: "Ayurveda Healthcare System",
    siteDescription: "Comprehensive Ayurvedic healthcare management platform",
    supportEmail: "support@ayurvedahealth.com",
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: true,
    autoBackup: true,
    maxFileSize: "10",
    sessionTimeout: "30",
    defaultLanguage: "en",
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: false,
    passwordExpiry: "90",
    maxLoginAttempts: "5",
    ipWhitelist: "",
    auditLogging: true,
    dataEncryption: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    appointmentReminders: true,
    systemAlerts: true,
    marketingEmails: false,
    weeklyReports: true,
    emergencyAlerts: true,
  });

  const handleSystemSettingChange = (key: string, value: any) => {
    setSystemSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSecuritySettingChange = (key: string, value: any) => {
    setSecuritySettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleNotificationSettingChange = (key: string, value: any) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
  };

  const sidebarLinks = getRoutesByRole(Role.SUPER_ADMIN).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("clinics") ? (
      <Building2 className="w-5 h-5" />
    ) : route.path.includes("users") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("settings") ? (
      <SettingsIcon className="w-5 h-5" />
    ) : (
      <Activity className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/auth/login",
    path: "/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout title="System Settings" allowedRole={Role.SUPER_ADMIN}>
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Super Admin",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">System Settings</h1>
            <Button className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save All Changes
            </Button>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      General Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="siteName">Site Name</Label>
                        <Input
                          id="siteName"
                          value={systemSettings.siteName}
                          onChange={(e) =>
                            handleSystemSettingChange(
                              "siteName",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supportEmail">Support Email</Label>
                        <Input
                          id="supportEmail"
                          type="email"
                          value={systemSettings.supportEmail}
                          onChange={(e) =>
                            handleSystemSettingChange(
                              "supportEmail",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="siteDescription">Site Description</Label>
                      <Textarea
                        id="siteDescription"
                        value={systemSettings.siteDescription}
                        onChange={(e) =>
                          handleSystemSettingChange(
                            "siteDescription",
                            e.target.value
                          )
                        }
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                        <Input
                          id="maxFileSize"
                          type="number"
                          value={systemSettings.maxFileSize}
                          onChange={(e) =>
                            handleSystemSettingChange(
                              "maxFileSize",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">
                          Session Timeout (minutes)
                        </Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={systemSettings.sessionTimeout}
                          onChange={(e) =>
                            handleSystemSettingChange(
                              "sessionTimeout",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Maintenance Mode</Label>
                          <p className="text-sm text-gray-600">
                            Enable to temporarily disable site access
                          </p>
                        </div>
                        <Switch
                          checked={systemSettings.maintenanceMode}
                          onCheckedChange={(checked) =>
                            handleSystemSettingChange(
                              "maintenanceMode",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>User Registration</Label>
                          <p className="text-sm text-gray-600">
                            Allow new users to register
                          </p>
                        </div>
                        <Switch
                          checked={systemSettings.registrationEnabled}
                          onCheckedChange={(checked) =>
                            handleSystemSettingChange(
                              "registrationEnabled",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto Backup</Label>
                          <p className="text-sm text-gray-600">
                            Automatically backup system data daily
                          </p>
                        </div>
                        <Switch
                          checked={systemSettings.autoBackup}
                          onCheckedChange={(checked) =>
                            handleSystemSettingChange("autoBackup", checked)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passwordExpiry">
                          Password Expiry (days)
                        </Label>
                        <Input
                          id="passwordExpiry"
                          type="number"
                          value={securitySettings.passwordExpiry}
                          onChange={(e) =>
                            handleSecuritySettingChange(
                              "passwordExpiry",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxLoginAttempts">
                          Max Login Attempts
                        </Label>
                        <Input
                          id="maxLoginAttempts"
                          type="number"
                          value={securitySettings.maxLoginAttempts}
                          onChange={(e) =>
                            handleSecuritySettingChange(
                              "maxLoginAttempts",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ipWhitelist">
                        IP Whitelist (comma-separated)
                      </Label>
                      <Textarea
                        id="ipWhitelist"
                        value={securitySettings.ipWhitelist}
                        onChange={(e) =>
                          handleSecuritySettingChange(
                            "ipWhitelist",
                            e.target.value
                          )
                        }
                        placeholder="192.168.1.1, 10.0.0.1"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Two-Factor Authentication Required</Label>
                          <p className="text-sm text-gray-600">
                            Require 2FA for all admin users
                          </p>
                        </div>
                        <Switch
                          checked={securitySettings.twoFactorRequired}
                          onCheckedChange={(checked) =>
                            handleSecuritySettingChange(
                              "twoFactorRequired",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Audit Logging</Label>
                          <p className="text-sm text-gray-600">
                            Log all user actions for security auditing
                          </p>
                        </div>
                        <Switch
                          checked={securitySettings.auditLogging}
                          onCheckedChange={(checked) =>
                            handleSecuritySettingChange("auditLogging", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Data Encryption</Label>
                          <p className="text-sm text-gray-600">
                            Encrypt sensitive data at rest
                          </p>
                        </div>
                        <Switch
                          checked={securitySettings.dataEncryption}
                          onCheckedChange={(checked) =>
                            handleSecuritySettingChange(
                              "dataEncryption",
                              checked
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notification Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Appointment Reminders</Label>
                          <p className="text-sm text-gray-600">
                            Send appointment reminders to patients
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.appointmentReminders}
                          onCheckedChange={(checked) =>
                            handleNotificationSettingChange(
                              "appointmentReminders",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>System Alerts</Label>
                          <p className="text-sm text-gray-600">
                            Receive alerts for system issues
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.systemAlerts}
                          onCheckedChange={(checked) =>
                            handleNotificationSettingChange(
                              "systemAlerts",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Emergency Alerts</Label>
                          <p className="text-sm text-gray-600">
                            Urgent notifications for critical issues
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.emergencyAlerts}
                          onCheckedChange={(checked) =>
                            handleNotificationSettingChange(
                              "emergencyAlerts",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Weekly Reports</Label>
                          <p className="text-sm text-gray-600">
                            Receive weekly system performance reports
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.weeklyReports}
                          onCheckedChange={(checked) =>
                            handleNotificationSettingChange(
                              "weeklyReports",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Marketing Emails</Label>
                          <p className="text-sm text-gray-600">
                            Promotional and marketing communications
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.marketingEmails}
                          onCheckedChange={(checked) =>
                            handleNotificationSettingChange(
                              "marketingEmails",
                              checked
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appearance">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Appearance Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-8">
                      <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Theme Customization
                      </h3>
                      <p className="text-gray-600">
                        Theme and branding options will be available in a future
                        update
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}
