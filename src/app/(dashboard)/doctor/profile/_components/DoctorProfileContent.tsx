"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Note, PageHero } from "@/components/tbd";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { CircleAlert, Loader2, RefreshCw, Save } from "lucide-react";
import type {
  DoctorProfileAvailabilityDay,
  DoctorProfileFormState,
  DoctorProfileReviewsState,
  DoctorProfileStats,
  DoctorProfileUser,
  SaveProfileMutation,
} from "./doctor-profile.types";
import { updateDoctorProfile } from "@/lib/actions/doctors.server";
import { asRecord, educationList, stringList } from "./doctor-profile.logic";
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
  /** Patient reviews for the Reviews tab (from `useDoctorReviews`). */
  reviews?: DoctorProfileReviewsState;
  /** The profile could not be loaded; the form shows what the session knows. */
  loadFailed?: boolean;
  onRetryLoad?: () => void;
}

const NO_REVIEWS: DoctorProfileReviewsState = { reviews: [], isLoading: false, loadFailed: false };

/** Text of a profile field that may be a number ("14", 600). */
function fieldText(value: unknown): string {
  return value === undefined || value === null ? "" : String(value).trim();
}

/** "MALE" from the API -> "Male" for the select; anything else is kept as typed. */
function genderOption(value: unknown): string {
  const gender = fieldText(value);
  return /^(male|female|other)$/i.test(gender)
    ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
    : gender;
}

/** The date input needs "YYYY-MM-DD"; the API may answer with a full timestamp. */
function dateInputValue(value: unknown): string {
  const date = fieldText(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(date) ? date.slice(0, 10) : date;
}

const PROFILE_TABS = [
  "personal",
  "professional",
  "consultation",
  "availability",
  "reviews",
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number];

function createInitialProfileData(
  user?: DoctorProfileUser,
  userProfile?: unknown,
): DoctorProfileFormState {
  const profile = (userProfile || {}) as Record<string, unknown>;
  // Doctor-only fields may sit on the profile itself or on its `doctor` record.
  const doctor = asRecord(profile.doctor);
  const pick = (...fields: string[]): unknown => {
    for (const field of fields) {
      const value = profile[field] ?? doctor[field];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  };
  const defaultAvailability: DoctorProfileFormState["availability"] = {
    monday: { available: true, startTime: "09:00", endTime: "17:00" },
    tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
    wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
    thursday: { available: true, startTime: "09:00", endTime: "17:00" },
    friday: { available: true, startTime: "09:00", endTime: "17:00" },
    saturday: { available: true, startTime: "09:00", endTime: "14:00" },
    sunday: { available: false, startTime: "", endTime: "" },
  };

  const storedAvailability =
    (profile.availability as
      | Record<string, { start?: string; end?: string }[] | DoctorProfileAvailabilityDay>
      | undefined) ||
    (profile.workingHours as Record<string, { start?: string; end?: string }[]> | undefined);

  const availability = { ...defaultAvailability };
  if (storedAvailability && typeof storedAvailability === "object") {
    for (const [day, value] of Object.entries(storedAvailability)) {
      if (!(day in availability)) continue;
      if (Array.isArray(value)) {
        const firstSlot = value[0];
        availability[day as keyof typeof availability] = {
          available: Boolean(firstSlot?.start && firstSlot?.end),
          startTime: firstSlot?.start || "",
          endTime: firstSlot?.end || "",
        };
      } else if (value && typeof value === "object") {
        const dayValue = value as DoctorProfileAvailabilityDay;
        availability[day as keyof typeof availability] = {
          available: Boolean(dayValue.available),
          startTime: dayValue.startTime || "",
          endTime: dayValue.endTime || "",
        };
      }
    }
  }

  return {
    personalInfo: {
      firstName: (profile.firstName as string) || user?.firstName || "",
      lastName: (profile.lastName as string) || user?.lastName || "",
      email: (profile.email as string) || user?.email || "",
      phone: (profile.phone as string) || "",
      dateOfBirth: dateInputValue(profile.dateOfBirth),
      gender: genderOption(profile.gender),
      address: (profile.address as string) || "",
      city: (profile.city as string) || "",
      state: (profile.state as string) || "",
      country: (profile.country as string) || "",
      zipCode: (profile.zipCode as string) || "",
    },
    professionalInfo: {
      medicalLicense: fieldText(pick("medicalLicense", "licenseNumber", "registrationNumber")),
      specializations: pick("specialization") ? [String(pick("specialization"))] : [],
      experience: fieldText(pick("experience")),
      education: educationList(pick("education"), pick("qualification")),
      certifications: stringList(pick("certifications")),
      languagesSpoken: stringList(pick("languagesSpoken", "languages")),
      clinicAffiliations: [],
    },
    consultationSettings: {
      consultationFee: fieldText(pick("consultationFee")),
      followUpFee: fieldText(pick("followUpFee")),
      onlineConsultation: pick("onlineConsultation") === true,
      videoConsultation: pick("videoConsultation") === true,
      homeVisits: pick("homeVisits") === true,
      emergencyConsultation: pick("emergencyConsultation") === true,
      consultationDuration: fieldText(pick("consultationDuration")) || "30",
      maxPatientsPerDay: "",
      bookingAdvanceDays: "30",
    },
    availability,
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

function formatAvailabilityPayload(
  availability: DoctorProfileFormState["availability"],
): Record<string, { start: string; end: string }[]> {
  const formattedAvailability: Record<string, { start: string; end: string }[]> = {};
  Object.entries(availability).forEach(([day, schedule]) => {
    if (schedule.available && schedule.startTime && schedule.endTime) {
      formattedAvailability[day] = [
        {
          start: schedule.startTime,
          end: schedule.endTime,
        },
      ];
    } else {
      formattedAvailability[day] = [];
    }
  });
  return formattedAvailability;
}

function normalizePhone(phone: string | undefined | null): string | undefined {
  if (!phone?.trim()) return undefined;
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return undefined;
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
}

function omitEmpty(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function DoctorProfileContent({
  user,
  userProfile,
  isLoading,
  updateProfileMutation,
  reviews = NO_REVIEWS,
  loadFailed = false,
  onRetryLoad,
}: DoctorProfileContentProps) {
  const [profileData, setProfileData] = useState(() =>
    createInitialProfileData(user, userProfile),
  );
  const { tab: activeTab, setTab: handleTabChange } = useHashTab({
    tabs: PROFILE_TABS,
    defaultValue: "personal",
    aliases: { availibility: "availability" },
  });
  const profileSnapshotRef = useRef(
    String((userProfile as { updatedAt?: string } | null | undefined)?.updatedAt || ""),
  );
  const hasHydratedRef = useRef(false);

  // Keep local form in sync when profile first loads / changes from server,
  // but never remount tabs after a save.
  useEffect(() => {
    const updatedAt = String(
      (userProfile as { updatedAt?: string } | null | undefined)?.updatedAt || "",
    );
    if (!userProfile) return;

    // First successful profile load
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      profileSnapshotRef.current = updatedAt;
      setProfileData(createInitialProfileData(user, userProfile));
      return;
    }

    // Ignore refetch after our own save (same or newer updatedAt while editing)
    if (updatedAt && updatedAt === profileSnapshotRef.current) return;

    // Only sync non-availability personal fields if user is on personal-ish tabs
    // and snapshot actually changed from another source.
    profileSnapshotRef.current = updatedAt;
    setProfileData((prev) => {
      const incoming = createInitialProfileData(user, userProfile);
      // Preserve in-progress availability edits if currently on availability tab
      if (activeTab === "availability") {
        return {
          ...incoming,
          availability: prev.availability,
        };
      }
      return incoming;
    });
  }, [user, userProfile, activeTab]);

  const stats: DoctorProfileStats = useMemo(
    () => ({
      specializations: profileData.professionalInfo.specializations.length,
      certifications: profileData.professionalInfo.certifications.length,
      languagesSpoken: profileData.professionalInfo.languagesSpoken.length,
    }),
    [
      profileData.professionalInfo.certifications.length,
      profileData.professionalInfo.languagesSpoken.length,
      profileData.professionalInfo.specializations.length,
    ],
  );

  const photoUrl =
    fieldText((userProfile as Record<string, unknown> | null | undefined)?.profilePicture) ||
    fieldText(user?.profilePicture) ||
    undefined;

  const buildSavePayload = (data: DoctorProfileFormState) => {
    const { personalInfo, availability, professionalInfo } = data;
    return {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      ...(normalizePhone(personalInfo.phone)
        ? { phone: normalizePhone(personalInfo.phone) }
        : {}),
      ...(omitEmpty(personalInfo.dateOfBirth)
        ? { dateOfBirth: omitEmpty(personalInfo.dateOfBirth) }
        : {}),
      gender: personalInfo.gender ? personalInfo.gender.toUpperCase() : undefined,
      ...(omitEmpty(personalInfo.address) ? { address: omitEmpty(personalInfo.address) } : {}),
      ...(omitEmpty(personalInfo.city) ? { city: omitEmpty(personalInfo.city) } : {}),
      ...(omitEmpty(personalInfo.state) ? { state: omitEmpty(personalInfo.state) } : {}),
      ...(omitEmpty(personalInfo.country) ? { country: omitEmpty(personalInfo.country) } : {}),
      ...(omitEmpty(personalInfo.zipCode) ? { zipCode: omitEmpty(personalInfo.zipCode) } : {}),
      ...(professionalInfo.specializations[0]
        ? { specialization: professionalInfo.specializations[0] }
        : {}),
      ...(professionalInfo.experience
        ? { experience: parseInt(professionalInfo.experience, 10) || undefined }
        : {}),
      availability: formatAvailabilityPayload(availability),
    };
  };

  /** The fields that live on the doctor record, not the user: fee, education, certifications, languages. */
  const buildDoctorRecordPayload = (data: DoctorProfileFormState) => {
    const { professionalInfo, consultationSettings } = data;
    const fee = Number(consultationSettings.consultationFee);
    const education = professionalInfo.education
      .map((entry) =>
        [entry.degree, entry.institution, entry.year]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(", "),
      )
      .filter(Boolean)
      .join("; ");
    return {
      ...(Number.isFinite(fee) && fee > 0 ? { consultationFee: fee } : {}),
      ...(education ? { education } : {}),
      certifications: professionalInfo.certifications.map((line) => line.trim()).filter(Boolean),
      languages: professionalInfo.languagesSpoken.map((line) => line.trim()).filter(Boolean),
    };
  };

  const persistProfile = async (
    data: DoctorProfileFormState,
    options?: { stayOnTab?: ProfileTab; successMessage?: string },
  ): Promise<boolean> => {
    const tabBeforeSave = options?.stayOnTab || activeTab;
    try {
      const payload = buildSavePayload(data);
      const result = await updateProfileMutation.mutateAsync(payload);
      if (!result.success) {
        showErrorToast(result.error || "Failed to save", {
          id: TOAST_IDS.GLOBAL.ERROR,
        });
        return false;
      }

      // The user-profile route does not store these; they are saved on the doctor record.
      if (user?.id) {
        const doctorResult = await updateDoctorProfile(user.id, buildDoctorRecordPayload(data));
        if (!doctorResult.success) {
          showErrorToast(doctorResult.error || "Saved, but fees and credentials were not", {
            id: TOAST_IDS.GLOBAL.ERROR,
          });
          return false;
        }
      }

      const responseUser =
        result.user && typeof result.user === "object"
          ? (result.user as Record<string, unknown>)
          : undefined;
      const savedAvailability = responseUser?.availability ?? payload.availability;
      const nextForm = {
        ...data,
        availability: createInitialProfileData(undefined, {
          ...(responseUser || {}),
          availability: savedAvailability,
        }).availability,
      };
      profileSnapshotRef.current = String(
        responseUser?.updatedAt || new Date().toISOString(),
      );
      setProfileData(nextForm);

      // Keep current tab after save (do not jump to personal)
      handleTabChange(tabBeforeSave);

      showSuccessToast(options?.successMessage || "Profile saved successfully", {
        id: TOAST_IDS.GLOBAL.SUCCESS,
      });
      return true;
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to save profile",
        { id: TOAST_IDS.GLOBAL.ERROR },
      );
      return false;
    }
  };

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

  const updateAvailability = (day: string, field: string, value: unknown) => {
    setProfileData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...(prev.availability[
            day as keyof typeof prev.availability
          ] as DoctorProfileAvailabilityDay),
          [field]: value,
        } as DoctorProfileAvailabilityDay,
      },
    }));
  };

  const handleSaveProfile = async () => {
    await persistProfile(profileData, { stayOnTab: activeTab });
  };

  const handleSaveAvailability = async () => {
    await persistProfile(profileData, {
      stayOnTab: "availability",
      successMessage: "Availability saved successfully",
    });
  };

  const headerActions = (
    <Button
      size="md"
      onClick={handleSaveProfile}
      disabled={updateProfileMutation.isPending || isLoading}
      type="button"
    >
      {updateProfileMutation.isPending ? <LoaderIcon /> : <Save aria-hidden="true" />}
      Save Changes
    </Button>
  );

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Account"
        title="Doctor Profile"
        description="Update your profile details. Use Save Changes on each section — your current tab stays open."
        actions={headerActions}
      />

      {loadFailed ? (
        <Note tone="rose" icon={CircleAlert}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span role="alert">Your profile could not be loaded. Some fields may be empty.</span>
            {onRetryLoad ? (
              <Button variant="outline" size="sm" onClick={onRetryLoad}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            ) : null}
          </div>
        </Note>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="order-2 min-w-0 gap-5 lg:order-1"
        >
          <TabsList aria-label="Profile sections">
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
              phoneVerified={
                (userProfile as Record<string, unknown>)?.phoneVerified as boolean | undefined
              }
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
              onSave={handleSaveAvailability}
              isSaving={updateProfileMutation.isPending || isLoading}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <DoctorProfileReviewsTab {...reviews} />
          </TabsContent>
        </Tabs>

        <div className="order-1 min-w-0 lg:order-2">
          <DoctorProfileOverviewCard profileData={profileData} stats={stats} photoUrl={photoUrl} />
        </div>
      </div>
    </DashboardPageShell>
  );
}

function LoaderIcon() {
  return <Loader2 className="size-4 animate-spin" aria-hidden="true" />;
}
