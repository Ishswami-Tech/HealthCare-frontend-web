"use client";

import React from "react";
import VideoAppointmentRoom from "@/components/video/meet-ui/VideoAppointmentRoom";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";

type VideoAppointmentMeetRoomProps = {
  appointment: VideoAppointment;
  onLeaveRoom?: () => void;
  startWithAudioEnabled?: boolean;
  startWithVideoEnabled?: boolean;
  initialMediaStream?: MediaStream | null;
};

export function VideoAppointmentMeetRoom({
  appointment,
  onLeaveRoom,
  startWithAudioEnabled = true,
  startWithVideoEnabled = true,
  initialMediaStream = null,
}: VideoAppointmentMeetRoomProps) {
  return (
    <div className="meet-room fixed inset-0 z-50 min-h-svh w-full overflow-hidden bg-background text-foreground dark:bg-meet-black dark:text-white">
      <VideoAppointmentRoom
        appointment={appointment}
        startWithAudioEnabled={startWithAudioEnabled}
        startWithVideoEnabled={startWithVideoEnabled}
        initialMediaStream={initialMediaStream}
        {...(onLeaveRoom ? { onLeaveRoom } : {})}
      />
    </div>
  );
}
