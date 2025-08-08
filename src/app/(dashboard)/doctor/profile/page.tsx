"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
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
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity,
  Calendar, 
  Users,
  UserCheck,
  LogOut,
  Save,
  Star,
  Award,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  FileText,
  Camera,
  Edit,
  Shield,
  Bell,
  Stethoscope
} from "lucide-react";

export default function DoctorProfile() {
  const { session } = useAuth();
  const user = session?.user;

  // Mock profile data
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: user?.firstName || "Priya",
      lastName: user?.lastName || "Sharma",
      email: user?.email || "dr.priya.sharma@ayurvedacenter.com",
      phone: "+91 9876543210",
      dateOfBirth: "1985-03-15",
      gender: "Female",
      address: "123 Medical District, Mumbai, MH 400001",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      zipCode: "400001"
    },
    professionalInfo: {
      medicalLicense: "MH123456",
      specializations: ["Panchakarma", "Nadi Pariksha", "Ayurvedic Medicine"],
      experience: "12 years",
      education: [
        { degree: "BAMS", institution: "KLE University", year: "2012" },
        { degree: "MD Panchakarma", institution: "MUHS", year: "2015" }
      ],
      certifications: [
        "Board Certified Ayurvedic Physician",
        "Panchakarma Specialist Certification",
        "Yoga Therapy Certification"
      ],
      languagesSpoken: ["English", "Hindi", "Marathi", "Sanskrit"],
      clinicAffiliations: ["Ayurveda Wellness Center", "Holistic Health Institute"]
    },
    consultationSettings: {
      consultationFee: "500",
      followUpFee: "300",
      onlineConsultation: true,
      videoConsultation: true,
      homeVisits: false,
      emergencyConsultation: true,
      consultationDuration: "30",
      maxPatientsPerDay: "20",
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

  const [stats] = useState({
    totalPatients: 324,
    consultationsCompleted: 1248,
    averageRating: 4.8,
    totalReviews: 89,
    yearsOfExperience: 12,
    specializations: 3
  });

  const [recentReviews] = useState([
    {
      patientName: "Rajesh K.",
      rating: 5,
      review: "Excellent doctor with deep knowledge of Ayurveda. The Panchakarma treatment helped me tremendously.",
      date: "2024-01-10"
    },
    {
      patientName: "Meera S.",
      rating: 5,
      review: "Very thorough consultation. Dr. Sharma explained everything clearly and the treatment plan is working well.",
      date: "2024-01-08"
    },
    {
      patientName: "Anil P.",
      rating: 4,
      review: "Professional and caring approach. Nadi Pariksha was very insightful.",
      date: "2024-01-05"
    }
  ]);

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

  const updateNotificationSettings = (field: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, [field]: value }
    }));
  };

  const sidebarLinks = getRoutesByRole(Role.DOCTOR).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('appointments') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('patients') ? <Users className="w-5 h-5" /> :
          route.path.includes('profile') ? <UserCheck className="w-5 h-5" /> :
          <Stethoscope className="w-5 h-5" />
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Doctor Profile" allowedRole={Role.DOCTOR}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Doctor",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png" 
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Doctor Profile</h1>
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
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-800 font-semibold text-3xl">
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
                  <div className="flex items-center gap-4 mt-2 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-4 h-4" />
                      {profileData.professionalInfo.specializations[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {profileData.professionalInfo.experience} experience
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {stats.averageRating}/5.0
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
                      <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
                      <div className="text-sm text-gray-600">Patients</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.consultationsCompleted}</div>
                      <div className="text-sm text-gray-600">Consultations</div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-600">{stats.averageRating}</div>
                        <div className="flex justify-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 ${i < Math.floor(stats.averageRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Overall Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600">{stats.totalReviews}</div>
                        <div className="text-sm text-gray-600">Total Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600">96%</div>
                        <div className="text-sm text-gray-600">Recommendation Rate</div>
                      </div>
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
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}

