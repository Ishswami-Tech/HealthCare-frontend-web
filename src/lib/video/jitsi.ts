// ✅ Jitsi Meet Integration for Healthcare Video Appointments
// This module provides video appointment functionality using Jitsi Meet

export interface JitsiConfig {
  domain: string;
  roomName: string;
  userInfo: {
    displayName: string;
    email: string;
    role: 'doctor' | 'patient' | 'admin';
  };
  options?: {
    width?: number;
    height?: number;
    parentNode?: HTMLElement;
    configOverwrite?: Record<string, any>;
    interfaceConfigOverwrite?: Record<string, any>;
  };
}

export interface VideoAppointmentData {
  appointmentId: string;
  roomName: string;
  doctorId: string;
  patientId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  jitsiRoomId?: string;
  recordingUrl?: string;
  notes?: string;
}

// ✅ Jitsi Meet API Integration
export class JitsiMeetAPI {
  private api: any;
  private config: JitsiConfig;

  constructor(config: JitsiConfig) {
    this.config = config;
  }

  // ✅ Initialize Jitsi Meet
  async initialize(): Promise<void> {
    try {
      // Load Jitsi Meet API script
      await this.loadJitsiScript();
      
      // Initialize the API
      this.api = new (window as any).JitsiMeetExternalAPI(this.config.domain, {
        roomName: this.config.roomName,
        width: this.config.options?.width || 800,
        height: this.config.options?.height || 600,
        parentNode: this.config.options?.parentNode,
        userInfo: {
          displayName: this.config.userInfo.displayName,
          email: this.config.userInfo.email,
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          ...this.config.options?.configOverwrite,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_POWERED_BY: false,
          ...this.config.options?.interfaceConfigOverwrite,
        },
      });

      // Set up event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to initialize Jitsi Meet:', error);
      throw new Error('Failed to initialize video call');
    }
  }

  // ✅ Load Jitsi Meet Script
  private async loadJitsiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi Meet script'));
      document.head.appendChild(script);
    });
  }

  // ✅ Setup Event Listeners
  private setupEventListeners(): void {
    if (!this.api) return;

    this.api.addEventListeners({
      readyToClose: this.handleReadyToClose.bind(this),
      participantJoined: this.handleParticipantJoined.bind(this),
      participantLeft: this.handleParticipantLeft.bind(this),
      videoConferenceJoined: this.handleVideoConferenceJoined.bind(this),
      videoConferenceLeft: this.handleVideoConferenceLeft.bind(this),
      recordingStatusChanged: this.handleRecordingStatusChanged.bind(this),
      chatUpdated: this.handleChatUpdated.bind(this),
    });
  }

  // ✅ Event Handlers
  private handleReadyToClose(): void {
    console.log('Jitsi Meet ready to close');
    this.dispose();
  }

  private handleParticipantJoined(participant: any): void {
    console.log('Participant joined:', participant);
    // Emit custom event for UI updates
    window.dispatchEvent(new CustomEvent('jitsi-participant-joined', { detail: participant }));
  }

  private handleParticipantLeft(participant: any): void {
    console.log('Participant left:', participant);
    window.dispatchEvent(new CustomEvent('jitsi-participant-left', { detail: participant }));
  }

  private handleVideoConferenceJoined(participant: any): void {
    console.log('Video conference joined:', participant);
    window.dispatchEvent(new CustomEvent('jitsi-conference-joined', { detail: participant }));
  }

  private handleVideoConferenceLeft(participant: any): void {
    console.log('Video conference left:', participant);
    window.dispatchEvent(new CustomEvent('jitsi-conference-left', { detail: participant }));
  }

  private handleRecordingStatusChanged(data: any): void {
    console.log('Recording status changed:', data);
    window.dispatchEvent(new CustomEvent('jitsi-recording-status-changed', { detail: data }));
  }

  private handleChatUpdated(data: any): void {
    console.log('Chat updated:', data);
    window.dispatchEvent(new CustomEvent('jitsi-chat-updated', { detail: data }));
  }

  // ✅ Control Methods
  executeCommand(command: string, ...args: any[]): void {
    if (this.api) {
      this.api.executeCommand(command, ...args);
    }
  }

  // ✅ Mute/Unmute Audio
  toggleAudio(): void {
    this.executeCommand('toggleAudio');
  }

  // ✅ Mute/Unmute Video
  toggleVideo(): void {
    this.executeCommand('toggleVideo');
  }

  // ✅ Start/Stop Recording
  toggleRecording(): void {
    this.executeCommand('toggleRecording');
  }

  // ✅ End Call
  endCall(): void {
    this.executeCommand('hangup');
  }

  // ✅ Share Screen
  shareScreen(): void {
    this.executeCommand('shareVideo');
  }

  // ✅ Raise Hand
  raiseHand(): void {
    this.executeCommand('raiseHand');
  }

  // ✅ Get Participants
  getParticipants(): any[] {
    if (this.api) {
      return this.api.getParticipants();
    }
    return [];
  }

  // ✅ Get Current Participant
  getCurrentParticipant(): any {
    if (this.api) {
      return this.api.getCurrentParticipant();
    }
    return null;
  }

  // ✅ Dispose
  dispose(): void {
    if (this.api) {
      this.api.dispose();
      this.api = null;
    }
  }
}

// ✅ Video Appointment Service
export class VideoAppointmentService {
  private static instance: VideoAppointmentService;
  private currentCall: JitsiMeetAPI | null = null;

  private constructor() {}

  static getInstance(): VideoAppointmentService {
    if (!VideoAppointmentService.instance) {
      VideoAppointmentService.instance = new VideoAppointmentService();
    }
    return VideoAppointmentService.instance;
  }

  // ✅ Start Video Appointment
  async startVideoAppointment(appointmentData: VideoAppointmentData, userInfo: any): Promise<JitsiMeetAPI> {
    try {
      // Generate room name
      const roomName = this.generateRoomName(appointmentData);
      
      // Create Jitsi configuration
      const config: JitsiConfig = {
        domain: 'meet.jit.si',
        roomName,
        userInfo: {
          displayName: userInfo.displayName,
          email: userInfo.email,
          role: userInfo.role,
        },
        options: {
          width: 800,
          height: 600,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            // Healthcare-specific settings
            maxFullResolutionParticipants: 4,
            maxFrameHeight: 720,
            constraints: {
              video: {
                height: {
                  ideal: 720,
                  max: 720,
                  min: 180
                }
              }
            }
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_POWERED_BY: false,
            AUTHENTICATION_ENABLE: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          },
        },
      };

      // Initialize Jitsi Meet
      this.currentCall = new JitsiMeetAPI(config);
      await this.currentCall.initialize();

      // Update appointment status
      await this.updateAppointmentStatus(appointmentData.appointmentId, 'in-progress');

      return this.currentCall;
      
    } catch (error) {
      console.error('Failed to start video appointment:', error);
      throw new Error('Failed to start video appointment');
    }
  }

  // ✅ End Video Appointment
  async endVideoAppointment(appointmentId: string): Promise<void> {
    try {
      if (this.currentCall) {
        this.currentCall.endCall();
        this.currentCall.dispose();
        this.currentCall = null;
      }

      // Update appointment status
      await this.updateAppointmentStatus(appointmentId, 'completed');
      
    } catch (error) {
      console.error('Failed to end video appointment:', error);
      throw new Error('Failed to end video appointment');
    }
  }

  // ✅ Generate Room Name
  private generateRoomName(appointmentData: VideoAppointmentData): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    return `healthcare-${appointmentData.appointmentId}-${timestamp}-${randomId}`;
  }

  // ✅ Update Appointment Status
  private async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
    try {
      // This would integrate with your backend API
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  }

  // ✅ Get Current Call
  getCurrentCall(): JitsiMeetAPI | null {
    return this.currentCall;
  }

  // ✅ Check if in call
  isInCall(): boolean {
    return this.currentCall !== null;
  }
}

// ✅ Export singleton instance
export const videoAppointmentService = VideoAppointmentService.getInstance();
