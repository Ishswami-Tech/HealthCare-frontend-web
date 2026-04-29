// ✅ OpenVidu Integration for Healthcare Video Appointments
// This module provides video appointment functionality using OpenVidu

import { OpenVidu, Session, Publisher, Subscriber, Stream, ConnectionEvent, StreamEvent, PublisherProperties, StreamManagerEvent } from 'openvidu-browser';
import type { Role } from '@/types/auth.types';
import type { AppointmentStatus } from '@/types/appointment.types';

export interface OpenViduConfig {
  openviduServerUrl: string;
  sessionId: string;
  token: string;
  userInfo: {
    displayName: string;
    email: string;
    role: Role | 'admin';
  };
  options?: {
    videoSource?: string | MediaStreamTrack | boolean;
    audioSource?: string | MediaStreamTrack | boolean;
    publishAudio?: boolean;
    publishVideo?: boolean;
    resolution?: string;
    frameRate?: number;
  };
}

export interface VideoAppointmentData {
  appointmentId: string;
  roomName: string;
  doctorId: string;
  patientId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  sessionId?: string;
  recordingUrl?: string;
  notes?: string;
}

export interface ParticipantInfo {
  connectionId: string;
  data: string;
  role: string;
  userId?: string;
  displayName?: string;
}

export function normalizeOpenViduServerUrl(value: string): string {
  const raw = value.trim();
  if (!raw) {
    return raw;
  }

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(raw) || /^wss?:\/\//i.test(raw) ? raw : `https://${raw}`
    );
    const keepPort = parsed.port.length > 0 ? `:${parsed.port}` : '';
    return `${parsed.protocol}//${parsed.hostname}${keepPort}`;
  } catch {
    return raw.replace(/\/+$/, '');
  }
}

// ✅ OpenVidu API Integration
export class OpenViduAPI {
  private session: Session | null = null;
  private publisher: Publisher | null = null;
  private subscribers: Map<string, Subscriber> = new Map();
  private config: OpenViduConfig;
  private openvidu: OpenVidu;

  constructor(config: OpenViduConfig) {
    this.config = config;
    this.openvidu = new OpenVidu();
  }

  private normalizeTokenUrl(token: string): string {
    const openviduServerUrl = normalizeOpenViduServerUrl(this.config.openviduServerUrl || '');
    if (!openviduServerUrl) {
      return token;
    }

    try {
      const tokenUrl = new URL(token);
      const serverBase = new URL(
        /^https?:\/\//i.test(openviduServerUrl) || /^wss?:\/\//i.test(openviduServerUrl)
          ? openviduServerUrl
          : `https://${openviduServerUrl}`
      );

      const normalizedProtocol =
        serverBase.protocol === 'http:'
          ? 'ws:'
          : serverBase.protocol === 'https:'
            ? 'wss:'
            : serverBase.protocol === 'ws:'
              ? 'ws:'
              : serverBase.protocol === 'wss:'
              ? 'wss:'
              : tokenUrl.protocol;

      const isLoopbackHost = /^(localhost|127\.0\.0\.1|\[::1\]|::1)$/i.test(tokenUrl.hostname);
      const serverPort = serverBase.port;

      // Only rewrite tokens that still point at a local development host.
      // Production tokens should be preserved verbatim so we do not invalidate
      // the server-issued token payload by changing its origin too aggressively.
      if (!isLoopbackHost && !serverPort) {
        return token;
      }

      if (tokenUrl.host === serverBase.host && tokenUrl.protocol === normalizedProtocol) {
        return token;
      }

      tokenUrl.protocol = normalizedProtocol;
      tokenUrl.hostname = serverBase.hostname;
      if (serverPort) {
        tokenUrl.port = serverPort;
      }

      return tokenUrl.toString();
    } catch {
      return token;
    }
  }

  // ✅ Initialize OpenVidu Session
  async initialize(): Promise<void> {
    try {
      // Create session with OpenVidu instance
      this.session = this.openvidu.initSession();
      
      // Set up event listeners
      this.setupEventListeners();

      // Connect to session
      const connectionToken = this.normalizeTokenUrl(this.config.token);
      await this.session.connect(connectionToken, {
        clientData: JSON.stringify({
          displayName: this.config.userInfo.displayName,
          email: this.config.userInfo.email,
          role: this.config.userInfo.role,
        }),
      });

      // Initialize publisher
      await this.initializePublisher();

      // Publish stream
      if (this.publisher) {
        await this.session.publish(this.publisher);
      }

      // Session initialized successfully
    } catch (error) {
      console.error('Failed to initialize OpenVidu session:', error);
      throw new Error('Failed to initialize video call');
    }
  }

  // ✅ Setup Event Listeners
  private setupEventListeners(): void {
    if (!this.session) return;

    // Connection created
    this.session.on('connectionCreated', (event: ConnectionEvent) => {
      window.dispatchEvent(new CustomEvent('openvidu-connection-created', { detail: event }));
    });

    // Connection destroyed
    this.session.on('connectionDestroyed', (event: ConnectionEvent) => {
      window.dispatchEvent(new CustomEvent('openvidu-connection-destroyed', { detail: event }));
    });

    // Stream created (remote participant joined)
    this.session.on('streamCreated', (event: StreamEvent) => {
      if (event.stream) {
        this.handleStreamCreated(event.stream);
      }
      window.dispatchEvent(new CustomEvent('openvidu-stream-created', { detail: event }));
    });

    // Stream destroyed (remote participant left)
    this.session.on('streamDestroyed', (event: StreamEvent) => {
      if (event.stream) {
        this.handleStreamDestroyed(event.stream);
      }
      window.dispatchEvent(new CustomEvent('openvidu-stream-destroyed', { detail: event }));
    });

    // Session disconnected
    this.session.on('sessionDisconnected', () => {
      this.cleanup();
      window.dispatchEvent(new CustomEvent('openvidu-session-disconnected'));
    });

    // Exception occurred
    this.session.on('exception', (exception: Error) => {
      console.error('OpenVidu exception:', exception);
      window.dispatchEvent(new CustomEvent('openvidu-exception', { detail: exception }));
    });
  }

  // ✅ Initialize Publisher
  private async initializePublisher(): Promise<void> {
    if (!this.session) return;

    const publisherOptions: PublisherProperties = {
      publishAudio: this.config.options?.publishAudio ?? true,
      publishVideo: this.config.options?.publishVideo ?? true,
      resolution: this.config.options?.resolution ?? '1280x720',
      frameRate: this.config.options?.frameRate ?? 30,
    };

    // Only add audioSource/videoSource if they are defined (not undefined)
    if (this.config.options?.audioSource !== undefined) {
      publisherOptions.audioSource = this.config.options.audioSource;
    }
    if (this.config.options?.videoSource !== undefined) {
      publisherOptions.videoSource = this.config.options.videoSource;
    }

    this.publisher = await this.openvidu.initPublisher(undefined, publisherOptions);

    // Set up publisher event listeners
    if (this.publisher) {
      this.publisher.on('streamAudioVolumeChange', (event: StreamManagerEvent) => {
        window.dispatchEvent(new CustomEvent('openvidu-audio-volume-change', { detail: event }));
      });
    }
  }

  // ✅ Handle Stream Created (Remote Participant Joined)
  private handleStreamCreated(stream: Stream): void {
    if (!this.session) return;

    const subscriber = this.session.subscribe(stream, undefined);
    this.subscribers.set(stream.streamId, subscriber);
  }

  // ✅ Handle Stream Destroyed (Remote Participant Left)
  private handleStreamDestroyed(stream: Stream): void {
    const subscriber = this.subscribers.get(stream.streamId);
    if (subscriber && this.session) {
      // this.session.unsubscribe(subscriber); // OpenVidu handles this automatically on streamDestroyed
      this.subscribers.delete(stream.streamId);
    }
  }

  // ✅ Control Methods
  toggleAudio(): void {
    if (this.publisher) {
      this.publisher.publishAudio(!this.publisher.stream.audioActive);
    }
  }

  toggleVideo(): void {
    if (this.publisher) {
      this.publisher.publishVideo(!this.publisher.stream.videoActive);
    }
  }

  // ✅ Share Screen
  async shareScreen(): Promise<void> {
    if (!this.session || !this.publisher) return;

    try {
      // Stop current publisher
      await this.session.unpublish(this.publisher);
      this.publisher = null;

      // Create screen share publisher
      this.publisher = await this.openvidu.initPublisher(undefined, {
        videoSource: 'screen',
        publishAudio: false,
        publishVideo: true,
      });

      if (this.publisher) {
        await this.session.publish(this.publisher);
      }
    } catch (error) {
      console.error('Failed to share screen:', error);
      throw error;
    }
  }

  // ✅ Stop Screen Share
  async stopScreenShare(): Promise<void> {
    if (!this.session || !this.publisher) return;

    try {
      await this.session.unpublish(this.publisher);
      this.publisher = null;

      // Reinitialize camera publisher
      await this.initializePublisher();
      if (this.publisher) {
        await this.session.publish(this.publisher);
      }
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      throw error;
    }
  }

  // ✅ Get Participants
  getParticipants(): ParticipantInfo[] {
    if (!this.session) return [];

    const participants: ParticipantInfo[] = [];
    this.session.remoteConnections.forEach((connection) => {
      participants.push({
        connectionId: connection.connectionId,
        data: connection.data || '',
        role: connection.role || 'SUBSCRIBER',
      });
    });

    return participants;
  }

  // ✅ Get Current Participant
  getCurrentParticipant(): ParticipantInfo | null {
    if (!this.session) return null;

    return {
      connectionId: this.session.connection.connectionId,
      data: this.session.connection.data || '',
      role: this.session.connection.role || 'PUBLISHER',
    };
  }

  // ✅ Check if audio is muted
  isAudioMuted(): boolean {
    return this.publisher ? !this.publisher.stream.audioActive : false;
  }

  // ✅ Check if video is muted
  isVideoMuted(): boolean {
    return this.publisher ? !this.publisher.stream.videoActive : false;
  }

  // ✅ Get Publisher
  getPublisher(): Publisher | null {
    return this.publisher;
  }

  // ✅ Get Subscribers
  getSubscribers(): Subscriber[] {
    return Array.from(this.subscribers.values());
  }

  // ✅ End Call
  async endCall(): Promise<void> {
    await this.dispose();
  }

  // ✅ Cleanup
  private cleanup(): void {
    this.subscribers.clear();
  }

  // ✅ Dispose
  async dispose(): Promise<void> {
    try {
      if (this.publisher && this.session) {
        await this.session.unpublish(this.publisher);
        this.publisher = null;
      }

      if (this.session) {
        await this.session.disconnect();
        this.session = null;
      }

      this.cleanup();
    } catch (error) {
      console.error('Error disposing OpenVidu session:', error);
    }
  }
}


// ✅ Video Appointment Service
export class VideoAppointmentService {
  private static instance: VideoAppointmentService;
  private currentCall: OpenViduAPI | null = null;

  private constructor() {}

  static getInstance(): VideoAppointmentService {
    if (!VideoAppointmentService.instance) {
      VideoAppointmentService.instance = new VideoAppointmentService();
    }
    return VideoAppointmentService.instance;
  }

  // ✅ Start Video Appointment
  async startVideoAppointment(
    appointmentData: VideoAppointmentData,
    userInfo: {
      userId: string;
      displayName: string;
      email: string;
      role: Role | 'admin';
    },
    token: string,
    openviduServerUrl: string
  ): Promise<OpenViduAPI> {
    try {
      // Create OpenVidu configuration
      const config: OpenViduConfig = {
        openviduServerUrl,
        sessionId: appointmentData.sessionId || appointmentData.appointmentId,
        token,
        userInfo: {
          displayName: userInfo.displayName,
          email: userInfo.email,
          role: userInfo.role,
        },
        options: {
          publishAudio: true,
          publishVideo: true,
          resolution: '1280x720',
          frameRate: 30,
        },
      };

      // Initialize OpenVidu
      this.currentCall = new OpenViduAPI(config);
      // Note: container will be set when initialize is called with container parameter

      return this.currentCall;
    } catch (error) {
      console.error('Failed to start video appointment:', error);
      throw new Error('Failed to start video appointment');
    }
  }

  // ✅ End Video Appointment
  async endVideoAppointment(): Promise<void> {
    try {
      if (this.currentCall) {
        await this.currentCall.endCall();
        this.currentCall = null;
      }
    } catch (error) {
      console.error('Failed to end video appointment:', error);
      throw new Error('Failed to end video appointment');
    }
  }

  // ✅ Get Current Call
  getCurrentCall(): OpenViduAPI | null {
    return this.currentCall;
  }

  // ✅ Check if in call
  isInCall(): boolean {
    return this.currentCall !== null;
  }
}

// ✅ Export singleton instance
export const videoAppointmentService = VideoAppointmentService.getInstance();
