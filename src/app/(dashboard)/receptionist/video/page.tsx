"use client";

import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";

export default function ReceptionistVideoPage() {
  return (
    
      <VideoAppointmentsList
        title="Video Consultations"
        description="View video consultation appointments"
        showStatistics={false}
        showClinicFilter={false}
        showJoinButton={false}
        showEndButton={false}
        showDownloadButton={false}
        limit={100}
      />
    
  );
}
