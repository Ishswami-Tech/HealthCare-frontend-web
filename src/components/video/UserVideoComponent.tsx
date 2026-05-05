"use client";

import { useEffect, useRef, useState } from 'react';
import { MicOff, User, Hand } from 'lucide-react';
import { getRandomVideoTileTone } from '@/lib/config/color-palette';

interface UserVideoComponentProps {
  streamManager: any; // OpenVidu StreamManager (Publisher or Subscriber)
  isLocal?: boolean;
  isHandRaised?: boolean;
}

export const UserVideoComponent = ({ 
  streamManager, 
  isLocal = false,
  isHandRaised = false,
}: UserVideoComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isVideoActive, setIsVideoActive] = useState(() => !!streamManager?.stream?.videoActive);
  const [isAudioActive, setIsAudioActive] = useState(() => !!streamManager?.stream?.audioActive);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [videoTileTone] = useState(() => getRandomVideoTileTone());

  useEffect(() => {
    if (!streamManager) return;
    
    // Initial state
    setIsVideoActive(!!streamManager.stream?.videoActive);
    setIsAudioActive(!!streamManager.stream?.audioActive);

    // Event handler for stream property changes
    const handleStreamPropertyChanged = (event: any) => {
      if (event.changedProperty === 'videoActive') {
        setIsVideoActive(event.newValue);
      } else if (event.changedProperty === 'audioActive') {
        setIsAudioActive(event.newValue);
      }
    };

    const handleStartSpeaking = () => setIsSpeaking(true);
    const handleStopSpeaking = () => setIsSpeaking(false);

    streamManager.on('streamPropertyChanged', handleStreamPropertyChanged);
    streamManager.on('publisherStartSpeaking', handleStartSpeaking);
    streamManager.on('publisherStopSpeaking', handleStopSpeaking);

    return () => {
      streamManager.off('streamPropertyChanged', handleStreamPropertyChanged);
      streamManager.off('publisherStartSpeaking', handleStartSpeaking);
      streamManager.off('publisherStopSpeaking', handleStopSpeaking);
    };
  }, [streamManager]);

  // Always attach the video element when the stream manager is ready.
  const getNicknameTag = () => {
    const fallbackName = isLocal ? 'You' : 'Unknown';

    try {
      const dataStr = String(streamManager?.stream?.connection?.data || '').trim();
      if (!dataStr) return fallbackName;

      const cleanName = (value: unknown) => {
        const raw = String(value || '').trim();
        if (!raw) return '';
        return raw.replace(/\s*\(You\)\s*$/i, '').trim();
      };

      const extractFromObject = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'string') return cleanName(value);
        if (typeof value !== 'object') return '';

        const nestedClientData = value.clientData;
        if (nestedClientData) {
          const nested =
            typeof nestedClientData === 'string'
              ? (() => {
                  try {
                    return JSON.parse(nestedClientData);
                  } catch {
                    return nestedClientData;
                  }
                })()
              : nestedClientData;

          const nestedName =
            cleanName(nested?.displayName) ||
            cleanName(nested?.userName) ||
            cleanName(nested?.name) ||
            cleanName(nested?.fullName);
          if (nestedName) return nestedName;
        }

        return (
          cleanName(value.displayName) ||
          cleanName(value.userName) ||
          cleanName(value.name) ||
          cleanName(value.fullName) ||
          ''
        );
      };

      const parts = dataStr.split('%/%');
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          const name = extractFromObject(parsed);
          if (name) return name;
        } catch {
          const direct = cleanName(trimmed);
          if (direct && !direct.startsWith('{')) {
            return direct;
          }
        }
      }

      return fallbackName;
    } catch {
      return fallbackName;
    }
  };

  useEffect(() => {
    if (!streamManager || !videoRef.current) return;

    streamManager.addVideoElement(videoRef.current);
    
    // Forced refresh if black screen persists
    const timer = setTimeout(() => {
      if (videoRef.current && streamManager) {
        streamManager.addVideoElement(videoRef.current);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [streamManager, videoRef.current]);

  if (!streamManager) return null;

  const nickname = getNicknameTag();

  return (
    <div className={`relative w-full h-full bg-card text-foreground rounded-xl overflow-hidden group transition-all duration-300 border-2 dark:bg-meet-black dark:text-white ${isSpeaking ? 'border-meet-blue shadow-[0_0_15px_rgba(138,180,248,0.25)] scale-[0.99]' : 'border-border shadow-md dark:border-transparent'}`}>
      <div className={`absolute inset-0 ${videoTileTone.backgroundClass} transition-opacity duration-500 ${isVideoActive ? 'opacity-0' : 'opacity-100'}`} />
      {/* Video element always rendered; keep the frame crisp so the face stays visible. */}
      <div className="relative z-10 w-full h-full transition-all duration-300">
        <video
          autoPlay={true}
          playsInline={true}
          ref={videoRef}
          muted={isLocal}
          className={`relative z-10 w-full h-full object-cover transition-opacity duration-500 ${isVideoActive ? 'opacity-100 block' : 'opacity-0 hidden'}`}
        />
      </div>
      {/* Camera-off placeholder shown when video is inactive */}
      {!isVideoActive && (
        <div className={`absolute inset-0 z-20 flex h-full w-full items-center justify-center ${videoTileTone.backgroundClass}`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`relative h-28 w-28 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center mb-2 shadow-2xl border-4 transition-all duration-500 ${isSpeaking ? 'border-white/50 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-white/15'}`}>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 shadow-inner ring-1 ring-white/20">
                <User className={`h-8 w-8 ${videoTileTone.textClass} drop-shadow-md`} strokeWidth={1.8} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <span className={`text-sm font-medium ${videoTileTone.textClass === 'text-meet-black' ? 'text-meet-black/90' : 'text-white/90'} drop-shadow-sm`}>{nickname}</span>
              <div className={`rounded-full bg-white/10 backdrop-blur-md px-4 py-1 text-[9px] font-bold uppercase tracking-[0.2em] border border-white/10 ${videoTileTone.textClass === 'text-meet-black' ? 'text-meet-black/80' : 'text-white/80'}`}>
                Camera Off
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Name Tag */}
      <div className="absolute bottom-4 left-4 z-30 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-foreground text-xs font-semibold flex items-center gap-2 shadow-xl border border-border group-hover:bg-background/90 transition-colors dark:bg-meet-black/80 dark:text-white dark:border-white/10 dark:group-hover:bg-meet-black">
        <div className={`w-1.5 h-1.5 rounded-full ${isAudioActive ? (isSpeaking ? 'bg-[#8ab4f8] animate-pulse' : 'bg-emerald-500') : 'bg-red-500'}`} />
        <span className="truncate max-w-[120px]">{nickname}</span>
        {isLocal && <span className="text-[10px] opacity-50 font-normal">(You)</span>}
      </div>

      {/* Audio Status Overlay (if muted) - Top Right */}
      {!isAudioActive && (
        <div className="absolute top-4 right-4 z-30 bg-background/90 p-2 rounded-full shadow-2xl backdrop-blur-md border border-border dark:bg-meet-black/90 dark:border-white/10">
          <MicOff className="w-3.5 h-3.5 text-meet-red" />
        </div>
      )}

      {/* Hand Raised Indicator */}
      {isHandRaised && (
        <div className="absolute top-4 left-4 z-30 bg-[#fbbc04] p-2 rounded-full shadow-2xl animate-in zoom-in-50 duration-300">
          <Hand className="w-4 h-4 text-meet-black fill-current" />
        </div>
      )}

      {/* Speaking Animation Overlay */}
      {isSpeaking && isAudioActive && !isHandRaised && (
        <div className="absolute top-4 left-4 z-30 flex gap-1 items-center">
          <div className="w-1 h-3 bg-[#8ab4f8] animate-[bounce_0.6s_ease-in-out_infinite]" />
          <div className="w-1 h-5 bg-[#8ab4f8] animate-[bounce_0.8s_ease-in-out_infinite]" />
          <div className="w-1 h-3 bg-[#8ab4f8] animate-[bounce_0.6s_ease-in-out_infinite_0.2s]" />
        </div>
      )}
    </div>
  );
};
