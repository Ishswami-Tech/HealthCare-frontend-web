"use client";

import React from "react";
import { UserVideoComponent } from "@/components/video/UserVideoComponent";

interface GridLayoutProps {
  publisher: any; // OpenVidu Publisher
  subscribers: any[]; // OpenVidu Subscribers
  isHandRaised?: boolean;
  raisedHands?: Set<string>;
  isBlurred?: boolean;
}

export function GridLayout({ 
  publisher, 
  subscribers,
  isHandRaised = false,
  raisedHands = new Set(),
  isBlurred = false,
}: GridLayoutProps) {
  const allParticipants = [];
  
  if (publisher) {
    allParticipants.push({ streamManager: publisher, isLocal: true });
  }
  
  subscribers.forEach(sub => {
    allParticipants.push({ streamManager: sub, isLocal: false });
  });

  const count = allParticipants.length;
  
  // Determine grid columns based on count
  let gridClass = "grid-cols-1";
  if (count === 2) gridClass = "grid-cols-1 sm:grid-cols-2";
  else if (count === 3 || count === 4) gridClass = "grid-cols-2";
  else if (count >= 5 && count <= 6) gridClass = "grid-cols-2 sm:grid-cols-3";
  else if (count >= 7 && count <= 9) gridClass = "grid-cols-3";
  else if (count >= 10) gridClass = "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5";

  return (
    <div className={`w-full h-full p-4 grid gap-4 ${gridClass} auto-rows-fr`}>
      {allParticipants.map((participant, index) => {
        const connectionId = participant.streamManager?.stream?.connection?.connectionId;
        const key = connectionId || `participant-${index}`;
        const handRaised = participant.isLocal 
          ? isHandRaised 
          : (connectionId ? raisedHands.has(connectionId) : false);

        return (
          <div key={key} className="w-full h-full flex items-center justify-center">
            <UserVideoComponent 
              streamManager={participant.streamManager} 
              isLocal={participant.isLocal} 
              isHandRaised={handRaised}
              isBlurred={participant.isLocal ? isBlurred : false}
            />
          </div>
        );
      })}
    </div>
  );
}
