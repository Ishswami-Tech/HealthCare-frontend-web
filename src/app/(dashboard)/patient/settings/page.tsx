"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/auth/useAuth";
import { PasswordChangeModal } from "@/components/patient/PatientModals";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getActiveSessions, revokeSession } from "@/lib/actions/session.server";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Smartphone,
  Mail,
  MessageSquare,
  Lock,
  Trash2,
  LogOut,
  Globe,
  Moon,
  Sun,
  Monitor,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Key,
  Fingerprint,
  Clock,
} from "lucide-react";
import { logout } from "@/lib/actions/auth.server";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/config/routes";
import { PatientPageShell, PatientPageHeader } from "@/components/patient/PatientPageShell";

export default function PatientSettings() {
  const { session } = useAuth();
  const user = session?.user;
  const router = useRouter();

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAppointments: true,
    emailReminders: true,
    emailMarketing: false,
    smsAppointments: true,
    smsReminders: false,
    pushAppointments: true,
    pushReminders: true,
    pushUpdates: false,
    appointmentReminderTime: "1h",
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    shareDataWithDoctors: true,
    allowAnalytics: false,
    twoFactorEnabled: false,
    sessionTimeout: "30",
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: "system",
    language: "en",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    fontSize: "medium",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Session management
  interface ActiveSession {
    id: string;
    deviceInfo: string;
    ipAddress: string;
    lastActivity: string;
    createdAt: string;
    isCurrent: boolean;
  }
  const [showSessions, setShowSessions] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleViewSessions = () => {
    setShowSessions(true);
    setSessionsLoading(true);
    startTransition(async () => {
      try {
        const sessions = await getActiveSessions();
        setActiveSessions(sessions);
      } catch {
        toast.error("Failed to load active sessions");
      } finally {
        setSessionsLoading(false);
      }
    });
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session revoked successfully");
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    toast.success("Notification preferences saved");
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    toast.success("Privacy settings saved");
  };

  const handleSaveAppearance = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    toast.success("Appearance settings saved");
  };

  const handleLogout = async () => {
    await logout();
    router.replace(ROUTES.LOGIN);
  };

  const handleExportData = async () => {
    toast.success("Your data export has been initiated. You will receive an email shortly.");
  };

  const NotificationRow = ({
    icon,
    label,
    description,
    value,
    onChange,
  }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg text-muted-foreground">{icon}</div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );

  return (
    <PatientPageShell>
        <PatientPageHeader
          eyebrow="ACCOUNT SETTINGS"
          title="Settings"
          description="Manage your account preferences, notifications, and privacy settings."
        />

        {/* Account Summary Card */}
        <Card className="border-primary/20 bg-linear-to-r from-primary/5 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "P"}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">Patient</Badge>
                  <Badge variant="outline" className="text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
              <PasswordChangeModal
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <Key className="w-4 h-4" />
                    Change Password
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="w-4 h-4" /> <span className="hidden sm:inline">Notifications</span><span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5">
              <Shield className="w-4 h-4" /> <span className="hidden sm:inline">Privacy & Security</span><span className="sm:hidden">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5">
              <Palette className="w-4 h-4" /> <span className="hidden sm:inline">Appearance</span><span className="sm:hidden">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-1.5 text-destructive">
              <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Danger Zone</span><span className="sm:hidden">Danger</span>
            </TabsTrigger>
          </TabsList>

          {/* ── NOTIFICATIONS ── */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Control which emails we send you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Appointment Confirmations"
                  description="Get emailed when an appointment is booked or cancelled"
                  value={notifications.emailAppointments}
                  onChange={(v) => setNotifications((p) => ({ ...p, emailAppointments: v }))}
                />
                <NotificationRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Appointment Reminders"
                  description="Receive reminders before your scheduled appointments"
                  value={notifications.emailReminders}
                  onChange={(v) => setNotifications((p) => ({ ...p, emailReminders: v }))}
                />
                <NotificationRow
                  icon={<Bell className="w-4 h-4" />}
                  label="Health Tips & Offers"
                  description="Receive wellness tips and clinic promotions"
                  value={notifications.emailMarketing}
                  onChange={(v) => setNotifications((p) => ({ ...p, emailMarketing: v }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-green-500" />
                  SMS Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationRow
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Appointment SMS"
                  description="Receive SMS for appointment changes"
                  value={notifications.smsAppointments}
                  onChange={(v) => setNotifications((p) => ({ ...p, smsAppointments: v }))}
                />
                <NotificationRow
                  icon={<Clock className="w-4 h-4" />}
                  label="SMS Reminders"
                  description="Get a reminder SMS before appointments"
                  value={notifications.smsReminders}
                  onChange={(v) => setNotifications((p) => ({ ...p, smsReminders: v }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-500" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationRow
                  icon={<Bell className="w-4 h-4" />}
                  label="Appointment Push"
                  description="Real-time push for appointment changes"
                  value={notifications.pushAppointments}
                  onChange={(v) => setNotifications((p) => ({ ...p, pushAppointments: v }))}
                />
                <NotificationRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Push Reminders"
                  description="Push notification reminders"
                  value={notifications.pushReminders}
                  onChange={(v) => setNotifications((p) => ({ ...p, pushReminders: v }))}
                />
                <div className="pt-2">
                  <Label className="mb-2 block">Reminder Time Before Appointment</Label>
                  <Select
                    value={notifications.appointmentReminderTime}
                    onValueChange={(v) =>
                      setNotifications((p) => ({ ...p, appointmentReminderTime: v }))
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">15 minutes before</SelectItem>
                      <SelectItem value="30m">30 minutes before</SelectItem>
                      <SelectItem value="1h">1 hour before</SelectItem>
                      <SelectItem value="2h">2 hours before</SelectItem>
                      <SelectItem value="1d">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveNotifications} disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Notification Preferences"}
            </Button>
          </TabsContent>

          {/* ── PRIVACY & SECURITY ── */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <NotificationRow
                  icon={<Eye className="w-4 h-4" />}
                  label="Public Profile"
                  description="Allow doctors to view your profile information"
                  value={privacy.profileVisible}
                  onChange={(v) => setPrivacy((p) => ({ ...p, profileVisible: v }))}
                />
                <NotificationRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Share Data with Doctors"
                  description="Allow your treating physicians to access your medical data"
                  value={privacy.shareDataWithDoctors}
                  onChange={(v) => setPrivacy((p) => ({ ...p, shareDataWithDoctors: v }))}
                />
                <NotificationRow
                  icon={<Monitor className="w-4 h-4" />}
                  label="Allow Analytics"
                  description="Help us improve by sharing anonymous usage data"
                  value={privacy.allowAnalytics}
                  onChange={(v) => setPrivacy((p) => ({ ...p, allowAnalytics: v }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationRow
                  icon={<Fingerprint className="w-4 h-4" />}
                  label="Two-Factor Authentication"
                  description="Add an extra layer of security to your account"
                  value={privacy.twoFactorEnabled}
                  onChange={(v) => setPrivacy((p) => ({ ...p, twoFactorEnabled: v }))}
                />

                <div>
                  <Label className="mb-2 block">Session Timeout</Label>
                  <Select
                    value={privacy.sessionTimeout}
                    onValueChange={(v) => setPrivacy((p) => ({ ...p, sessionTimeout: v }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically log out after inactivity
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Connected Devices</p>
                      <p className="text-xs text-muted-foreground">
                        Manage where you're logged in
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewSessions}
                    >
                      View Sessions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSavePrivacy} disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Privacy Settings"}
            </Button>
          </TabsContent>

          {/* ── APPEARANCE ── */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-500" />
                  Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", icon: <Sun className="w-5 h-5" />, label: "Light" },
                    { value: "dark", icon: <Moon className="w-5 h-5" />, label: "Dark" },
                    { value: "system", icon: <Monitor className="w-5 h-5" />, label: "System" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setAppearance((p) => ({ ...p, theme: t.value }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        appearance.theme === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div
                        className={
                          appearance.theme === t.value ? "text-primary" : "text-muted-foreground"
                        }
                      >
                        {t.icon}
                      </div>
                      <span className="text-sm font-medium">{t.label}</span>
                      {appearance.theme === t.value && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  Regional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Language</Label>
                    <Select
                      value={appearance.language}
                      onValueChange={(v) => setAppearance((p) => ({ ...p, language: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="mr">Marathi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">Timezone</Label>
                    <Select
                      value={appearance.timezone}
                      onValueChange={(v) => setAppearance((p) => ({ ...p, timezone: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">India (IST +5:30)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">Date Format</Label>
                    <Select
                      value={appearance.dateFormat}
                      onValueChange={(v) => setAppearance((p) => ({ ...p, dateFormat: v }))}
                    >
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
                    <Label className="mb-2 block">Font Size</Label>
                    <Select
                      value={appearance.fontSize}
                      onValueChange={(v) => setAppearance((p) => ({ ...p, fontSize: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium (Default)</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveAppearance} disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Appearance Settings"}
            </Button>
          </TabsContent>

          {/* ── DANGER ZONE ── */}
          <TabsContent value="danger" className="space-y-4">
            {/* Export Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-500" />
                  Export Your Data
                </CardTitle>
                <CardDescription>
                  Download a copy of all your health data stored with us
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Includes appointments, medical records, and profile data (JSON / PDF)
                </p>
                <Button variant="outline" onClick={handleExportData} className="gap-2 shrink-0">
                  <Download className="w-4 h-4" />
                  Request Export
                </Button>
              </CardContent>
            </Card>

            {/* Sign out all devices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-orange-500" />
                  Sign Out Everywhere
                </CardTitle>
                <CardDescription>
                  Log out from all devices and active sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  This will invalidate all access tokens except your current session.
                </p>
                <Button
                  variant="outline"
                  className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 shrink-0"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out All
                </Button>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will permanently erase all your appointments, medical records, and personal data. There is no way to recover this information.
                  </AlertDescription>
                </Alert>

                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <p className="text-sm font-medium">
                      Type <strong>DELETE</strong> to confirm:
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE here"
                      className="border-destructive/50"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        disabled={deleteConfirmText !== "DELETE"}
                        onClick={() => toast.error("Account deletion requires backend support. Please contact support.")}
                        className="flex-1"
                      >
                        Permanently Delete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Active Sessions Dialog */}
        <Dialog open={showSessions} onOpenChange={setShowSessions}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                Active Sessions
              </DialogTitle>
              <DialogDescription>
                These devices are currently logged into your account. Revoke any session you don&apos;t recognize.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2 max-h-[400px] overflow-y-auto pr-1">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Clock className="w-5 h-5 animate-spin mr-2" />
                  Loading sessions…
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active sessions found</p>
                </div>
              ) : (
                activeSessions.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-start justify-between p-3 rounded-lg border ${
                      s.isCurrent ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-md ${s.isCurrent ? "bg-blue-100" : "bg-slate-200"}`}>
                        <Smartphone className={`w-4 h-4 ${s.isCurrent ? "text-blue-600" : "text-slate-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          {s.deviceInfo || "Unknown device"}
                          {s.isCurrent && (
                            <Badge className="text-xs bg-blue-600 text-white border-none py-0">Current</Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.ipAddress}</p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {new Date(s.lastActivity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!s.isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0 h-7 text-xs"
                        disabled={revokingId === s.id}
                        onClick={() => handleRevokeSession(s.id)}
                      >
                        {revokingId === s.id ? "Revoking…" : "Revoke"}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </PatientPageShell>
  );
}
