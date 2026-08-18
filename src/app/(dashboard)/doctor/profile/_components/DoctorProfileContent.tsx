"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { Loader2, Save } from "lucide-react";
import type {
  DoctorProfileAvailabilityDay,
  DoctorProfileFormState,
  DoctorProfileStats,
  DoctorProfileUser,
  DoctorReview,
  SaveProfileMutation,
} from "./doctor-profile.types";
import { DoctorProfileOverviewCard } from "./DoctorProfileOverviewCard";
import { DoctorProfilePersonalTab } from "./DoctorProfilePersonalTab";
import { DoctorProfileProfessionalTab } from "./DoctorProfileProfessionalTab";
import { DoctorProfileConsultationTab } from "./DoctorProfileConsultationTab";
import { DoctorProfileAvailabilityTab } from "./DoctorProfileAvailabilityTab";
import { DoctorProfileReviewsTab } from "./DoctorProfileReviewsTab";

interface DoctorProfileContentProps {
  user: DoctorProfileUser | undefined;
  userProfile: unknown;
  isLoading: boolean;
  updateProfileMutation: SaveProfileMutation;
}

function createInitialProfileData(
  user?: DoctorProfileUser,
  userProfile?: unknown,
): DoctorProfileFormState {
  const profile = (userProfile || {}) as Record<string, unknown>;
  return {
    personalInfo: {
      firstName: (profile.firstName as string) || user?.firstName || "",
      lastName: (profile.lastName as string) || user?.lastName || "",
      email: (profile.email as string) || user?.email || "",
      phone: (profile.phone as string) || "",
      dateOfBirth: (profile.dateOfBirth as string) || "",
      gender: (profile.gender as string) || "",
      address: (profile.address as string) || "",
      city: (profile.city as string) || "",
      state: (profile.state as string) || "",
      country: (profile.country as string) || "",
      zipCode: (profile.zipCode as string) || "",
    },
    professionalInfo: {
      medicalLicense: "",
      specializations: [],
      experience: "",
      education: [],
      certifications: [],
      languagesSpoken: [],
      clinicAffiliations: [],
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
      bookingAdvanceDays: "30",
    },
    availability: {
      monday: { available: true, startTime: "09:00", endTime: "17:00" },
      tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
      wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
      thursday: { available: true, startTime: "09:00", endTime: "17:00" },
      friday: { available: true, startTime: "09:00", endTime: "17:00" },
      saturday: { available: true, startTime: "09:00", endTime: "14:00" },
      sunday: { available: false, startTime: "", endTime: "" },
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: true,
      appointmentReminders: true,
      patientMessages: true,
      emergencyAlerts: true,
      marketingEmails: false,
    },
  };
}

export function DoctorProfileContent({
  user,
  userProfile,
  isLoading,
  updateProfileMutation,
}: DoctorProfileContentProps) {
  const [profileData, setProfileData] = useState(() =>
    createInitialProfileData(user, userProfile),
  );

  const stats: DoctorProfileStats = useMemo(
    () => ({
      specializations: profileData.professionalInfo.specializations.length,
      certifications: profileData.professionalInfo.certifications.length,
      languagesSpoken: profileData.professionalInfo.languagesSpoken.length,
    }),
    [profileData.professionalInfo.certifications.length, profileData.professionalInfo.languagesSpoken.length, profileData.professionalInfo.specializations.length],
  );

  const recentReviews: DoctorReview[] = [];

  const updatePersonalInfo = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const updateProfessionalInfo = (field: string, value: unknown) => {
    setProfileData((prev) => ({
      ...prev,
      professionalInfo: { ...prev.professionalInfo, [field]: value },
    }));
  };

  const updateConsultationSettings = (field: string, value: unknown) => {
    setProfileData((prev) => ({
      ...prev,
      consultationSettings: { ...prev.consultationSettings, [field]: value },
    }));
  };

  const updateAvailability = (
    day: string,
    field: string,
    value: unknown,
  ) => {
    setProfileData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...(prev.availability[day as keyof typeof prev.availability] as DoctorProfileAvailabilityDay),
          [field]: value,
        } as DoctorProfileAvailabilityDay,
      },
    }));
  };

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
        showErrorToast(result.error || "Failed to save", {
          id: TOAST_IDS.GLOBAL.ERROR,
        });
      }
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to save profile",
        { id: TOAST_IDS.GLOBAL.ERROR },
      );
    }
  };

  const headerActions = (
    <Button
      className="flex items-center gap-2"
      onClick={handleSaveProfile}
      disabled={updateProfileMutation.isPending || isLoading}
      type="button"
    >
      {updateProfileMutation.isPending ? (
        <LoaderIcon />
      ) : (
        <Save className="size-4" />
      )}
      Save Changes
    </Button>
  );

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Profile"
        title="Doctor Profile"
        description="Keep your clinical identity, consultation settings, availability, and public profile details up to date."
        actionsSlot={headerActions}
      />

      <DoctorProfileOverviewCard profileData={profileData} stats={stats} />

      <Tabs defaultValue="personal" className="flex flex-col gap-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="consultation">Consultation</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <DoctorProfilePersonalTab
            profileData={profileData}
            updatePersonalInfo={updatePersonalInfo}
            phoneVerified={(userProfile as Record<string, unknown>)?.phoneVerified as boolean | undefined}
          />
        </TabsContent>

        <TabsContent value="professional">
          <DoctorProfileProfessionalTab
            profileData={profileData}
            updateProfessionalInfo={updateProfessionalInfo}
          />
        </TabsContent>

        <TabsContent value="consultation">
          <DoctorProfileConsultationTab
            profileData={profileData}
            updateConsultationSettings={updateConsultationSettings}
          />
        </TabsContent>

        <TabsContent value="availability">
          <DoctorProfileAvailabilityTab
            profileData={profileData}
            updateAvailability={updateAvailability}
          />
        </TabsContent>

        <TabsContent value="reviews">
          <DoctorProfileReviewsTab recentReviews={recentReviews} />
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  );
}

function LoaderIcon() {
  return <Loader2 className="size-4 animate-spin" />;
}
