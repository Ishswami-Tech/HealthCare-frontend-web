"use client";

import React from "react";
import { UserVideoComponent } from "@/components/video/UserVideoComponent";

interface SpeakerLayoutProps {
  publisher: any; // OpenVidu Publisher
  subscribers: any[]; // OpenVidu Subscribers
  isHandRaised?: boolean;
  raisedHands?: Set<string>;
  isBlurred?: boolean;
}

export function SpeakerLayout({ 
  publisher, 
  subscribers,
  isHandRaised = false,
  raisedHands = new Set(),
  isBlurred = false,
}: SpeakerLayoutProps) {
  const allParticipants: { streamManager: any; isLocal: boolean }[] = [];
  
  if (publisher) {
    allParticipants.push({ streamManager: publisher, isLocal: true });
  }
  
  subscribers.forEach(sub => {
    allParticipants.push({ streamManager: sub, isLocal: false });
  });

  if (allParticipants.length === 0) {
    return <div className="w-full h-full bg-[var(--color-meet-black)]"></div>;
  }

  // Find the active speaker or someone with screen share.
  // For now, we will pick the first subscriber as the main speaker, or publisher if alone.
  const mainParticipant = (allParticipants.length > 1 
    ? allParticipants.find(p => !p.isLocal) || allParticipants[0]
    : allParticipants[0])!;

  const others = allParticipants.filter(p => p !== mainParticipant);

  return (
    <div className="w-full h-full flex flex-col md:flex-row p-4 gap-4">
      {/* Main Speaker Area */}
      <div className="flex-1 w-full h-full flex items-center justify-center min-h-[50vh]">
        <div className="w-full h-full max-h-full">
          {mainParticipant && (
            <UserVideoComponent 
              streamManager={mainParticipant.streamManager} 
              isLocal={mainParticipant.isLocal} 
              isHandRaised={
                mainParticipant.isLocal 
                  ? isHandRaised 
                  : raisedHands.has(mainParticipant.streamManager?.stream?.connection?.connectionId)
              }
              isBlurred={mainParticipant.isLocal ? isBlurred : false}
            />
          )}
        </div>
      </div>

      {/* Others Strip */}
      {others.length > 0 && (
        <div className="md:w-64 w-full h-40 md:h-full flex md:flex-col flex-row gap-4 overflow-auto snap-x md:snap-y snap-mandatory shrink-0">
          {others.map((participant, index) => {
            const key = participant.streamManager?.stream?.connection?.connectionId || `participant-${index}`;
            return (
              <div key={key} className="w-40 md:w-full h-full md:h-40 shrink-0 snap-center">
                <UserVideoComponent 
                  streamManager={participant.streamManager} 
                  isLocal={participant.isLocal} 
                  isHandRaised={
                    participant.isLocal 
                      ? isHandRaised 
                      : raisedHands.has(participant.streamManager?.stream?.connection?.connectionId)
                  }
                  isBlurred={participant.isLocal ? isBlurred : false}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
