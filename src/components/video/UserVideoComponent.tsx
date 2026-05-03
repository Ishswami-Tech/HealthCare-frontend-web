"use client";

import { useEffect, useRef, useState } from 'react';
import { MicOff, User, Hand } from 'lucide-react';

interface UserVideoComponentProps {
  streamManager: any; // OpenVidu StreamManager (Publisher or Subscriber)
  isLocal?: boolean;
  isHandRaised?: boolean;
  isBlurred?: boolean;
}

export const UserVideoComponent = ({ 
  streamManager, 
  isLocal = false,
  isHandRaised = false,
  isBlurred = false,
}: UserVideoComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isVideoActive, setIsVideoActive] = useState(() => !!streamManager?.stream?.videoActive);
  const [isAudioActive, setIsAudioActive] = useState(() => !!streamManager?.stream?.audioActive);

  const [isSpeaking, setIsSpeaking] = useState(false);

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
    try {
      const dataStr = streamManager?.stream?.connection?.data;
      if (!dataStr) return isLocal ? 'You' : 'Unknown';
      
      // OpenVidu connection data can be multipart separated by %/%
      const parts = dataStr.split('%/%');
      let displayName = null;
      let role = null;

      for (const part of parts) {
        try {
          const parsed = JSON.parse(part);
          
          // Check for nested clientData (often double-escaped JSON)
          if (parsed.clientData) {
            try {
              const clientData = typeof parsed.clientData === 'string' 
                ? JSON.parse(parsed.clientData) 
                : parsed.clientData;
              displayName = displayName || clientData.displayName || clientData.userName;
              role = role || clientData.role || clientData.userRole;
            } catch (innerErr) {
              // Not JSON or already an object
              displayName = displayName || parsed.clientData.displayName || parsed.clientData;
            }
          }
          
          displayName = displayName || parsed.displayName || parsed.userName;
          role = role || parsed.role || parsed.userRole;
        } catch (e) {
          // If not JSON, use as fallback if no name found yet
          if (!displayName && part.length > 2 && !part.startsWith('{')) {
            displayName = part;
          }
        }
      }
      
      const finalName = displayName || (isLocal ? 'You' : 'Unknown');
      return isLocal && !finalName.includes('(You)') ? `${finalName} (You)` : finalName;
    } catch (err) {
      return isLocal ? 'You' : 'Unknown';
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

  const getInitials = (name: string) => {
    if (!name || name === 'Unknown') return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const firstInitial = parts[0]?.charAt(0) || '';
      const lastInitial = parts[parts.length - 1]?.charAt(0) || '';
      return (firstInitial + lastInitial).toUpperCase();
    }
    return parts[0]?.charAt(0).toUpperCase() || "";
  };

  if (!streamManager) return null;

  const getGradientForUser = (name: string) => {
    const gradients = [
      'from-blue-600 to-indigo-800',
      'from-emerald-600 to-teal-800',
      'from-violet-600 to-purple-800',
      'from-rose-600 to-pink-800',
      'from-amber-600 to-orange-800',
      'from-cyan-600 to-blue-800',
    ];
    
    // Simple hash to pick a gradient
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const nickname = getNicknameTag();
  const userGradient = getGradientForUser(nickname);

  return (
    <div className={`relative w-full h-full bg-[#202124] rounded-xl overflow-hidden group transition-all duration-300 border-2 ${isSpeaking ? 'border-[#8ab4f8] shadow-[0_0_15px_rgba(138,180,248,0.4)] scale-[0.99]' : 'border-transparent shadow-md'}`}>
      {/* Video element always rendered; CSS toggles visibility based on videoActive */}
      <div className={`relative w-full h-full transition-all duration-700 ${isBlurred ? 'blur-xl scale-110' : 'blur-0 scale-100'}`}>
        <video
          autoPlay={true}
          playsInline={true}
          ref={videoRef}
          muted={isLocal}
          className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoActive ? 'opacity-100 block' : 'opacity-0 hidden'}`}
        />
        {/* Visual Effect Overlay for a more "premium" blur look */}
        {isBlurred && isVideoActive && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl pointer-events-none z-10" />
        )}
      </div>
      {/* Camera-off placeholder shown when video is inactive */}
      {!isVideoActive && (
        <div className={`absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br ${userGradient} text-white`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`relative h-28 w-28 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mb-2 shadow-2xl border-4 transition-all duration-500 ${isSpeaking ? 'border-white/40 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-white/10'}`}>
               <span className="text-4xl font-bold text-white tracking-wider drop-shadow-md">
                 {getInitials(nickname)}
               </span>
               {/* Small floating icon */}
               <div className="absolute -bottom-1 -right-1 bg-[#3c4043] p-2 rounded-full border-2 border-[#202124] shadow-lg">
                 <User className="w-4 h-4 text-gray-400" />
               </div>
            </div>
            <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <span className="text-sm font-medium text-white/90 drop-shadow-sm">{nickname}</span>
              <div className="rounded-full bg-white/5 backdrop-blur-md px-4 py-1 text-[9px] font-bold text-gray-400/80 uppercase tracking-[0.2em] border border-white/5">
                Camera Off
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Name Tag */}
      <div className="absolute bottom-4 left-4 bg-[#202124]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-2 shadow-xl border border-white/10 group-hover:bg-[#202124] transition-colors">
        <div className={`w-1.5 h-1.5 rounded-full ${isAudioActive ? (isSpeaking ? 'bg-[#8ab4f8] animate-pulse' : 'bg-emerald-500') : 'bg-red-500'}`} />
        <span className="truncate max-w-[120px]">{nickname}</span>
        {isLocal && <span className="text-[10px] opacity-50 font-normal">(You)</span>}
      </div>

      {/* Audio Status Overlay (if muted) - Top Right */}
      {!isAudioActive && (
        <div className="absolute top-4 right-4 bg-[#202124]/90 p-2 rounded-full shadow-2xl backdrop-blur-md border border-white/10">
          <MicOff className="w-3.5 h-3.5 text-[#ea4335]" />
        </div>
      )}

      {/* Hand Raised Indicator */}
      {isHandRaised && (
        <div className="absolute top-4 left-4 bg-[#fbbc04] p-2 rounded-full shadow-2xl animate-in zoom-in-50 duration-300">
          <Hand className="w-4 h-4 text-[#202124] fill-current" />
        </div>
      )}

      {/* Speaking Animation Overlay */}
      {isSpeaking && isAudioActive && !isHandRaised && (
        <div className="absolute top-4 left-4 flex gap-1 items-center">
          <div className="w-1 h-3 bg-[#8ab4f8] animate-[bounce_0.6s_ease-in-out_infinite]" />
          <div className="w-1 h-5 bg-[#8ab4f8] animate-[bounce_0.8s_ease-in-out_infinite]" />
          <div className="w-1 h-3 bg-[#8ab4f8] animate-[bounce_0.6s_ease-in-out_infinite_0.2s]" />
        </div>
      )}
    </div>
  );
};
