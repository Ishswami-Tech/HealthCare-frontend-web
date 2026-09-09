"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { ReceptionistProfileOverviewCard } from "./ReceptionistProfileOverviewCard";
import { ReceptionistProfilePersonalTab } from "./ReceptionistProfilePersonalTab";
import { ReceptionistProfileWorkTab } from "./ReceptionistProfileWorkTab";
import { ReceptionistProfilePerformanceTab } from "./ReceptionistProfilePerformanceTab";
import { ReceptionistProfilePreferencesTab } from "./ReceptionistProfilePreferencesTab";
import { ReceptionistProfileSecurityTab } from "./ReceptionistProfileSecurityTab";
import type { ReceptionistProfileFormState, ReceptionistProfileUser } from "./receptionist-profile.types";

function createInitialProfileData(user?: ReceptionistProfileUser): ReceptionistProfileFormState {
  return {
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
      maritalStatus: "",
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
      skills: [],
    },
    systemAccess: {
      canScheduleAppointments: false,
      canEditPatientInfo: false,
      canProcessPayments: false,
      canAccessReports: false,
      canManageInventory: false,
      systemRole: user?.role || "Receptionist",
      lastLogin: "",
    },
    preferences: {
      language: "English",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12-hour",
      theme: "Light",
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: true,
      appointmentAlerts: true,
      patientUpdates: true,
      systemUpdates: false,
      reminderNotifications: true,
    },
    vitals: {
      height: "—",
      weight: "—",
      bloodGroup: "—",
      bmi: "—",
      bloodPressure: "—",
    },
  };
}

import { useUserProfile } from "@/hooks/query/useUsers";

export default function ReceptionistProfileContent() {
  const { session } = useAuth();
  const user = session?.user;
  const { data: userProfile } = useUserProfile();

  const [profileData, setProfileData] = useState(() => createInitialProfileData(user));
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updatePersonalInfo = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const updatePreferences = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }));
  };

  const updateNotificationSettings = (field: string, value: boolean) => {
    setProfileData((prev) => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, [field]: value },
    }));
  };

  return (
    <div className="flex flex-col gap-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">My Profile</h1>
        <Button className="flex items-center gap-2" type="button">
          <Save className="size-4" />
          Save Changes
        </Button>
      </div>

      <ReceptionistProfileOverviewCard profileData={profileData} />

      <Tabs defaultValue="personal" className="flex flex-col gap-y-4">
        <div className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-5">
            <TabsTrigger className="px-3 text-[11px] sm:text-sm" value="personal">
              Personal
            </TabsTrigger>
            <TabsTrigger className="px-3 text-[11px] sm:text-sm" value="work">
              Work
            </TabsTrigger>
            <TabsTrigger className="px-3 text-[11px] sm:text-sm" value="performance">
              Performance
            </TabsTrigger>
            <TabsTrigger className="px-3 text-[11px] sm:text-sm" value="preferences">
              Preferences
            </TabsTrigger>
            <TabsTrigger className="px-3 text-[11px] sm:text-sm" value="security">
              Security
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal">
          <ReceptionistProfilePersonalTab
            profileData={profileData}
            updatePersonalInfo={updatePersonalInfo}
            phoneVerified={(userProfile as Record<string, unknown>)?.phoneVerified as boolean | undefined}
          />
        </TabsContent>

        <TabsContent value="work">
          <ReceptionistProfileWorkTab profileData={profileData} />
        </TabsContent>

        <TabsContent value="performance">
          <ReceptionistProfilePerformanceTab />
        </TabsContent>

        <TabsContent value="preferences">
          <ReceptionistProfilePreferencesTab
            profileData={profileData}
            updatePreferences={updatePreferences}
            updateNotificationSettings={updateNotificationSettings}
          />
        </TabsContent>

        <TabsContent value="security">
          <ReceptionistProfileSecurityTab
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
