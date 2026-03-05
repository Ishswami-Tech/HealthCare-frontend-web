"use client";

import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";
import { useAuth } from "@/hooks/auth/useAuth";
import { Role } from "@/types/auth.types";

export default function DoctorVideoPage() {
  const { session } = useAuth();
  const userId = session?.user?.id || "";

  return (
    
      <VideoAppointmentsList
        title="Video Consultations"
        description="Manage and join video consultations with your patients"
        showStatistics={true}
        showJoinButton={true}
        showEndButton={true}
        showDownloadButton={true}
        limit={50}
        filters={{ doctorId: userId }}
      />
    
  );
}
