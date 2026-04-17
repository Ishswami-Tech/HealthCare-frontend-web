"use client";

import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";

export default function ClinicAdminVideoPage() {
  return (
    
      <VideoAppointmentsList
        title="Video Consultations Management"
        description="Monitor and manage all video consultations in your clinic"
        showStatistics={true}
        showClinicFilter={false}
        showJoinButton={false}
        showEndButton={true}
        showDownloadButton={true}
        limit={100}
      />
    
  );
}
