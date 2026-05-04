"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, 
  MessageSquare, Users, Info, MoreVertical, Disc, LayoutGrid,
  Hand, ChevronDown, Check, Volume2, Camera
} from "lucide-react";
import { Device } from "openvidu-browser";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MeetControlBarProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  showRecordingControl: boolean;
  isHandRaised?: boolean;
  isLocalSpeaking?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleHandRaise?: () => void;
  onToggleLayout: () => void;
  onEndCall: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleInfo: () => void;
  appointmentId: string;
  activePanel?: string;
  showSidePanel?: boolean;
  layout?: "grid" | "speaker";
  onGetDevices?: (() => Promise<Device[]>) | undefined;
  onChangeAudioDevice?: ((deviceId: string) => Promise<void>) | undefined;
  onChangeVideoDevice?: ((deviceId: string) => Promise<void>) | undefined;
  activeAudioDeviceId?: string | null | undefined;
  activeVideoDeviceId?: string | null | undefined;
}

export function MeetControlBar({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  isRecording,
  showRecordingControl,
  isHandRaised = false,
  isLocalSpeaking = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onToggleHandRaise,
  onToggleLayout,
  onEndCall,
  onToggleChat,
  onToggleParticipants,
  onToggleInfo,
  appointmentId,
  activePanel,
  showSidePanel,
  layout,
  onGetDevices,
  onChangeAudioDevice,
  onChangeVideoDevice,
  activeAudioDeviceId,
  activeVideoDeviceId,
}: MeetControlBarProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const audioMenuRef = useRef<HTMLDivElement>(null);
  const videoMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch devices when menus open
  useEffect(() => {
    if ((showAudioMenu || showVideoMenu) && onGetDevices) {
      onGetDevices().then(setDevices).catch(console.error);
    }
  }, [showAudioMenu, showVideoMenu, onGetDevices]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) setShowMoreMenu(false);
      if (audioMenuRef.current && !audioMenuRef.current.contains(target)) setShowAudioMenu(false);
      if (videoMenuRef.current && !videoMenuRef.current.contains(target)) setShowVideoMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const shortAppointmentId = appointmentId ? (appointmentId.length >= 10 
    ? appointmentId.substring(0, 3) + "-" + appointmentId.substring(3, 7) + "-" + appointmentId.substring(7, 10)
    : appointmentId) : "meet-session";

  return (
    <TooltipProvider>
      <div className="w-full h-20 bg-background text-foreground flex items-center justify-between px-4 relative border-t border-border shadow-[0_-1px_0_rgba(15,23,42,0.04)] dark:bg-[#202124] dark:text-white dark:border-white/5 dark:shadow-none">
        <div className="hidden sm:flex grow shrink basis-1/4 items-center justify-start text-sm truncate select-none">
          <span className="font-medium mr-3">{currentTime}</span>
          <span className="text-muted-foreground mr-3 dark:text-gray-400">|</span>
          <span className="font-medium truncate text-foreground dark:text-gray-200">{shortAppointmentId}</span>
        </div>

        <div className="flex grow shrink basis-1/2 items-center justify-center gap-3">
          <div className="relative" ref={audioMenuRef}>
            <div className={`flex items-center h-11 px-1 rounded-full transition-all duration-200 border ${isAudioMuted ? 'border-[#ea4335] bg-[#ea4335] text-white shadow-sm shadow-red-500/20 hover:bg-[#d93025] hover:border-[#d93025]' : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:border-[#5f6368] dark:bg-[#3c4043] dark:text-white dark:hover:bg-[#4a4d51]'}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={onToggleAudio} 
                    aria-pressed={!isAudioMuted}
                    className="flex items-center gap-2 pl-3 pr-1 h-full rounded-l-full group text-inherit"
                  >
                    {!isAudioMuted && isLocalSpeaking && (
                      <div className="flex items-end gap-[1.5px] h-4 mb-[2px]">
                        <motion.div animate={{ height: ["20%", "60%", "40%", "80%", "20%"] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-[2px] bg-blue-300 rounded-full" />
                        <motion.div animate={{ height: ["40%", "90%", "60%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-[2px] bg-blue-300 rounded-full" />
                        <motion.div animate={{ height: ["20%", "70%", "50%", "90%", "20%"] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }} className="w-[2px] bg-blue-300 rounded-full" />
                      </div>
                    )}
                    {isAudioMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-inherit" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
                  {isAudioMuted ? "Turn on microphone" : "Turn off microphone"}
                </TooltipContent>
              </Tooltip>
              <div className="w-[1px] h-5 bg-white/20 mx-1" />
              <button 
                className="h-full pr-3 pl-1 flex items-center justify-center rounded-r-full hover:bg-white/10 transition-colors text-inherit"
                onClick={() => setShowAudioMenu(!showAudioMenu)}
              >
                <ChevronDown size={14} className="text-inherit" />
              </button>
            </div>

            <AnimatePresence>
              {showAudioMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-14 left-0 bg-popover rounded-xl shadow-2xl overflow-hidden w-72 z-50 py-2 border border-border dark:bg-[#303134] dark:border-white/10"
                >
                  <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border flex items-center gap-2 dark:text-gray-400 dark:border-white/5">
                    <Volume2 size={12} />
                    Microphone
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {devices.filter(d => d.kind === 'audioinput').map((device) => (
                      <button
                        key={device.deviceId}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left dark:text-white dark:hover:bg-white/10"
                        onClick={() => { onChangeAudioDevice?.(device.deviceId); setShowAudioMenu(false); }}
                      >
                        <span className="truncate flex-1 pr-4">{device.label || `Microphone ${device.deviceId.slice(0, 5)}`}</span>
                        <Check size={16} className={`shrink-0 ${device.deviceId === activeAudioDeviceId ? 'text-blue-400' : 'text-transparent'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-border mt-1 dark:border-white/5">
                    <div className="w-full text-left text-xs text-muted-foreground font-medium py-1 dark:text-gray-400">
                      Use the list above to choose a microphone
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={videoMenuRef}>
            <div className={`flex items-center h-11 px-1 rounded-full transition-all duration-200 border ${isVideoMuted ? 'border-[#ea4335] bg-[#ea4335] text-white shadow-sm shadow-red-500/20 hover:bg-[#d93025] hover:border-[#d93025]' : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:border-[#5f6368] dark:bg-[#3c4043] dark:text-white dark:hover:bg-[#4a4d51]'}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={onToggleVideo} 
                    aria-pressed={!isVideoMuted}
                    className="flex items-center justify-center pl-3 pr-1 h-full rounded-l-full text-inherit"
                  >
                    {isVideoMuted ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-inherit" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
                  {isVideoMuted ? "Turn on camera" : "Turn off camera"}
                </TooltipContent>
              </Tooltip>
              <div className="w-[1px] h-5 bg-white/20 mx-1" />
              <button 
                className="h-full pr-3 pl-1 flex items-center justify-center rounded-r-full hover:bg-white/10 transition-colors text-inherit"
                onClick={() => setShowVideoMenu(!showVideoMenu)}
              >
                <ChevronDown size={14} className="text-inherit" />
              </button>
            </div>

            <AnimatePresence>
              {showVideoMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-14 left-0 bg-popover rounded-xl shadow-2xl overflow-hidden w-72 z-50 py-2 border border-border dark:bg-[#303134] dark:border-white/10"
                >
                  <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border flex items-center gap-2 dark:text-gray-400 dark:border-white/5">
                    <Camera size={12} />
                    Camera
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {devices.filter(d => d.kind === 'videoinput').map((device) => (
                      <button
                        key={device.deviceId}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left dark:text-white dark:hover:bg-white/10"
                        onClick={() => { onChangeVideoDevice?.(device.deviceId); setShowVideoMenu(false); }}
                      >
                        <span className="truncate flex-1 pr-4">{device.label || `Camera ${device.deviceId.slice(0, 5)}`}</span>
                        <Check size={16} className={`shrink-0 ${device.deviceId === activeVideoDeviceId ? 'text-blue-400' : 'text-transparent'}`} />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onToggleScreenShare} 
                className={`meet-control-button hidden sm:flex ${isScreenSharing ? 'meet-control-button-blue' : 'meet-control-button-active'}`}
                aria-pressed={isScreenSharing}
              >
                <MonitorUp size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
              {isScreenSharing ? "You are presenting" : "Share screen"}
            </TooltipContent>
          </Tooltip>

          {showRecordingControl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onToggleRecording} 
                  className={`meet-control-button hidden sm:flex ${isRecording ? 'meet-control-button-danger animate-pulse' : 'meet-control-button-active'}`}
                  aria-pressed={isRecording}
                >
                  <Disc size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
                {isRecording ? "Stop recording" : "Start recording"}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onToggleHandRaise} 
                  className={`meet-control-button hidden sm:flex ${isHandRaised ? 'meet-control-button-blue' : 'meet-control-button-active'}`}
                  aria-pressed={isHandRaised}
                >
                  <Hand size={20} className={isHandRaised ? 'fill-current' : ''} />
                </button>
              </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
              {isHandRaised ? "Lower hand" : "Raise hand"}
            </TooltipContent>
          </Tooltip>

          <div className="relative hidden sm:block" ref={moreMenuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`meet-control-button meet-control-button-active ${showMoreMenu ? 'meet-info-button-active' : ''}`}
                  onClick={() => setShowMoreMenu(v => !v)}
                >
                  <MoreVertical size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#3c4043] text-white border-none text-xs">
                More options
              </TooltipContent>
            </Tooltip>

            {showMoreMenu && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-popover rounded-lg shadow-xl overflow-hidden w-64 z-50 py-1 border border-border animate-in fade-in slide-in-from-bottom-2 duration-200 dark:bg-[#303134] dark:border-white/10">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors dark:text-white dark:hover:bg-white/10"
                  onClick={() => { onToggleLayout(); setShowMoreMenu(false); }}
                >
                  <LayoutGrid size={18} className={layout === 'grid' ? 'text-[var(--color-meet-blue)]' : 'text-muted-foreground'} />
                  <div className="flex flex-col items-start">
                    <span>Change layout</span>
                    <span className="text-[10px] text-muted-foreground dark:text-gray-400">Currently: {layout === 'grid' ? 'Grid' : 'Speaker'}</span>
                  </div>
                </button>

                {/* Background effects are intentionally hidden for testing. Keep the OpenVidu wiring intact for later UI exposure. */}
              </div>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onEndCall} className="leave-call-button">
                <PhoneOff size={22} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
              Leave session
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="hidden sm:flex grow shrink basis-1/4 items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleInfo}
                className={`meet-info-button ${showSidePanel && activePanel === 'notes' ? 'meet-info-button-active' : ''}`}
              >
                <Info size={22} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
              Notes
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleParticipants}
                className={`meet-info-button ${showSidePanel && activePanel === 'participants' ? 'meet-info-button-active' : ''}`}
              >
                <Users size={22} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
              Participants
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleChat}
                className={`meet-info-button ${showSidePanel && activePanel === 'chat' ? 'meet-info-button-active' : ''}`}
              >
                <MessageSquare size={22} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border text-xs dark:bg-[#3c4043] dark:text-white dark:border-none">
              Chat
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
