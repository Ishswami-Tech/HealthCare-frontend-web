"use client";

import { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
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
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  Activity,
  Calendar, 
  Users,
  UserCheck,
  LogOut,
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

  // Mock profile data
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: user?.firstName || "Maya",
      lastName: user?.lastName || "Patel",
      email: user?.email || "maya.patel@ayurvedacenter.com",
      phone: "+91 9876543210",
      dateOfBirth: "1992-08-22",
      gender: "Female",
      address: "456 Reception Lane, Mumbai, MH 400002",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      zipCode: "400002",
      emergencyContact: "Raj Patel (Spouse)",
      emergencyPhone: "+91 9876543211"
    },
    workInfo: {
      employeeId: "RCP001",
      department: "Reception & Patient Services",
      position: "Senior Receptionist",
      joiningDate: "2022-03-15",
      workSchedule: "Full-time",
      supervisor: "Dr. Priya Sharma (Clinic Admin)",
      workLocation: "Ayurveda Wellness Center",
      experience: "2+ years",
      skills: ["Patient Communication", "Appointment Scheduling", "Insurance Processing", "Multi-language Support"]
    },
    systemAccess: {
      canScheduleAppointments: true,
      canEditPatientInfo: true,
      canProcessPayments: true,
      canAccessReports: false,
      canManageInventory: false,
      systemRole: "Receptionist",
      lastLogin: "2024-01-15T09:30:00Z"
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
    performance: {
      patientsProcessedToday: 24,
      appointmentsScheduled: 18,
      callsHandled: 32,
      averageResponseTime: "2.5 minutes",
      customerSatisfactionRating: 4.7,
      monthlyStats: {
        totalPatients: 642,
        totalAppointments: 428,
        totalCalls: 856
      }
    }
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

  const sidebarLinks = getRoutesByRole(Role.RECEPTIONIST).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('appointments') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('patients') ? <Users className="w-5 h-5" /> :
          route.path.includes('profile') ? <UserCheck className="w-5 h-5" /> :
          <Activity className="w-5 h-5" />
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Receptionist Profile" allowedRole={Role.RECEPTIONIST}>
      <Sidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Receptionist",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png" 
        }}
      >
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
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-green-800 font-semibold text-3xl">
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
                  <div className="flex items-center gap-4 mt-2 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {profileData.workInfo.position}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {profileData.workInfo.experience}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {profileData.performance.customerSatisfactionRating}/5.0
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
                      <div className="text-2xl font-bold text-blue-600">{profileData.performance.patientsProcessedToday}</div>
                      <div className="text-sm text-gray-600">Patients Today</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{profileData.performance.appointmentsScheduled}</div>
                      <div className="text-sm text-gray-600">Appointments</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
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
                          value={new Date(profileData.workInfo.joiningDate).toLocaleDateString()} 
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
                          <Badge className={profileData.systemAccess.canScheduleAppointments ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {profileData.systemAccess.canScheduleAppointments ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Edit Patient Information</span>
                          <Badge className={profileData.systemAccess.canEditPatientInfo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {profileData.systemAccess.canEditPatientInfo ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Process Payments</span>
                          <Badge className={profileData.systemAccess.canProcessPayments ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {profileData.systemAccess.canProcessPayments ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Access Reports</span>
                          <Badge className={profileData.systemAccess.canAccessReports ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {profileData.systemAccess.canAccessReports ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Manage Inventory</span>
                          <Badge className={profileData.systemAccess.canManageInventory ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {profileData.systemAccess.canManageInventory ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <strong>Last Login:</strong> {new Date(profileData.systemAccess.lastLogin).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Today's Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{profileData.performance.patientsProcessedToday}</div>
                        <div className="text-sm text-gray-600">Patients Processed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{profileData.performance.appointmentsScheduled}</div>
                        <div className="text-sm text-gray-600">Appointments Scheduled</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{profileData.performance.callsHandled}</div>
                        <div className="text-sm text-gray-600">Calls Handled</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">{profileData.performance.averageResponseTime}</div>
                        <div className="text-sm text-gray-600">Avg Response Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{profileData.performance.monthlyStats.totalPatients}</div>
                        <div className="text-sm text-gray-600">Total Patients</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{profileData.performance.monthlyStats.totalAppointments}</div>
                        <div className="text-sm text-gray-600">Total Appointments</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{profileData.performance.monthlyStats.totalCalls}</div>
                        <div className="text-sm text-gray-600">Total Calls</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Customer Satisfaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-yellow-600">{profileData.performance.customerSatisfactionRating}</div>
                      <div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 ${i < Math.floor(profileData.performance.customerSatisfactionRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-600">Based on patient feedback</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                          <p className="text-sm text-gray-600">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => updateNotificationSettings('emailNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>SMS Notifications</Label>
                          <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.smsNotifications}
                          onCheckedChange={(checked) => updateNotificationSettings('smsNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Appointment Alerts</Label>
                          <p className="text-sm text-gray-600">Get notified of upcoming appointments</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.appointmentAlerts}
                          onCheckedChange={(checked) => updateNotificationSettings('appointmentAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Patient Updates</Label>
                          <p className="text-sm text-gray-600">Notifications about patient status changes</p>
                        </div>
                        <Switch
                          checked={profileData.notificationSettings.patientUpdates}
                          onCheckedChange={(checked) => updateNotificationSettings('patientUpdates', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>System Updates</Label>
                          <p className="text-sm text-gray-600">System maintenance and update notifications</p>
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
                        <span className="text-gray-600">45 days ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Two-Factor Authentication:</span>
                        <Badge variant="outline" className="bg-red-50 text-red-700">Disabled</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Session Timeout:</span>
                        <span className="text-gray-600">4 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Sessions:</span>
                        <span className="text-gray-600">2 devices</span>
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
      </Sidebar>
    </DashboardLayout>
  );
}

