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
import { formatDateInIST } from "@/lib/utils/date-time";
import { PageLoading, ErrorState } from "@/components/ui/loading";
import { DataExportModal, PasswordChangeModal } from "@/components/patient/PatientModals";
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
  Heart,
  Leaf,
  Sun,
  Moon,
  Waves,
  AlertTriangle,
  Info,
  Download,
  Upload,
  Key,
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
    <PatientPageShell className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PatientPageHeader
          eyebrow="MY PROFILE"
          title="My Profile"
          description="Update your personal information, Ayurvedic profile, and health data."
          actionsSlot={
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm" disabled={updateProfileMutation.isPending} onClick={handleSaveProfile}>
                <Save className="w-4 h-4" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <PasswordChangeModal
                trigger={
                  <Button variant="outline" size="sm" className="flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm">
                    <Key className="w-4 h-4" />
                    Password
                  </Button>
                }
              />
              <DataExportModal
                dataType="profile"
                trigger={
                  <Button variant="outline" size="sm" className="flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm">
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                }
              />
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
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex flex-col items-center gap-3.5 sm:flex-row sm:items-start sm:gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-green-100 sm:h-18 sm:w-18">
                    <span className={`${theme.textColors.info} text-lg font-semibold sm:text-xl`}>
                      {profileData.personalInfo.firstName.charAt(0)}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-1 -right-1 h-6.5 w-6.5 rounded-full p-0"
                  >
                    <Camera className="w-3 h-3" />
                  </Button>
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className={`text-lg sm:text-xl font-bold ${theme.textColors.heading}`}>
                    {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
                  </h2>
                  <div className={`mt-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[11px] sm:justify-start sm:text-sm ${theme.textColors.secondary}`}>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      {profileData.personalInfo.occupation}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      {profileData.personalInfo.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                      {profileData.personalInfo.maritalStatus}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-center gap-2 sm:justify-start">
                    <div className={`rounded-lg p-1.5 ${getDoshaColor(profileData.ayurvedaProfile.primaryDosha)}`}>
                      {getDoshaIcon(profileData.ayurvedaProfile.primaryDosha)}
                    </div>
                    <span className="font-medium text-[11px] sm:text-sm">Primary Constitution: {profileData.ayurvedaProfile.primaryDosha}</span>
                  </div>
                </div>
                <div className="w-full border-t border-border pt-3 text-center sm:w-auto sm:border-t-0 sm:pt-0 sm:text-left">
                  <div className="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-1 sm:gap-3">
                    <div>
                      <div className={`text-lg sm:text-xl font-bold ${theme.iconColors.green}`}>{profileData.vitals.bmi}</div>
                      <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase tracking-wider font-bold`}>BMI</div>
                    </div>
                    <div>
                      <div className={`text-base sm:text-lg font-bold ${theme.iconColors.blue}`}>{profileData.vitals.bloodPressure}</div>
                      <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase tracking-wider font-bold`}>BP</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="space-y-4">
            <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="personal" className="px-3 text-[11px] sm:text-sm">Personal</TabsTrigger>
                <TabsTrigger value="ayurveda" className="px-3 text-[11px] sm:text-sm">Ayurveda</TabsTrigger>
                <TabsTrigger value="medical" className="px-3 text-[11px] sm:text-sm">Medical</TabsTrigger>
                <TabsTrigger value="lifestyle" className="px-3 text-[11px] sm:text-sm">Lifestyle</TabsTrigger>
                <TabsTrigger value="documents" className="px-3 text-[11px] sm:text-sm">Documents</TabsTrigger>
                <TabsTrigger value="preferences" className="px-3 text-[11px] sm:text-sm">Preferences</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="personal">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={profileData.personalInfo.firstName} onChange={(e) => updatePersonalInfo('firstName', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={profileData.personalInfo.lastName} onChange={(e) => updatePersonalInfo('lastName', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={profileData.personalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={profileData.personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="min-h-11"
                        value={profileData.personalInfo.dateOfBirth}
                        onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={profileData.personalInfo.gender} onValueChange={(value) => updatePersonalInfo('gender', value)}>
                        <SelectTrigger className="w-full min-h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select value={profileData.personalInfo.maritalStatus} onValueChange={(value) => updatePersonalInfo('maritalStatus', value)}>
                        <SelectTrigger className="w-full min-h-11">
                          <SelectValue placeholder="Select status" />
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
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={profileData.personalInfo.address} onChange={(e) => updatePersonalInfo('address', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        className="min-h-11"
                        value={profileData.personalInfo.city}
                        onChange={(e) => updatePersonalInfo('city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        className="min-h-11"
                        value={profileData.personalInfo.state}
                        onChange={(e) => updatePersonalInfo('state', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        className="min-h-11"
                        value={profileData.personalInfo.zipCode}
                        onChange={(e) => updatePersonalInfo('zipCode', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        className="min-h-11"
                        value={profileData.personalInfo.occupation}
                        onChange={(e) => updatePersonalInfo('occupation', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        className="min-h-11"
                        value={profileData.personalInfo.emergencyContact}
                        onChange={(e) => updatePersonalInfo('emergencyContact', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="mb-4 text-sm font-semibold sm:text-base">Vital Statistics</h4>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-3.5">
                      <div className={`rounded-lg p-3 text-center ${theme.containers.featureBlue}`}>
                        <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase font-bold`}>Height</div>
                        <div className={`text-base sm:text-lg font-semibold ${theme.iconColors.blue}`}>{profileData.vitals.height}</div>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${theme.containers.featureGreen}`}>
                        <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase font-bold`}>Weight</div>
                        <div className={`text-base sm:text-lg font-semibold ${theme.iconColors.green}`}>{profileData.vitals.weight}</div>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${theme.containers.featureBlue}`}>
                        <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} uppercase font-bold`}>Group</div>
                        <div className={`text-base sm:text-lg font-semibold ${theme.iconColors.blue}`}>{profileData.vitals.bloodGroup}</div>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${theme.containers.featureOrange}`}>
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
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5" />
                    Ayurvedic Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Primary Dosha</Label>
                      <div className={`rounded-lg p-2.5 ${getDoshaColor(profileData.ayurvedaProfile.primaryDosha)}`}>
                        <div className="flex items-center gap-1.5">
                          {getDoshaIcon(profileData.ayurvedaProfile.primaryDosha)}
                          <span className="text-sm font-medium">{profileData.ayurvedaProfile.primaryDosha}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Constitution Type</Label>
                      <Input className="min-h-11" value={profileData.ayurvedaProfile.constitution} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Body Type</Label>
                      <Input className="min-h-11" value={profileData.ayurvedaProfile.bodyType} disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mental Constitution</Label>
                      <Input className="min-h-11" value={profileData.ayurvedaProfile.mentalConstitution} disabled />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Digestive Fire (Agni)</Label>
                    <Input className="min-h-11" value={profileData.ayurvedaProfile.digestiveFire} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current Imbalances</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profileData.ayurvedaProfile.currentImbalances.map((imbalance, index) => (
                        <Badge key={index} variant="outline" className={`${theme.badges.yellow} px-2 py-0.5 text-[11px]`}>{imbalance}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred Treatments</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profileData.ayurvedaProfile.preferredTreatments.map((treatment, index) => (
                        <Badge key={index} variant="outline" className={`${theme.badges.green} px-2 py-0.5 text-[11px]`}>{treatment}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Seasonal Tendencies</Label>
                    <div className="mt-2 space-y-1.5">
                      {profileData.ayurvedaProfile.seasonalTendencies.map((tendency, index) => (
                        <div key={index} className={`flex items-center gap-2 rounded p-2 ${theme.containers.featureBlue}`}>
                          <Info className={`w-3.5 h-3.5 ${theme.iconColors.blue}`} />
                          <span className={`text-[11px] sm:text-sm ${theme.textColors.info}`}>{tendency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label>Chronic Conditions</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profileData.medicalHistory.chronicConditions.map((condition, index) => (
                        <Badge key={index} variant="outline" className={`${theme.badges.orange} px-2 py-0.5 text-[11px]`}>{condition}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Known Allergies</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profileData.medicalHistory.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className={`${theme.badges.red} px-2 py-0.5 text-[11px]`}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current Medications</Label>
                    <div className="mt-2 space-y-1.5">
                      {profileData.medicalHistory.currentMedications.map((medication, index) => (
                        <div key={index} className={`rounded-lg border p-2.5 ${theme.containers.featureGreen} ${theme.borders.green}`}>
                          <div className="flex items-center gap-2">
                            <Pill className={`w-3.5 h-3.5 ${theme.iconColors.green}`} />
                            <span className={`text-[11px] sm:text-sm ${theme.textColors.success}`}>{medication}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Family History</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profileData.medicalHistory.familyHistory.map((history, index) => (
                        <Badge key={index} variant="outline" className={`${theme.badges.blue} px-2 py-0.5 text-[11px]`}>{history}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-3.5">
                    <div className={`text-[11px] sm:text-sm ${theme.textColors.secondary}`}>
                      <strong>Last Health Checkup:</strong> {formatDateInIST(profileData.medicalHistory.lastCheckup)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lifestyle">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Lifestyle & Wellness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <Label>Diet Preferences</Label>
                        <Select value={profileData.lifestyle.dietPreferences} onValueChange={(value) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, dietPreferences: value }}))}>
                          <SelectTrigger className="w-full min-h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                            <SelectItem value="Vegan">Vegan</SelectItem>
                            <SelectItem value="Jain Vegetarian">Jain Vegetarian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Exercise Routine</Label>
                        <Textarea className="min-h-20" value={profileData.lifestyle.exerciseRoutine} onChange={(e) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, exerciseRoutine: e.target.value }}))} rows={2} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Sleep Pattern</Label>
                        <Input className="min-h-11" value={profileData.lifestyle.sleepPattern} onChange={(e) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, sleepPattern: e.target.value }}))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Meditation Practice</Label>
                        <Textarea className="min-h-20" value={profileData.lifestyle.meditationPractice} onChange={(e) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, meditationPractice: e.target.value }}))} rows={2} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Stress Level</Label>
                        <Select value={profileData.lifestyle.stressLevel} onValueChange={(value) => setProfileData(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, stressLevel: value }}))}>
                          <SelectTrigger className="w-full min-h-11"><SelectValue /></SelectTrigger>
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
                          <SelectTrigger className="w-full min-h-11"><SelectValue /></SelectTrigger>
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
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                       <FileText className="w-5 h-5" />
                       Health Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {profileData.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border p-2.5 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600"><FileText className="w-4 h-4" /></div>
                            <div className="min-w-0"><p className="text-sm font-medium truncate">{doc.name}</p><p className="text-[10px] text-muted-foreground">{doc.date} • {doc.size}</p></div>
                          </div>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0"><Download className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
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
              <div className="space-y-4">
                <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Communication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Language</Label>
                        <Select value={profileData.preferences.language} onValueChange={(value) => updatePreferences('language', value)}>
                          <SelectTrigger className="w-full min-h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Method</Label>
                        <Select value={profileData.preferences.communicationMethod} onValueChange={(value) => updatePreferences('communicationMethod', value)}>
                          <SelectTrigger className="w-full min-h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="SMS">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3.5 border-t pt-3.5">
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
              </div>
            </TabsContent>
          </Tabs>
      </PatientPageShell>
  );
}
