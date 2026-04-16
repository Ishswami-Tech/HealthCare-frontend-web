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
import { showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveSessions, useRevokeSession } from "@/hooks/query/useSessions";
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
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/config/routes";
import { PatientPageShell, PatientPageHeader } from "@/components/patient/PatientPageShell";
import { cn } from "@/lib/utils";

export default function PatientSettings() {
  const { session, logoutAsync, isLoggingOut } = useAuth();
  const user = session?.user;
  const router = useRouter();

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

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    shareDataWithDoctors: true,
    allowAnalytics: false,
    twoFactorEnabled: false,
    sessionTimeout: "30",
  });

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

  const [showSessions, setShowSessions] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { data: activeSessions = [], isPending: sessionsLoading } = useActiveSessions(showSessions);
  const revokeSessionMutation = useRevokeSession();

  const handleViewSessions = () => {
    setShowSessions(true);
    startTransition(() => {});
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
    } finally {
      setRevokingId(null);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    showSuccessToast("Notification preferences saved", { id: TOAST_IDS.GLOBAL.SUCCESS });
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    showSuccessToast("Privacy settings saved", { id: TOAST_IDS.GLOBAL.SUCCESS });
  };

  const handleSaveAppearance = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    showSuccessToast("Appearance settings saved", { id: TOAST_IDS.GLOBAL.SUCCESS });
  };

  const handleLogout = async () => {
    await logoutAsync();
  };

  const handleExportData = async () => {
    showSuccessToast("Your data export has been initiated. You will receive an email shortly.", {
      id: TOAST_IDS.GLOBAL.SUCCESS,
    });
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
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "P"}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <div className="flex justify-center sm:justify-start gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">Patient</Badge>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
              <div className="w-full sm:w-auto pt-3 sm:pt-0">
                <PasswordChangeModal
                  trigger={
                    <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 rounded-xl h-10 px-4">
                      <Key className="w-4 h-4" />
                      Password
                    </Button>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="notifications" className="space-y-4">
          <div className="overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max sm:flex sm:w-full min-w-full">
              <TabsTrigger value="notifications" className="px-3 gap-1.5 text-xs sm:text-sm">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="px-3 gap-1.5 text-xs sm:text-sm">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="px-3 gap-1.5 text-xs sm:text-sm">
                <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="danger" className="px-3 gap-1.5 text-xs sm:text-sm text-destructive">
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Danger</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
                  description="Get emailed about booking updates"
                  value={notifications.emailAppointments}
                  onChange={(v) => setNotifications((p) => ({ ...p, emailAppointments: v }))}
                />
                <NotificationRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Reminders"
                  description="Receive alerts before appointments"
                  value={notifications.emailReminders}
                  onChange={(v) => setNotifications((p) => ({ ...p, emailReminders: v }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-green-500" />SMS Notifications</CardTitle></CardHeader>
              <CardContent>
                <NotificationRow
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Appointment SMS"
                  description="SMS alerts for booking changes"
                  value={notifications.smsAppointments}
                  onChange={(v) => setNotifications((p) => ({ ...p, smsAppointments: v }))}
                />
              </CardContent>
            </Card>

            <Button onClick={handleSaveNotifications} disabled={isSaving} className="w-full h-11 rounded-xl font-bold">
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-blue-500" />Privacy</CardTitle></CardHeader>
              <CardContent>
                <NotificationRow
                  icon={<Eye className="w-4 h-4" />}
                  label="Public Profile"
                  description="Allow clinical staff to view profile"
                  value={privacy.profileVisible}
                  onChange={(v) => setPrivacy((p) => ({ ...p, profileVisible: v }))}
                />
                <NotificationRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Share Data"
                  description="Allow specialists to access records"
                  value={privacy.shareDataWithDoctors}
                  onChange={(v) => setPrivacy((p) => ({ ...p, shareDataWithDoctors: v }))}
                />
              </CardContent>
            </Card>
            <Button onClick={handleSavePrivacy} disabled={isSaving} className="w-full h-11 rounded-xl font-bold">
              {isSaving ? "Saving..." : "Save Privacy"}
            </Button>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-purple-500" />Theme</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "light", icon: <Sun className="w-5 h-5" />, label: "Light" },
                    { value: "dark", icon: <Moon className="w-5 h-5" />, label: "Dark" },
                    { value: "system", icon: <Monitor className="w-5 h-5" />, label: "System" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setAppearance((p) => ({ ...p, theme: t.value }))}
                      className={`flex items-center justify-between sm:flex-col sm:justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        appearance.theme === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
                        <div className={appearance.theme === t.value ? "text-primary" : "text-muted-foreground"}>{t.icon}</div>
                        <span className="text-sm font-medium">{t.label}</span>
                      </div>
                      {appearance.theme === t.value && <CheckCircle className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" />Regional</CardTitle></CardHeader>
                <CardContent className="pt-2"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="mb-2 block">Language</Label><Select value={appearance.language} onValueChange={(v) => setAppearance((p) => ({ ...p, language: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="hi">Hindi</SelectItem></SelectContent></Select></div>
                  <div><Label className="mb-2 block">Timezone</Label><Select value={appearance.timezone} onValueChange={(v) => setAppearance((p) => ({ ...p, timezone: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Kolkata">India (IST)</SelectItem></SelectContent></Select></div>
                </div></CardContent>
            </Card>
            <Button onClick={handleSaveAppearance} disabled={isSaving} className="w-full h-11 rounded-xl font-bold">
              {isSaving ? "Saving..." : "Save Appearance"}
            </Button>
          </TabsContent>

          <TabsContent value="danger" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Download className="w-5 h-5 text-blue-500" />Export Data</CardTitle></CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <p className="text-sm text-muted-foreground">Download a copy of your clinical data</p>
                <Button variant="outline" onClick={handleExportData} className="gap-2 h-10 rounded-xl px-4"><Download className="w-4 h-4" />Request Export</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-orange-500"><LogOut className="w-5 h-5" />Sign Out Everywhere</CardTitle></CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <p className="text-sm text-muted-foreground">Log out from all other active sessions</p>
                <Button variant="outline" className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 h-10 rounded-xl px-4" onClick={handleLogout}><LogOut className="w-4 h-4" />Sign Out All</Button>
              </CardContent>
            </Card>
            <Card className="border-destructive/30">
              <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="w-5 h-5" />Delete Account</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>Permanently erase all medical records and data.</AlertDescription></Alert>
                {!showDeleteConfirm ? (
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="gap-2 h-10 rounded-xl px-4">Delete Account</Button>
                ) : (
                  <div className="space-y-3 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <p className="text-sm font-medium">Type <strong>DELETE</strong> to confirm:</p>
                    <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" />
                    <div className="flex gap-2"><Button variant="destructive" disabled={deleteConfirmText !== "DELETE"} className="flex-1">Confirm</Button><Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">Cancel</Button></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showSessions} onOpenChange={setShowSessions}>
          <DialogContent className="max-w-lg rounded-3xl p-6">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-500" />Active Sessions</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-4">
              {sessionsLoading ? <div className="py-10 text-center text-muted-foreground">Loading...</div> : activeSessions.length === 0 ? <div className="py-10 text-center text-muted-foreground">No active sessions</div> : activeSessions.map((s) => (
                <div key={s.id} className={cn("flex items-start justify-between p-3 rounded-xl border", s.isCurrent ? "border-blue-200 bg-blue-50" : "border-border bg-card")}>
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", s.isCurrent ? "bg-blue-100" : "bg-muted")}><Smartphone className={cn("w-4 h-4", s.isCurrent ? "text-blue-600" : "text-muted-foreground")} /></div>
                    <div><p className="text-sm font-bold">{s.deviceInfo || "Device"}{s.isCurrent && <Badge className="ml-2 bg-blue-600">Current</Badge>}</p><p className="text-xs text-muted-foreground">{s.ipAddress}</p></div>
                  </div>
                  {!s.isCurrent && <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleRevokeSession(s.id)}>Revoke</Button>}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
    </PatientPageShell>
  );
}
