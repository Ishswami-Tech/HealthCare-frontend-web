"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { theme } from "@/lib/theme-utils";
import { 
  Activity,
  Calendar, 
  FileText,
  Pill,
  User,
  LogOut,
  Save,
  MapPin,
  Camera,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Heart,
  Leaf,
  Sun,
  Moon,
  Waves,
  AlertTriangle,
  Info,
  Download,
  Upload
} from "lucide-react";

export default function PatientProfile() {
  const { session } = useAuth();
  const user = session?.user;

  // Mock profile data
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: user?.firstName || "Rajesh",
      lastName: user?.lastName || "Kumar",
      email: user?.email || "rajesh.kumar@email.com",
      phone: "+91 9876543210",
      dateOfBirth: "1978-03-15",
      gender: "Male",
      address: "123 Wellness Street, Mumbai, MH 400001",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      zipCode: "400001",
      emergencyContact: "Priya Kumar (Wife)",
      emergencyPhone: "+91 9876543211",
      occupation: "Software Engineer",
      maritalStatus: "Married"
    },
    ayurvedaProfile: {
      primaryDosha: "Vata-Pitta",
      constitution: "Vata-Pitta Prakriti",
      currentImbalances: ["Elevated Vata", "Mild Pitta excess"],
      bodyType: "Mesomorphic-Ectomorphic",
      mentalConstitution: "Rajasic-Sattvic",
      digestiveFire: "Variable (Vishama Agni)",
      preferredTreatments: ["Panchakarma", "Shirodhara", "Abhyanga"],
      seasonalTendencies: ["Vata aggravation in winter", "Pitta issues in summer"]
    },
    medicalHistory: {
      chronicConditions: ["Hypertension (controlled)", "Chronic stress"],
      allergies: ["Tree nuts", "Shellfish"],
      currentMedications: [
        "Triphala Churna - 1 tsp twice daily",
        "Ashwagandha Capsules - 2 at bedtime"
      ],
      familyHistory: ["Diabetes (father)", "Hypertension (mother)"],
      surgeries: ["Appendectomy (2015)"],
      lastCheckup: "2024-01-15"
    },
    lifestyle: {
      dietPreferences: "Vegetarian",
      exerciseRoutine: "Yoga 4x/week, Walking daily",
      sleepPattern: "10 PM - 6 AM (8 hours)",
      stressLevel: "Moderate",
      smokingStatus: "Never",
      alcoholConsumption: "Occasional",
      waterIntake: "3-4 liters/day",
      meditationPractice: "Daily pranayama and meditation"
    },
    preferences: {
      language: "English",
      preferredDoctor: "Dr. Priya Sharma",
      communicationMethod: "Phone",
      appointmentReminders: true,
      medicationReminders: true,
      treatmentUpdates: true,
      healthTips: true
    },
    vitals: {
      height: "175 cm",
      weight: "70 kg",
      bmi: "22.9",
      bloodGroup: "O+",
      bloodPressure: "128/82",
      heartRate: "72 bpm",
      lastUpdated: "2024-01-15"
    },
    documents: [
      { name: "Recent Blood Test", type: "Lab Report", date: "2024-01-10", size: "2.4 MB" },
      { name: "X-Ray Chest", type: "Medical Image", date: "2024-01-05", size: "1.8 MB" },
      { name: "Prescription - Jan 2024", type: "Prescription", date: "2024-01-15", size: "0.5 MB" }
    ]
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

  const updatePreferences = (field: string, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const getDoshaIcon = (dosha: string) => {
    if (dosha.includes('Vata')) return <Waves className={`w-4 h-4 ${theme.iconColors.blue}`} />;
    if (dosha.includes('Pitta')) return <Sun className={`w-4 h-4 ${theme.iconColors.orange}`} />;
    if (dosha.includes('Kapha')) return <Moon className={`w-4 h-4 ${theme.iconColors.green}`} />;
    return <Leaf className={`w-4 h-4 ${theme.iconColors.green}`} />;
  };

  const getDoshaColor = (dosha: string) => {
    if (dosha.includes('Vata')) return theme.badges.blue;
    if (dosha.includes('Pitta')) return theme.badges.orange;
    if (dosha.includes('Kapha')) return theme.badges.green;
    return theme.badges.gray;
  };

  const sidebarLinks = getRoutesByRole(Role.PATIENT).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('appointments') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('medical-records') ? <FileText className="w-5 h-5" /> :
          route.path.includes('prescriptions') ? <Pill className="w-5 h-5" /> :
          route.path.includes('profile') ? <User className="w-5 h-5" /> :
          <Activity className="w-5 h-5" />
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Patient Profile" allowedRole={Role.PATIENT}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Patient",
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
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                    <span className={`${theme.textColors.info} font-semibold text-3xl`}>
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
                  <h2 className={`text-2xl font-bold ${theme.textColors.heading}`}>
                    {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
                  </h2>
                  <div className={`flex items-center gap-4 mt-2 ${theme.textColors.secondary}`}>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {profileData.personalInfo.occupation}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profileData.personalInfo.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {profileData.personalInfo.maritalStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className={`p-2 rounded-lg ${getDoshaColor(profileData.ayurvedaProfile.primaryDosha)}`}>
                      {getDoshaIcon(profileData.ayurvedaProfile.primaryDosha)}
                    </div>
                    <span className="font-medium">Primary Constitution: {profileData.ayurvedaProfile.primaryDosha}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-1 gap-4 text-center">
                    <div>
                      <div className={`text-2xl font-bold ${theme.iconColors.green}`}>{profileData.vitals.bmi}</div>
                      <div className={`text-sm ${theme.textColors.secondary}`}>BMI</div>
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${theme.iconColors.blue}`}>{profileData.vitals.bloodPressure}</div>
                      <div className={`text-sm ${theme.textColors.secondary}`}>BP</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="ayurveda">Ayurveda Profile</TabsTrigger>
              <TabsTrigger value="medical">Medical History</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
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
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select 
                        value={profileData.personalInfo.maritalStatus} 
                        onValueChange={(value) => updatePersonalInfo('maritalStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.personalInfo.city}
                        onChange={(e) => updatePersonalInfo('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profileData.personalInfo.state}
                        onChange={(e) => updatePersonalInfo('state', e.target.value)}
                      />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        value={profileData.personalInfo.occupation}
                        onChange={(e) => updatePersonalInfo('occupation', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={profileData.personalInfo.emergencyContact}
                        onChange={(e) => updatePersonalInfo('emergencyContact', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Vital Statistics */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-4">Vital Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`p-3 ${theme.containers.featureBlue} rounded-lg text-center`}>
                        <div className={`text-sm ${theme.textColors.secondary}`}>Height</div>
                        <div className={`text-lg font-semibold ${theme.iconColors.blue}`}>{profileData.vitals.height}</div>
                      </div>
                      <div className={`p-3 ${theme.containers.featureGreen} rounded-lg text-center`}>
                        <div className={`text-sm ${theme.textColors.secondary}`}>Weight</div>
                        <div className={`text-lg font-semibold ${theme.iconColors.green}`}>{profileData.vitals.weight}</div>
                      </div>
                      <div className={`p-3 ${theme.containers.featurePurple} rounded-lg text-center`}>
                        <div className={`text-sm ${theme.textColors.secondary}`}>Blood Group</div>
                        <div className={`text-lg font-semibold ${theme.iconColors.purple}`}>{profileData.vitals.bloodGroup}</div>
                      </div>
                      <div className={`p-3 ${theme.containers.featureOrange} rounded-lg text-center`}>
                        <div className={`text-sm ${theme.textColors.secondary}`}>BMI</div>
                        <div className={`text-lg font-semibold ${theme.iconColors.orange}`}>{profileData.vitals.bmi}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ayurveda">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-5 h-5" />
                      Ayurvedic Constitution & Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Primary Dosha</Label>
                        <div className={`p-3 rounded-lg ${getDoshaColor(profileData.ayurvedaProfile.primaryDosha)}`}>
                          <div className="flex items-center gap-2">
                            {getDoshaIcon(profileData.ayurvedaProfile.primaryDosha)}
                            <span className="font-medium">{profileData.ayurvedaProfile.primaryDosha}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Constitution Type</Label>
                        <Input value={profileData.ayurvedaProfile.constitution} disabled />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Body Type</Label>
                        <Input value={profileData.ayurvedaProfile.bodyType} disabled />
                      </div>
                      <div>
                        <Label>Mental Constitution</Label>
                        <Input value={profileData.ayurvedaProfile.mentalConstitution} disabled />
                      </div>
                    </div>

                    <div>
                      <Label>Digestive Fire (Agni)</Label>
                      <Input value={profileData.ayurvedaProfile.digestiveFire} disabled />
                    </div>

                    <div>
                      <Label>Current Imbalances</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.ayurvedaProfile.currentImbalances.map((imbalance, index) => (
                          <Badge key={index} variant="outline" className={theme.badges.yellow}>
                            {imbalance}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Preferred Treatments</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.ayurvedaProfile.preferredTreatments.map((treatment, index) => (
                          <Badge key={index} variant="outline" className={theme.badges.green}>
                            {treatment}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Seasonal Tendencies</Label>
                      <div className="space-y-2 mt-2">
                        {profileData.ayurvedaProfile.seasonalTendencies.map((tendency, index) => (
                          <div key={index} className={`flex items-center gap-2 p-2 ${theme.containers.featureBlue} rounded`}>
                            <Info className={`w-4 h-4 ${theme.iconColors.blue}`} />
                            <span className={`text-sm ${theme.textColors.info}`}>{tendency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="medical">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Medical History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Chronic Conditions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.medicalHistory.chronicConditions.map((condition, index) => (
                          <Badge key={index} variant="outline" className={theme.badges.orange}>
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Known Allergies</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.medicalHistory.allergies.map((allergy, index) => (
                          <Badge key={index} variant="outline" className={theme.badges.red}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Current Medications</Label>
                      <div className="space-y-2 mt-2">
                        {profileData.medicalHistory.currentMedications.map((medication, index) => (
                          <div key={index} className={`p-3 ${theme.containers.featureGreen} border ${theme.borders.green} rounded-lg`}>
                            <div className="flex items-center gap-2">
                              <Pill className={`w-4 h-4 ${theme.iconColors.green}`} />
                              <span className={`text-sm ${theme.textColors.success}`}>{medication}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Family History</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.medicalHistory.familyHistory.map((history, index) => (
                          <Badge key={index} variant="outline" className={theme.badges.blue}>
                            {history}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Previous Surgeries</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.medicalHistory.surgeries.map((surgery, index) => (
                          <Badge key={index} variant="outline" className={theme.badges.purple}>
                            {surgery}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className={`text-sm ${theme.textColors.secondary}`}>
                        <strong>Last Health Checkup:</strong> {new Date(profileData.medicalHistory.lastCheckup).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="lifestyle">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Lifestyle & Wellness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Diet Preferences</Label>
                        <Select 
                          value={profileData.lifestyle.dietPreferences} 
                          onValueChange={(value) => setProfileData(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, dietPreferences: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                            <SelectItem value="Vegan">Vegan</SelectItem>
                            <SelectItem value="Jain Vegetarian">Jain Vegetarian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Exercise Routine</Label>
                        <Textarea 
                          value={profileData.lifestyle.exerciseRoutine}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, exerciseRoutine: e.target.value }
                          }))}
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Sleep Pattern</Label>
                        <Input 
                          value={profileData.lifestyle.sleepPattern}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, sleepPattern: e.target.value }
                          }))}
                        />
                      </div>

                      <div>
                        <Label>Meditation Practice</Label>
                        <Textarea 
                          value={profileData.lifestyle.meditationPractice}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, meditationPractice: e.target.value }
                          }))}
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Stress Level</Label>
                        <Select 
                          value={profileData.lifestyle.stressLevel} 
                          onValueChange={(value) => setProfileData(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, stressLevel: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Moderate">Moderate</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Smoking Status</Label>
                        <Select 
                          value={profileData.lifestyle.smokingStatus} 
                          onValueChange={(value) => setProfileData(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, smokingStatus: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Never">Never</SelectItem>
                            <SelectItem value="Former">Former Smoker</SelectItem>
                            <SelectItem value="Current">Current Smoker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Alcohol Consumption</Label>
                        <Select 
                          value={profileData.lifestyle.alcoholConsumption} 
                          onValueChange={(value) => setProfileData(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, alcoholConsumption: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Never">Never</SelectItem>
                            <SelectItem value="Occasional">Occasional</SelectItem>
                            <SelectItem value="Regular">Regular</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Daily Water Intake</Label>
                        <Input 
                          value={profileData.lifestyle.waterIntake}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, waterIntake: e.target.value }
                          }))}
                          placeholder="e.g., 3-4 liters/day"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Medical Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Button className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Document
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download All
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {profileData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{doc.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Badge variant="outline">{doc.type}</Badge>
                              <span>•</span>
                              <span>{doc.date}</span>
                              <span>•</span>
                              <span>{doc.size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">Document Upload Guidelines:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Supported formats: PDF, JPG, PNG</li>
                          <li>Maximum file size: 10MB</li>
                          <li>Ensure documents are clear and readable</li>
                          <li>Include date and doctor information when available</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Communication Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Preferred Language</Label>
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
                            <SelectItem value="Tamil">Tamil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Preferred Doctor</Label>
                        <Select 
                          value={profileData.preferences.preferredDoctor} 
                          onValueChange={(value) => updatePreferences('preferredDoctor', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dr. Priya Sharma">Dr. Priya Sharma</SelectItem>
                            <SelectItem value="Dr. Amit Singh">Dr. Amit Singh</SelectItem>
                            <SelectItem value="No preference">No Preference</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Communication Method</Label>
                      <Select 
                        value={profileData.preferences.communicationMethod} 
                        onValueChange={(value) => updatePreferences('communicationMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="SMS">SMS</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Notification Settings</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Appointment Reminders</Label>
                            <p className="text-sm text-gray-600">Get reminded about upcoming appointments</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.appointmentReminders}
                            onCheckedChange={(checked) => updatePreferences('appointmentReminders', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Medication Reminders</Label>
                            <p className="text-sm text-gray-600">Daily reminders for your medicines</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.medicationReminders}
                            onCheckedChange={(checked) => updatePreferences('medicationReminders', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Treatment Updates</Label>
                            <p className="text-sm text-gray-600">Updates about your treatment progress</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.treatmentUpdates}
                            onCheckedChange={(checked) => updatePreferences('treatmentUpdates', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Health Tips</Label>
                            <p className="text-sm text-gray-600">Receive Ayurvedic health tips and advice</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.healthTips}
                            onCheckedChange={(checked) => updatePreferences('healthTips', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">Change Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
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
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button className="w-full">Update Password</Button>

                    <div className="pt-4 border-t">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Data Sharing with Doctors:</span>
                          <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Anonymous Analytics:</span>
                          <Badge variant="outline">Disabled</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Marketing Communications:</span>
                          <Badge variant="outline">Disabled</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}

