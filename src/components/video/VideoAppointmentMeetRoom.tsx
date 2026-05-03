"use client";

import React from "react";
import GoogleMeetVideoRoom from "@/components/video/meet-ui/GoogleMeetVideoRoom";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";

type VideoAppointmentMeetRoomProps = {
  appointment: VideoAppointment;
  onLeaveRoom?: () => void;
  autoStart?: boolean;
  startWithAudioEnabled?: boolean;
  startWithVideoEnabled?: boolean;
  startWithAudioSource?: string | undefined;
  startWithVideoSource?: string | undefined;
};

export function VideoAppointmentMeetRoom({
  appointment,
  onLeaveRoom,
  autoStart = true,
  startWithAudioEnabled = true,
  startWithVideoEnabled = true,
  startWithAudioSource,
  startWithVideoSource,
}: VideoAppointmentMeetRoomProps) {
  return (
    <div className="meet-room fixed inset-0 z-50 min-h-[100svh] w-full overflow-hidden bg-[var(--color-meet-black)] text-white">
      <GoogleMeetVideoRoom
        appointment={appointment}
        autoStart={autoStart}
        startWithAudioEnabled={startWithAudioEnabled}
        startWithVideoEnabled={startWithVideoEnabled}
        startWithAudioSource={startWithAudioSource}
        startWithVideoSource={startWithVideoSource}
        {...(onLeaveRoom ? { onLeaveRoom } : {})}
      />
    </div>
  );
}
