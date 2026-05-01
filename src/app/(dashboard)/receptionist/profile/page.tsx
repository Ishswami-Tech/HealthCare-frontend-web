"use client";

import { useState } from "react";
import { Role } from "@/types/auth.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/auth/useAuth";
import { formatDateInIST, formatDateTimeInIST } from "@/lib/utils/date-time";
import {
  Activity,
  UserCheck,
  Save,
  Camera,
  Clock,
  Award,
  Shield,
  Eye,
  EyeOff,
  Star,
  TrendingUp
} from "lucide-react";

export default function ReceptionistProfile() {
  const { session } = useAuth();
  const user = session?.user;

  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      emergencyContact: "",
      emergencyPhone: ""
    },
    workInfo: {
      employeeId: "",
      department: "",
      position: "",
      joiningDate: "",
      workSchedule: "",
      supervisor: "",
      workLocation: "",
      experience: "",
      skills: [] as string[]
    },
    systemAccess: {
      canScheduleAppointments: false,
      canEditPatientInfo: false,
      canProcessPayments: false,
      canAccessReports: false,
      canManageInventory: false,
      systemRole: user?.role || "Receptionist",
      lastLogin: ""
    },
    preferences: {
      language: "English",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12-hour",
      theme: "Light"
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: true,
      appointmentAlerts: true,
      patientUpdates: true,
      systemUpdates: false,
      reminderNotifications: true
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updatePersonalInfo = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updatePreferences = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const updateNotificationSettings = (field: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, [field]: value }
    }));
  };

  return (
    
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <Button className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>

          {/* Profile Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-green-100 to-blue-100 dark:from-emerald-950/50 dark:to-blue-950/50">
                    <span className="text-3xl font-semibold text-green-800 dark:text-green-200">
                      {profileData.personalInfo.firstName.charAt(0)}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
                  </h2>
                  <div className="mt-2 flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {profileData.workInfo.position}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {profileData.workInfo.experience}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {profileData.workInfo.experience || "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profileData.workInfo.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline">{skill}</Badge>
                    ))}
                    {profileData.workInfo.skills.length > 3 && (
                      <Badge variant="outline">+{profileData.workInfo.skills.length - 3} more</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-1 gap-4 text-center">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{profileData.workInfo.department || "—"}</div>
                      <div className="text-xs text-muted-foreground">Department</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{profileData.workInfo.workLocation || "—"}</div>
                      <div className="text-xs text-muted-foreground">Location</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="work">Work Info</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.personalInfo.firstName}
                        onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.personalInfo.lastName}
                        onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.personalInfo.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.personalInfo.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profileData.personalInfo.dateOfBirth}
                        onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={profileData.personalInfo.gender} 
                        onValueChange={(value) => updatePersonalInfo('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={profileData.personalInfo.zipCode}
                        onChange={(e) => updatePersonalInfo('zipCode', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.personalInfo.address}
                      onChange={(e) => updatePersonalInfo('address', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={profileData.personalInfo.emergencyContact}
                        onChange={(e) => updatePersonalInfo('emergencyContact', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                      <Input
                        id="emergencyPhone"
                        value={profileData.personalInfo.emergencyPhone}
                        onChange={(e) => updatePersonalInfo('emergencyPhone', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="work">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Work Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Employee ID</Label>
                        <Input value={profileData.workInfo.employeeId} disabled />
                      </div>
                      <div>
                        <Label>Position</Label>
                        <Input value={profileData.workInfo.position} disabled />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Department</Label>
                        <Input value={profileData.workInfo.department} disabled />
                      </div>
                      <div>
                        <Label>Work Schedule</Label>
                        <Input value={profileData.workInfo.workSchedule} disabled />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Joining Date</Label>
                        <Input
                          value={profileData.workInfo.joiningDate ? formatDateInIST(profileData.workInfo.joiningDate) : ""}
                          disabled
                        />
                      </div>
                      <div>
                        <Label>Experience</Label>
                        <Input value={profileData.workInfo.experience} disabled />
                      </div>
                    </div>

                    <div>
                      <Label>Supervisor</Label>
                      <Input value={profileData.workInfo.supervisor} disabled />
                    </div>

                    <div>
                      <Label>Work Location</Label>
                      <Input value={profileData.workInfo.workLocation} disabled />
                    </div>

                    <div>
                      <Label>Skills & Competencies</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.workInfo.skills.map((skill, index) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      System Access & Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Schedule Appointments</span>
                          <Badge className={profileData.systemAccess.canScheduleAppointments ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                            {profileData.systemAccess.canScheduleAppointments ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Edit Patient Information</span>
                          <Badge className={profileData.systemAccess.canEditPatientInfo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                            {profileData.systemAccess.canEditPatientInfo ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Process Payments</span>
                          <Badge className={profileData.systemAccess.canProcessPayments ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                            {profileData.systemAccess.canProcessPayments ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Access Reports</span>
                          <Badge className={profileData.systemAccess.canAccessReports ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                            {profileData.systemAccess.canAccessReports ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Manage Inventory</span>
                          <Badge className={profileData.systemAccess.canManageInventory ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                            {profileData.systemAccess.canManageInventory ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        <strong>Last Login:</strong> {profileData.systemAccess.lastLogin ? formatDateTimeInIST(profileData.systemAccess.lastLogin) : "—"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Performance analytics not yet available</p>
                    <p className="text-sm mt-1">Stats will appear here once the analytics backend is configured.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={profileData.preferences.language} 
                        onValueChange={(value) => updatePreferences('language', value)}
                      >
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
                      <Select 
                        value={profileData.preferences.timezone} 
                        onValueChange={(value) => updatePreferences('timezone', value)}
                      >
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select 
                        value={profileData.preferences.dateFormat} 
                        onValueChange={(value) => updatePreferences('dateFormat', value)}
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
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select 
                        value={profileData.preferences.timeFormat} 
                        onValueChange={(value) => updatePreferences('timeFormat', value)}
                      >
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

                  <div className="space-y-4">
                    <h4 className="font-semibold">Notification Preferences</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => updateNotificationSettings('emailNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.smsNotifications}
                          onCheckedChange={(checked) => updateNotificationSettings('smsNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Appointment Alerts</Label>
                          <p className="text-sm text-muted-foreground">Get notified of upcoming appointments</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.appointmentAlerts}
                          onCheckedChange={(checked) => updateNotificationSettings('appointmentAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Patient Updates</Label>
                          <p className="text-sm text-muted-foreground">Notifications about patient status changes</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.patientUpdates}
                          onCheckedChange={(checked) => updateNotificationSettings('patientUpdates', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>System Updates</Label>
                          <p className="text-sm text-muted-foreground">System maintenance and update notifications</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.systemUpdates}
                          onCheckedChange={(checked) => updateNotificationSettings('systemUpdates', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <Button className="w-full">Update Password</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Last Password Change:</span>
                        <span className="text-muted-foreground">45 days ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Two-Factor Authentication:</span>
                        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">Disabled</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Session Timeout:</span>
                        <span className="text-muted-foreground">4 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Sessions:</span>
                        <span className="text-muted-foreground">2 devices</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" className="w-full">
                        Enable Two-Factor Authentication
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    
  );
}
