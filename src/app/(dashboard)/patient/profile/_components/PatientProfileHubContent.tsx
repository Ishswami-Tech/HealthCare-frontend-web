"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import { useMyFamilyMembers } from "@/hooks/query/useMyFamilyMembers";
import { useNotificationPreferences } from "@/hooks/query/useNotificationPreferences";
import { useUserProfile } from "@/hooks/query/useUsers";
import { APP_CONFIG } from "@/lib/config/config";
import { useLanguage } from "@/lib/i18n/context";
import {
  asList,
  asRecord,
  buildPrescriptions,
  buildReportRows,
} from "@/app/(dashboard)/patient/health/_components/patient-health.logic";
import { usePatientUploads } from "@/app/(dashboard)/patient/health/_components/usePatientUploads";
import { PatientProfileHubView, type ProfileHubStat } from "./PatientProfileHubView";
import {
  countCompletedVisits,
  legacyProfileTabRoute,
  notificationChannelSummary,
  patientDisplayName,
  readPatientProfileMeta,
  toPatientProfileForm,
} from "./patient-profile.logic";

/** Data for the profile hub: the profile, three counts, and the log-out flow. The layout is `PatientProfileHubView`. */
export function PatientProfileHubContent() {
  const router = useRouter();
  const { session, logoutAsync, isLoggingOut } = useAuth();
  const user = session?.user;
  const userId = user?.id || "";
  const clinicId = useCurrentClinicId();
  const { language, supportedLanguages } = useLanguage();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Old links pointed at tabs of this page (`/patient/profile#preferences`, `?tab=personal`).
  useEffect(() => {
    const target = legacyProfileTabRoute(window.location.hash, window.location.search);
    if (!target) return;
    setRedirecting(true);
    router.replace(target);
  }, [router]);

  const { data: userProfile, isPending, isFetching, error, refetch } = useUserProfile();
  const appointments = useMyAppointments(clinicId ? { clinicId } : undefined);
  const health = useComprehensiveHealthRecord(userId);
  const uploads = usePatientUploads(user?.clinicId || "", userId);
  const family = useMyFamilyMembers(clinicId, { enabled: !!clinicId && !!userId });
  const preferences = useNotificationPreferences();

  const form = toPatientProfileForm(userProfile, user);
  const meta = readPatientProfileMeta(userProfile);

  const reportCount = useMemo(() => {
    if (health.data === undefined) return null;
    const record = asRecord(health.data);
    return buildReportRows({
      labReports: record.labReports,
      radiologyReports: record.radiologyReports,
      uploads: [...asList(record.documents), ...asList(uploads.data)],
      prescriptions: buildPrescriptions(record.prescriptions),
      userId,
    }).length;
  }, [health.data, uploads.data, userId]);

  const stats: ProfileHubStat[] = [
    {
      key: "consultations",
      label: "Consultations",
      value: appointments.error ? null : countCompletedVisits(appointments.data),
      loading: appointments.isPending && !appointments.error && !!userId,
      href: "/patient/appointments",
    },
    {
      key: "reports",
      label: "Reports",
      value: reportCount,
      loading: health.isPending && !health.error && !!userId,
      href: "/patient/health/reports",
    },
    {
      key: "family",
      label: "Family",
      value: Array.isArray(family.data) ? family.data.length : null,
      loading: family.isPending && !family.error && !!clinicId && !!userId,
      href: "/patient/family",
    },
  ];

  const handleLogout = async () => {
    try {
      // The shared log-out flow clears the session, the cached data and sends the patient to the sign-in page.
      await logoutAsync();
    } catch {
      // `useAuth` already signs the patient out locally and shows the message.
    }
  };

  return (
    <PatientProfileHubView
      name={patientDisplayName(form) || String(user?.name || "")}
      phone={form.phone}
      email={form.email}
      photoUrl={meta.photoUrl}
      phoneVerified={meta.phoneVerified}
      loading={redirecting || (isPending && isFetching && !userProfile)}
      loadError={userProfile || !error ? null : error.message || "Please try again."}
      onRetry={() => void refetch()}
      stats={stats}
      languageLabel={supportedLanguages[language]?.nativeName ?? "English"}
      notificationsLabel={notificationChannelSummary(preferences.data)}
      appVersion={APP_CONFIG.APP.VERSION}
      logoutOpen={logoutOpen}
      onLogoutOpenChange={setLogoutOpen}
      onLogout={() => void handleLogout()}
      loggingOut={isLoggingOut}
    />
  );
}
