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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  Activity,
  Users, 
  Calendar, 
  Settings as SettingsIcon,
  LogOut,
  Save,
  Building2,
  Clock,
  Bell,
  CreditCard
} from "lucide-react";

export default function ClinicAdminSettings() {
  const { session } = useAuth();
  const user = session?.user;

  // Mock clinic settings
  const [clinicInfo, setClinicInfo] = useState({
    name: "Ayurveda Wellness Center",
    address: "123 Health Street, Mumbai, MH 400001",
    phone: "+91 9876543210",
    email: "info@ayurvedacenter.com",
    website: "www.ayurvedacenter.com",
    description: "Authentic Ayurvedic treatments and consultations with experienced practitioners.",
    operatingHours: {
      monday: { open: "09:00", close: "18:00", isOpen: true },
      tuesday: { open: "09:00", close: "18:00", isOpen: true },
      wednesday: { open: "09:00", close: "18:00", isOpen: true },
      thursday: { open: "09:00", close: "18:00", isOpen: true },
      friday: { open: "09:00", close: "18:00", isOpen: true },
      saturday: { open: "09:00", close: "15:00", isOpen: true },
      sunday: { open: "10:00", close: "14:00", isOpen: false }
    }
  });

  const [appointmentSettings, setAppointmentSettings] = useState({
    defaultSlotDuration: "30",
    advanceBookingDays: "30",
    cancellationHours: "24",
    autoConfirmation: true,
    walkInAllowed: true,
    onlineBooking: true,
    reminderEnabled: true,
    reminderHoursBefore: "24"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    cancellationAlerts: true,
    dailyReports: false,
    weeklyReports: true
  });

  const [paymentSettings, setPaymentSettings] = useState({
    onlinePayments: true,
    partialPayments: false,
    cancellationFee: "100",
    noShowFee: "200",
    acceptedMethods: ["Cash", "Card", "UPI"]
  });

  const updateClinicInfo = (field: string, value: any) => {
    setClinicInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateOperatingHours = (day: string, field: string, value: any) => {
    setClinicInfo(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [field]: value
        }
      }
    }));
  };

  const updateAppointmentSettings = (field: string, value: any) => {
    setAppointmentSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateNotificationSettings = (field: string, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const updatePaymentSettings = (field: string, value: any) => {
    setPaymentSettings(prev => ({ ...prev, [field]: value }));
  };

  const sidebarLinks = getRoutesByRole(Role.CLINIC_ADMIN).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('staff') ? <Users className="w-5 h-5" /> :
          route.path.includes('schedule') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('settings') ? <SettingsIcon className="w-5 h-5" /> :
          <Activity className="w-5 h-5" />
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Clinic Settings" allowedRole={Role.CLINIC_ADMIN}>
      <Sidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Clinic Admin",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png" 
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Clinic Settings</h1>
            <Button className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save All Changes
            </Button>
          </div>

          <Tabs defaultValue="clinic-info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="clinic-info" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Clinic Info
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clinic-info">
              <div className="grid gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clinicName">Clinic Name</Label>
                        <Input
                          id="clinicName"
                          value={clinicInfo.name}
                          onChange={(e) => updateClinicInfo('name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={clinicInfo.phone}
                          onChange={(e) => updateClinicInfo('phone', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={clinicInfo.email}
                          onChange={(e) => updateClinicInfo('email', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={clinicInfo.website}
                          onChange={(e) => updateClinicInfo('website', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={clinicInfo.address}
                        onChange={(e) => updateClinicInfo('address', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={clinicInfo.description}
                        onChange={(e) => updateClinicInfo('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Operating Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Operating Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(clinicInfo.operatingHours).map(([day, hours]) => (
                        <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="font-medium capitalize">{day}</div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={hours.isOpen}
                              onCheckedChange={(checked) => updateOperatingHours(day, 'isOpen', checked)}
                            />
                            <Label className="text-sm">Open</Label>
                          </div>
                          {hours.isOpen && (
                            <>
                              <div>
                                <Label className="text-xs text-gray-600">Opening Time</Label>
                                <Input
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Closing Time</Label>
                                <Input
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </>
                          )}
                          {!hours.isOpen && (
                            <div className="col-span-2 text-gray-500 text-sm">Closed</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appointments">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Appointment Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="slotDuration">Default Slot Duration</Label>
                        <Select 
                          value={appointmentSettings.defaultSlotDuration} 
                          onValueChange={(value) => updateAppointmentSettings('defaultSlotDuration', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="advanceBooking">Advance Booking (Days)</Label>
                        <Input
                          id="advanceBooking"
                          type="number"
                          value={appointmentSettings.advanceBookingDays}
                          onChange={(e) => updateAppointmentSettings('advanceBookingDays', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="cancellationHours">Cancellation Notice (Hours)</Label>
                        <Input
                          id="cancellationHours"
                          type="number"
                          value={appointmentSettings.cancellationHours}
                          onChange={(e) => updateAppointmentSettings('cancellationHours', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="reminderHours">Reminder Hours Before</Label>
                        <Input
                          id="reminderHours"
                          type="number"
                          value={appointmentSettings.reminderHoursBefore}
                          onChange={(e) => updateAppointmentSettings('reminderHoursBefore', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto Confirmation</Label>
                          <p className="text-sm text-gray-600">Automatically confirm appointments</p>
                        </div>
                        <Switch
                          checked={appointmentSettings.autoConfirmation}
                          onCheckedChange={(checked) => updateAppointmentSettings('autoConfirmation', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Walk-in Appointments</Label>
                          <p className="text-sm text-gray-600">Allow walk-in patients</p>
                        </div>
                        <Switch
                          checked={appointmentSettings.walkInAllowed}
                          onCheckedChange={(checked) => updateAppointmentSettings('walkInAllowed', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Online Booking</Label>
                          <p className="text-sm text-gray-600">Enable patient self-booking</p>
                        </div>
                        <Switch
                          checked={appointmentSettings.onlineBooking}
                          onCheckedChange={(checked) => updateAppointmentSettings('onlineBooking', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Appointment Reminders</Label>
                          <p className="text-sm text-gray-600">Send automatic reminders</p>
                        </div>
                        <Switch
                          checked={appointmentSettings.reminderEnabled}
                          onCheckedChange={(checked) => updateAppointmentSettings('reminderEnabled', checked)}
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
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-gray-600">Send notifications via email</p>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => updateNotificationSettings('emailNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>SMS Notifications</Label>
                          <p className="text-sm text-gray-600">Send notifications via SMS</p>
                        </div>
                        <Switch
                          checked={notificationSettings.smsNotifications}
                          onCheckedChange={(checked) => updateNotificationSettings('smsNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Appointment Reminders</Label>
                          <p className="text-sm text-gray-600">Remind patients before appointments</p>
                        </div>
                        <Switch
                          checked={notificationSettings.appointmentReminders}
                          onCheckedChange={(checked) => updateNotificationSettings('appointmentReminders', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Cancellation Alerts</Label>
                          <p className="text-sm text-gray-600">Alert staff about cancellations</p>
                        </div>
                        <Switch
                          checked={notificationSettings.cancellationAlerts}
                          onCheckedChange={(checked) => updateNotificationSettings('cancellationAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Daily Reports</Label>
                          <p className="text-sm text-gray-600">Daily summary reports</p>
                        </div>
                        <Switch
                          checked={notificationSettings.dailyReports}
                          onCheckedChange={(checked) => updateNotificationSettings('dailyReports', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Weekly Reports</Label>
                          <p className="text-sm text-gray-600">Weekly performance reports</p>
                        </div>
                        <Switch
                          checked={notificationSettings.weeklyReports}
                          onCheckedChange={(checked) => updateNotificationSettings('weeklyReports', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cancellationFee">Cancellation Fee (₹)</Label>
                        <Input
                          id="cancellationFee"
                          type="number"
                          value={paymentSettings.cancellationFee}
                          onChange={(e) => updatePaymentSettings('cancellationFee', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="noShowFee">No-Show Fee (₹)</Label>
                        <Input
                          id="noShowFee"
                          type="number"
                          value={paymentSettings.noShowFee}
                          onChange={(e) => updatePaymentSettings('noShowFee', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Online Payments</Label>
                          <p className="text-sm text-gray-600">Accept payments online</p>
                        </div>
                        <Switch
                          checked={paymentSettings.onlinePayments}
                          onCheckedChange={(checked) => updatePaymentSettings('onlinePayments', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Partial Payments</Label>
                          <p className="text-sm text-gray-600">Allow partial advance payments</p>
                        </div>
                        <Switch
                          checked={paymentSettings.partialPayments}
                          onCheckedChange={(checked) => updatePaymentSettings('partialPayments', checked)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Accepted Payment Methods</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {['Cash', 'Card', 'UPI', 'Net Banking', 'Wallet', 'Cheque'].map((method) => (
                          <div key={method} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={method}
                              checked={paymentSettings.acceptedMethods.includes(method)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updatePaymentSettings('acceptedMethods', [...paymentSettings.acceptedMethods, method]);
                                } else {
                                  updatePaymentSettings('acceptedMethods', paymentSettings.acceptedMethods.filter(m => m !== method));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={method} className="text-sm font-medium">
                              {method}
                            </label>
                          </div>
                        ))}
                      </div>
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

