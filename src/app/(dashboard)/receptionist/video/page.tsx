"use client";

import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";

export default function ReceptionistVideoPage() {
  return (
    
      <VideoAppointmentsList
        title="Video Consultations"
        description="View and join video consultations during the scheduled time slot"
        showStatistics={false}
        showClinicFilter={false}
        showJoinButton={true}
        enforceTimeSlotWindow={true}
        showEndButton={false}
        showDownloadButton={false}
        limit={100}
      />
    
  );
}
