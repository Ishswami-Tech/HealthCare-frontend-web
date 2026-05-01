"use client";

import {
  DashboardPageHeader,
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";
import { useAuth } from "@/hooks/auth/useAuth";
import { Role } from "@/types/auth.types";

export default function VideoAppointmentsPage() {
  const { session } = useAuth();
  const role = (session?.user?.role as Role) ?? "";
  const userId = session?.user?.id || "";

  if (role === Role.PATIENT) {
    return (
      <DashboardPageShell>
        <DashboardPageHeader
          eyebrow="Dashboard"
          title="Video Appointments"
          description="Manage and join your scheduled video consultations"
        />
        <VideoAppointmentsList
          title=""
          description=""
          showStatistics={true}
          showClinicFilter={false}
          showJoinButton={true}
          showEndButton={false}
          showDownloadButton={false}
          limit={50}
          filters={{ patientId: userId }}
        />
      </DashboardPageShell>
    );
  }

  if (role === Role.DOCTOR || role === Role.ASSISTANT_DOCTOR) {
    return (
      <DashboardPageShell>
        <DashboardPageHeader
          eyebrow="Dashboard"
          title="Video Appointments"
          description="Manage and join your scheduled video consultations"
        />
        <VideoAppointmentsList
          title=""
          description=""
          showStatistics={true}
          showClinicFilter={false}
          showJoinButton={true}
          showEndButton={false}
          showDownloadButton={true}
          limit={50}
          filters={{ doctorId: userId }}
        />
      </DashboardPageShell>
    );
  }

  if (role === Role.RECEPTIONIST) {
    return (
      <DashboardPageShell>
        <DashboardPageHeader
          eyebrow="Dashboard"
          title="Video Appointments"
          description="View and join scheduled video consultations"
        />
        <VideoAppointmentsList
          title=""
          description=""
          showStatistics={false}
          showClinicFilter={false}
          showJoinButton={true}
          showEndButton={false}
          showDownloadButton={false}
          enforceTimeSlotWindow={true}
          limit={100}
        />
      </DashboardPageShell>
    );
  }

  if (role === Role.CLINIC_ADMIN) {
    return (
      <DashboardPageShell>
        <DashboardPageHeader
          eyebrow="Dashboard"
          title="Video Appointments"
          description="Monitor and manage clinic video consultations"
        />
        <VideoAppointmentsList
          title=""
          description=""
          showStatistics={true}
          showClinicFilter={false}
          showJoinButton={false}
          showEndButton={true}
          showDownloadButton={true}
          limit={100}
        />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Dashboard"
        title="Video Appointments"
        description="Manage and join video consultations"
      />
      <VideoAppointmentsList
        title=""
        description=""
        showStatistics={true}
        showClinicFilter={false}
        showJoinButton={true}
        showEndButton={false}
        showDownloadButton={true}
        limit={50}
      />
    </DashboardPageShell>
  );
}
