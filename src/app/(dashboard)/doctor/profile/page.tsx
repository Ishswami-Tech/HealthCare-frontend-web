"use client";

import { useState, useEffect } from "react";
import { Role } from "@/types/auth.types";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/query/useUsers";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { 
  UserCheck,
  Save,
  Star,
  Award,
  Clock,
  Camera,
  Edit,
  Stethoscope,
  Loader2,
} from "lucide-react";

export default function DoctorProfile() {
  const { session } = useAuth();
  const user = session?.user;
  const { data: userProfile, isPending: isLoading } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();

  // Profile data
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
      zipCode: ""
    },
    professionalInfo: {
      medicalLicense: "",
      specializations: [] as string[],
      experience: "",
      education: [] as { degree: string; institution: string; year: string }[],
      certifications: [] as string[],
      languagesSpoken: [] as string[],
      clinicAffiliations: [] as string[]
    },
    consultationSettings: {
      consultationFee: "",
      followUpFee: "",
      onlineConsultation: false,
      videoConsultation: false,
      homeVisits: false,
      emergencyConsultation: false,
      consultationDuration: "30",
      maxPatientsPerDay: "",
      bookingAdvanceDays: "30"
    },
    availability: {
      monday: { available: true, startTime: "09:00", endTime: "17:00" },
      tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
      wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
      thursday: { available: true, startTime: "09:00", endTime: "17:00" },
      friday: { available: true, startTime: "09:00", endTime: "17:00" },
      saturday: { available: true, startTime: "09:00", endTime: "14:00" },
      sunday: { available: false, startTime: "", endTime: "" }
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: true,
      appointmentReminders: true,
      patientMessages: true,
      emergencyAlerts: true,
      marketingEmails: false
    }
  });

  // Stats derived from real profile data loaded via useEffect
  const stats = {
    specializations: profileData.professionalInfo.specializations.length,
    certifications: profileData.professionalInfo.certifications.length,
    languagesSpoken: profileData.professionalInfo.languagesSpoken.length,
  };

  const recentReviews: { patientName: string; rating: number; review: string; date: string }[] = [];

  const updatePersonalInfo = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updateProfessionalInfo = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      professionalInfo: { ...prev.professionalInfo, [field]: value }
    }));
  };

  const updateConsultationSettings = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      consultationSettings: { ...prev.consultationSettings, [field]: value }
    }));
  };

  const updateAvailability = (day: string, field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: { ...prev.availability[day as keyof typeof prev.availability], [field]: value }
      }
    }));
  };

  // Fetch profile on mount
  useEffect(() => {
    if (!userProfile) return;
    const data = userProfile as Record<string, unknown>;
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        firstName: (data.firstName as string) || prev.personalInfo.firstName,
        lastName: (data.lastName as string) || prev.personalInfo.lastName,
        email: (data.email as string) || prev.personalInfo.email,
        phone: (data.phone as string) || prev.personalInfo.phone,
        dateOfBirth: (data.dateOfBirth as string) || prev.personalInfo.dateOfBirth,
        gender: (data.gender as string) || prev.personalInfo.gender,
        address: (data.address as string) || prev.personalInfo.address,
        city: (data.city as string) || prev.personalInfo.city,
        state: (data.state as string) || prev.personalInfo.state,
        country: (data.country as string) || prev.personalInfo.country,
        zipCode: (data.zipCode as string) || prev.personalInfo.zipCode,
      },
    }));
  }, [userProfile]);

  const handleSaveProfile = async () => {
    try {
      const { personalInfo } = profileData;
      const result = await updateProfileMutation.mutateAsync({
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        phone: personalInfo.phone,
        dateOfBirth: personalInfo.dateOfBirth,
        gender: personalInfo.gender?.toUpperCase(),
        address: personalInfo.address,
        city: personalInfo.city,
        state: personalInfo.state,
        country: personalInfo.country,
        zipCode: personalInfo.zipCode,
      });
      if (!result.success) {
        showErrorToast(result.error || "Failed to save", { id: TOAST_IDS.GLOBAL.ERROR });
      }
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to save profile", { id: TOAST_IDS.GLOBAL.ERROR });
    }
  };

  return (
    
        <DashboardPageShell>
          <DashboardPageHeader
            eyebrow="Doctor Profile"
            title="Doctor Profile"
            description="Keep your clinical identity, consultation settings, availability, and public profile details up to date."
            actionsSlot={
              <Button
                className="flex items-center gap-2"
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending || isLoading}
              >
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            }
          />

          {/* Profile Overview */}
          <Card className="border-l-4 border-l-emerald-400 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center dark:from-blue-950 dark:to-purple-950">
                    <span className="text-blue-800 font-semibold text-3xl dark:text-blue-200">
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
                    Dr. {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-4 h-4" />
                      {profileData.professionalInfo.specializations[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {profileData.professionalInfo.experience} experience
                    </span>
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-4 h-4" />
                      {stats.specializations} specialization{stats.specializations !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profileData.professionalInfo.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline">{spec}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.certifications}</div>
                      <div className="text-sm text-muted-foreground">Certifications</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.languagesSpoken}</div>
                      <div className="text-sm text-muted-foreground">Languages</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="consultation">Consultation</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
                    <Textarea
                      id="address"
                      value={profileData.personalInfo.address}
                      onChange={(e) => updatePersonalInfo('address', e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Professional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="medicalLicense">Medical License</Label>
                        <Input
                          id="medicalLicense"
                          value={profileData.professionalInfo.medicalLicense}
                          onChange={(e) => updateProfessionalInfo('medicalLicense', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          value={profileData.professionalInfo.experience}
                          onChange={(e) => updateProfessionalInfo('experience', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Specializations</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.professionalInfo.specializations.map((spec, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {spec}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-4 h-4 p-0 hover:bg-red-100"
                              onClick={() => {
                                const newSpecs = profileData.professionalInfo.specializations.filter((_, i) => i !== index);
                                updateProfessionalInfo('specializations', newSpecs);
                              }}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                        <Button variant="outline" size="sm">
                          + Add Specialization
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Languages Spoken</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.professionalInfo.languagesSpoken.map((lang, index) => (
                          <Badge key={index} variant="outline">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Education & Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Education</h4>
                      {profileData.professionalInfo.education.map((edu, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                          <div>
                            <div className="font-medium">{edu.degree}</div>
                            <div className="text-sm text-gray-600">{edu.institution} • {edu.year}</div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm">+ Add Education</Button>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Certifications</h4>
                      {profileData.professionalInfo.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                          <div className="font-medium">{cert}</div>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm">+ Add Certification</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="consultation">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Consultation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                      <Input
                        id="consultationFee"
                        type="number"
                        value={profileData.consultationSettings.consultationFee}
                        onChange={(e) => updateConsultationSettings('consultationFee', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="followUpFee">Follow-up Fee (₹)</Label>
                      <Input
                        id="followUpFee"
                        type="number"
                        value={profileData.consultationSettings.followUpFee}
                        onChange={(e) => updateConsultationSettings('followUpFee', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="consultationDuration">Duration (minutes)</Label>
                      <Input
                        id="consultationDuration"
                        type="number"
                        value={profileData.consultationSettings.consultationDuration}
                        onChange={(e) => updateConsultationSettings('consultationDuration', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Online Consultation</Label>
                        <p className="text-sm text-gray-600">Allow patients to book online consultations</p>
                      </div>
                      <Switch
                        checked={profileData.consultationSettings.onlineConsultation}
                        onCheckedChange={(checked) => updateConsultationSettings('onlineConsultation', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Video Consultation</Label>
                        <p className="text-sm text-gray-600">Enable video calls for consultations</p>
                      </div>
                      <Switch
                        checked={profileData.consultationSettings.videoConsultation}
                        onCheckedChange={(checked) => updateConsultationSettings('videoConsultation', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Home Visits</Label>
                        <p className="text-sm text-gray-600">Offer home visit services</p>
                      </div>
                      <Switch
                        checked={profileData.consultationSettings.homeVisits}
                        onCheckedChange={(checked) => updateConsultationSettings('homeVisits', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Emergency Consultation</Label>
                        <p className="text-sm text-gray-600">Available for emergency consultations</p>
                      </div>
                      <Switch
                        checked={profileData.consultationSettings.emergencyConsultation}
                        onCheckedChange={(checked) => updateConsultationSettings('emergencyConsultation', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Weekly Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(profileData.availability).map(([day, schedule]) => (
                      <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="font-medium capitalize">{day}</div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={schedule.available}
                            onCheckedChange={(checked) => updateAvailability(day, 'available', checked)}
                          />
                          <Label className="text-sm">Available</Label>
                        </div>
                        {schedule.available && (
                          <>
                            <div>
                              <Label className="text-xs text-gray-600">Start Time</Label>
                              <Input
                                type="time"
                                value={schedule.startTime}
                                onChange={(e) => updateAvailability(day, 'startTime', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">End Time</Label>
                              <Input
                                type="time"
                                value={schedule.endTime}
                                onChange={(e) => updateAvailability(day, 'endTime', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </>
                        )}
                        {!schedule.available && (
                          <div className="col-span-2 text-gray-500 text-sm">Not Available</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                {/* Rating Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Patient Reviews & Ratings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                      <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Rating data not yet available</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Reviews */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentReviews.map((review, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{review.patientName}</span>
                                <div className="flex">
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm">{review.review}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(review.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DashboardPageShell>
    
  );
}
