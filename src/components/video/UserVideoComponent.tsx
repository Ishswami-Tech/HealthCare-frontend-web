"use client";

import { useEffect, useRef } from 'react';
import { User, MicOff } from 'lucide-react';

interface UserVideoComponentProps {
  streamManager: any; // OpenVidu StreamManager (Publisher or Subscriber)
  isLocal?: boolean;
}

export const UserVideoComponent = ({ streamManager, isLocal = false }: UserVideoComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideoActive = !!streamManager?.stream?.videoActive;

  useEffect(() => {
    if (streamManager && videoRef.current && isVideoActive) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [isVideoActive, streamManager]);

  const getNicknameTag = () => {
    try {
      if (!streamManager.stream.connection.data) return 'Unknown';
      return JSON.parse(streamManager.stream.connection.data).displayName;
    } catch (error) {
      return 'Unknown';
    }
  };

  if (!streamManager) return null;

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden group">
      {isVideoActive ? (
        <video
          autoPlay={true}
          ref={videoRef}
          muted={isLocal} // Always mute local video to prevent echo
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-950 text-white">
          <div className="flex flex-col items-center gap-3">
            <User className="h-12 w-12 text-white/70" />
            <div className="rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white/90">
              Camera off
            </div>
          </div>
        </div>
      )}
      
      {/* Name Tag */}
      <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2">
        <User className="w-3 h-3" />
        <span>{getNicknameTag()}</span>
        {isLocal && <span className="text-xs text-gray-300">(You)</span>}
      </div>

      {/* Audio Status Overlay (if muted) */}
      {!streamManager.stream.audioActive && (
        <div className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full">
          <MicOff className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};
