"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useAuth } from "@/hooks/auth/useAuth";
import { theme } from "@/lib/utils/theme-utils";
import { PageLoading, ErrorState } from "@/components/ui/loading";
import { PasswordChangeModal, DataExportModal } from "@/components/patient/PatientModals";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { useEffect } from "react";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/query/useUsers";
import { 
  Activity,
  FileText,
  Pill,
  User,
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
  Upload,
  Lock
} from "lucide-react";

export default function PatientProfile() {
  const { session } = useAuth();
  const user = session?.user;
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { data: userProfile, isPending: isLoading, error: profileError } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();

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
      emergencyPhone: "",
      occupation: "",
      maritalStatus: ""
    },
    ayurvedaProfile: {
      primaryDosha: "",
      constitution: "",
      currentImbalances: [] as string[],
      bodyType: "",
      mentalConstitution: "",
      digestiveFire: "",
      preferredTreatments: [] as string[],
      seasonalTendencies: [] as string[]
    },
    medicalHistory: {
      chronicConditions: [] as string[],
      allergies: [] as string[],
      currentMedications: [] as string[],
      familyHistory: [] as string[],
      surgeries: [] as string[],
      lastCheckup: ""
    },
    lifestyle: {
      dietPreferences: "",
      exerciseRoutine: "",
      sleepPattern: "",
      stressLevel: "",
      waterIntake: "",
      smokingStatus: "",
      alcoholConsumption: "",
      meditationPractice: ""
    },
    vitals: {
      height: "",
      weight: "",
      bmi: "",
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      bloodGroup: ""
    },
    preferences: {
      language: "",
      communicationPreference: "",
      communicationMethod: "",
      preferredDoctor: "",
      timezone: "",
      notificationSettings: {
        email: true,
        sms: false,
        push: true,
        appointmentReminders: true,
        prescriptionRefills: true,
        healthTips: false,
        medicationReminders: false,
        treatmentUpdates: false
      }
    },
    documents: [] as { name: string; type: string; date: string; size: string }[]
  });

  useEffect(() => {
    if (userProfile) {
      const data = userProfile as any;
      setProfileData(prev => ({
        personalInfo: {
          firstName: data.firstName || prev.personalInfo.firstName,
          lastName: data.lastName || prev.personalInfo.lastName,
          email: data.email || prev.personalInfo.email,
          phone: data.phone || prev.personalInfo.phone,
          dateOfBirth: data.dateOfBirth || prev.personalInfo.dateOfBirth,
          gender: data.gender || prev.personalInfo.gender,
          address: data.address || prev.personalInfo.address,
          city: data.city || prev.personalInfo.city,
          state: data.state || prev.personalInfo.state,
          country: data.country || prev.personalInfo.country,
          zipCode: data.zipCode || prev.personalInfo.zipCode,
          emergencyContact: data.emergencyContact || prev.personalInfo.emergencyContact,
          emergencyPhone: data.emergencyPhone || prev.personalInfo.emergencyPhone,
          occupation: data.occupation || prev.personalInfo.occupation,
          maritalStatus: data.maritalStatus || prev.personalInfo.maritalStatus,
        },
        ayurvedaProfile: data.ayurvedaProfile || prev.ayurvedaProfile,
        medicalHistory: data.medicalHistory || prev.medicalHistory,
        lifestyle: data.lifestyle || prev.lifestyle,
        vitals: data.vitals || prev.vitals,
        preferences: data.preferences || prev.preferences,
        documents: data.documents || prev.documents,
      }));
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    try {
      setValidationErrors({});
      const result = await updateProfileMutation.mutateAsync(profileData as any);
      if (!result?.success) {
        setValidationErrors({ general: result?.error || "Failed to save profile" });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setValidationErrors({ general: 'An unexpected error occurred' });
    }
  };

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

  const updateNotificationSettings = (field: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notificationSettings: {
          ...prev.preferences.notificationSettings,
          [field]: value
        }
      }
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

  if (profileError) {
    return (
        <ErrorState
          title="Unable to load profile"
          message="We couldn't fetch your profile data. Please try again."
          onRetry={() => window.location.reload()}
        />
    );
  }

  if (isLoading) {
    return (
        <PageLoading text="Loading your profile..." />
    );
  }

  return (
    <PatientPageShell>
        <PatientPageHeader
          eyebrow="MY PROFILE"
          title="My Profile"
          description="Update your personal information, Ayurvedic profile, and health data."
          actionsSlot={
            <div className="flex flex-wrap items-center gap-2">
              <PasswordChangeModal
                trigger={
                  <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 rounded-xl px-4">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Button>
                }
              />
              <DataExportModal
                dataType="profile"
                trigger={
                  <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 rounded-xl px-4">
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                }
              />
              <Button size="sm" className="flex items-center gap-2 h-10 rounded-xl px-4" disabled={updateProfileMutation.isPending} onClick={handleSaveProfile}>
                <Save className="w-4 h-4" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          }
        />

          {validationErrors.general && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {validationErrors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Overview */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                    <span className={`${theme.textColors.info} font-semibold text-2xl sm:text-3xl`}>
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
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h2 className={`text-xl sm:text-2xl font-bold ${theme.textColors.heading}`}>
                    {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
                  </h2>
                  <div className={`flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-2 mt-2 ${theme.textColors.secondary} text-xs sm:text-sm`}>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {profileData.personalInfo.occupation}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {profileData.personalInfo.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {profileData.personalInfo.maritalStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${getDoshaColor(profileData.ayurvedaProfile.primaryDosha)}`}>
                      {getDoshaIcon(profileData.ayurvedaProfile.primaryDosha)}
                    </div>
                    <span className="font-medium text-xs sm:text-sm">Primary Constitution: {profileData.ayurvedaProfile.primaryDosha}</span>
                  </div>
                </div>
                <div className="w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 text-center">
                    <div>
                      <div className={`text-xl sm:text-2xl font-bold ${theme.iconColors.green}`}>{profileData.vitals.bmi}</div>
                      <div className={`text-[10px] sm:text-sm ${theme.textColors.secondary} uppercase tracking-wider font-bold`}>BMI</div>
                    </div>
                    <div>
                      <div className={`text-lg sm:text-xl font-bold ${theme.iconColors.blue}`}>{profileData.vitals.bloodPressure}</div>
                      <div className={`text-[10px] sm:text-sm ${theme.textColors.secondary} uppercase tracking-wider font-bold`}>BP</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="space-y-6">
            <div className="overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-max sm:flex sm:w-full min-w-full">
                <TabsTrigger value="personal" className="px-4 text-xs sm:text-sm">Personal</TabsTrigger>
                <TabsTrigger value="ayurveda" className="px-4 text-xs sm:text-sm">Ayurveda</TabsTrigger>
                <TabsTrigger value="medical" className="px-4 text-xs sm:text-sm">Medical</TabsTrigger>
                <TabsTrigger value="lifestyle" className="px-4 text-xs sm:text-sm">Lifestyle</TabsTrigger>
                <TabsTrigger value="documents" className="px-4 text-xs sm:text-sm">Documents</TabsTrigger>
                <TabsTrigger value="preferences" className="px-4 text-xs sm:text-sm">Preferences</TabsTrigger>
              </TabsList>
            </div>

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
                      <Input id="firstName" value={profileData.personalInfo.firstName} onChange={(e) => updatePersonalInfo('firstName', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={profileData.personalInfo.lastName} onChange={(e) => updatePersonalInfo('lastName', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={profileData.personalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={profileData.personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input id="dateOfBirth" type="date" value={profileData.personalInfo.dateOfBirth} onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={profileData.personalInfo.gender} onValueChange={(value) => updatePersonalInfo('gender', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select value={profileData.personalInfo.maritalStatus} onValueChange={(value) => updatePersonalInfo('maritalStatus', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Input id="address" value={profileData.personalInfo.address} onChange={(e) => updatePersonalInfo('address', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={profileData.personalInfo.city} onChange={(e) => updatePersonalInfo('city', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={profileData.personalInfo.state} onChange={(e) => updatePersonalInfo('state', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input id="zipCode" value={profileData.personalInfo.zipCode} onChange={(e) => updatePersonalInfo('zipCode', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input id="occupation" value={profileData.personalInfo.occupation} onChange={(e) => updatePersonalInfo('occupation', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input id="emergencyContact" value={profileData.personalInfo.emergencyContact} onChange={(e) => updatePersonalInfo('emergencyContact', e.target.value)} />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-4 text-sm sm:text-base">Vital Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <div className={`p-3 ${theme.containers.featureBlue} rounded-lg text-center`}>
                        <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase font-bold`}>Height</div>
                        <div className={`text-base sm:text-lg font-semibold ${theme.iconColors.blue}`}>{profileData.vitals.height}</div>
                      </div>
                      <div className={`p-3 ${theme.containers.featureGreen} rounded-lg text-center`}>
                        <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase font-bold`}>Weight</div>
                        <div className={`text-base sm:text-lg font-semibold ${theme.iconColors.green}`}>{profileData.vitals.weight}</div>
                      </div>
                      <div className={`p-3 ${theme.containers.featureBlue} rounded-lg text-center`}>
                        <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase font-bold`}>Group</div>
                        <div className={`text-base sm:text-lg font-semibold ${theme.iconColors.blue}`}>{profileData.vitals.bloodGroup}</div>
                      </div>
                      <div className={`p-3 ${theme.containers.featureOrange} rounded-lg text-center`}>
                        <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase font-bold`}>BMI</div>
                        <div className={`text-base sm:text-lg font-semibold ${theme.iconColors.orange}`}>{profileData.vitals.bmi}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ayurveda">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-5 h-5" />
                      Ayurvedic Profile
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
                          <Badge key={index} variant="outline" className={theme.badges.yellow}>{imbalance}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Preferred Treatments</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.ayurvedaProfile.preferredTreatments.map((treatment, index) => (
                          <Badge key={index} variant="outline" className={theme.badges.green}>{treatment}</Badge>
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
            </TabsContent>

            <TabsContent value="medical">
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
                          <Badge key={index} variant="outline" className={theme.badges.orange}>{condition}</Badge>
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
                          <Badge key={index} variant="outline" className={theme.badges.blue}>{history}</Badge>
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
                        <Select value={profileData.lifestyle.dietPreferences} onValueChange={(value) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, dietPreferences: value }}))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Textarea value={profileData.lifestyle.exerciseRoutine} onChange={(e) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, exerciseRoutine: e.target.value }}))} rows={2} />
                      </div>
                      <div>
                        <Label>Sleep Pattern</Label>
                        <Input value={profileData.lifestyle.sleepPattern} onChange={(e) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, sleepPattern: e.target.value }}))} />
                      </div>
                      <div>
                        <Label>Meditation Practice</Label>
                        <Textarea value={profileData.lifestyle.meditationPractice} onChange={(e) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, meditationPractice: e.target.value }}))} rows={2} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Stress Level</Label>
                        <Select value={profileData.lifestyle.stressLevel} onValueChange={(value) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, stressLevel: value }}))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Moderate">Moderate</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Smoking Status</Label>
                        <Select value={profileData.lifestyle.smokingStatus} onValueChange={(value) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, smokingStatus: value }}))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Never">Never</SelectItem>
                            <SelectItem value="Former">Former Smoker</SelectItem>
                            <SelectItem value="Current">Current Smoker</SelectItem>
                          </SelectContent>
                        </Select>
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
                       Health Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profileData.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><FileText className="w-4 h-4" /></div>
                            <div className="min-w-0"><p className="text-sm font-medium truncate">{doc.name}</p><p className="text-[10px] text-muted-foreground">{doc.date} • {doc.size}</p></div>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0"><Download className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="text-[11px] sm:text-sm text-muted-foreground">
                          <p className="font-bold mb-1 text-emerald-900">Guidelines:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>PDF, JPG, PNG (Max 10MB)</li>
                            <li>Ensure documents are clear and readable</li>
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
                      Communication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Language</Label>
                        <Select value={profileData.preferences.language} onValueChange={(value) => updatePreferences('language', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Method</Label>
                        <Select value={profileData.preferences.communicationMethod} onValueChange={(value) => updatePreferences('communicationMethod', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="SMS">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div><Label className="text-sm">Appointments</Label><p className="text-[11px] text-muted-foreground">Reminders and updates</p></div>
                          <Switch checked={profileData.preferences.notificationSettings.appointmentReminders} onCheckedChange={(checked) => updateNotificationSettings('appointmentReminders', checked)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div><Label className="text-sm">Health Tips</Label><p className="text-[11px] text-muted-foreground">Ayurvedic advice</p></div>
                          <Switch checked={profileData.preferences.notificationSettings.healthTips} onCheckedChange={(checked) => updateNotificationSettings('healthTips', checked)} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                        <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button className="w-full h-11 rounded-xl font-bold">Update Password</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
      </PatientPageShell>
  );
}
