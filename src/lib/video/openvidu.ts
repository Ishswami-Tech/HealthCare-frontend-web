// ✅ OpenVidu Integration for Healthcare Video Appointments
// This module provides video appointment functionality using OpenVidu

import { OpenVidu, Session, Publisher, Subscriber, Stream, ConnectionEvent, StreamEvent, PublisherProperties, StreamManagerEvent, Device } from 'openvidu-browser';
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
  isSpeaking?: boolean;
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

type UserNameLike = {
  displayName?: string | null | undefined;
  name?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  email?: string | null | undefined;
};

export function resolveVideoDisplayName(user?: UserNameLike | null): string {
  const displayName = String(user?.displayName || "").trim();
  if (displayName) {
    return displayName;
  }

  const name = String(user?.name || "").trim();
  if (name) {
    return name;
  }

  const firstName = String(user?.firstName || "").trim();
  const lastName = String(user?.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) {
    return fullName;
  }

  const email = String(user?.email || "").trim();
  if (email) {
    const emailPrefix = email.split("@")[0] || "";
    const emailName = emailPrefix.replace(/[._-]+/g, " ").trim();
    if (emailName) {
      return emailName;
    }
  }

  return "User";
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out"
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new TimeoutError(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function getPublicOpenViduWsUri(value: string): string {
  const raw = normalizeOpenViduServerUrl(value);
  if (!raw) {
    return '';
  }

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(raw) || /^wss?:\/\//i.test(raw) ? raw : `https://${raw}`
    );
    const keepPort = parsed.port.length > 0 ? `:${parsed.port}` : '';
    const protocol = parsed.protocol === 'http:' ? 'ws:' : 'wss:';
    return `${protocol}//${parsed.hostname}${keepPort}/openvidu`;
  } catch {
    return '';
  }
}

// ✅ OpenVidu API Integration
export class OpenViduAPI {
  private session: Session | null = null;
  private publisher: Publisher | null = null;
  private subscribers: Map<string, Subscriber> = new Map();
  private config: OpenViduConfig;
  private openvidu: OpenVidu;
  private activeAudioDeviceId: string | null = null;
  private activeVideoDeviceId: string | null = null;
  private virtualBackgroundFilter: any | null = null;
  private virtualBackgroundType: 'blur' | 'image' | 'video' | 'none' = 'none';
  private virtualBackgroundUrl: string | null = null;

  constructor(config: OpenViduConfig) {
    this.config = config;
    this.openvidu = new OpenVidu();
    
    // Initialize with default or provided sources
    if (typeof config.options?.audioSource === 'string') {
      this.activeAudioDeviceId = config.options.audioSource;
    }
    if (typeof config.options?.videoSource === 'string') {
      this.activeVideoDeviceId = config.options.videoSource;
    }
  }

  private parseConnectionData(dataStr: string): { displayName: string, userId: string, role: string } {
    const result = { displayName: 'Unknown', userId: '', role: '' };
    if (!dataStr) return result;

    try {
      const parts = dataStr.split('%/%');
      
      for (const part of parts) {
        try {
          const parsed = JSON.parse(part);
          
          // Check for nested clientData
          if (parsed.clientData) {
            try {
              const clientData = typeof parsed.clientData === 'string' 
                ? JSON.parse(parsed.clientData) 
                : parsed.clientData;
              result.displayName = clientData.displayName || clientData.userName || result.displayName;
              result.userId = clientData.userId || result.userId;
              result.role = clientData.role || clientData.userRole || result.role;
            } catch (inner) {
              // Not JSON
            }
          }
          
          result.displayName = parsed.displayName || parsed.userName || result.displayName;
          result.userId = parsed.userId || result.userId;
          result.role = parsed.role || parsed.userRole || result.role;
        } catch (e) {
          // If not JSON, use as fallback name
          if (result.displayName === 'Unknown' && part.length > 2 && !part.startsWith('{')) {
            result.displayName = part;
          }
        }
      }
    } catch (err) {
      // Final fallback
      result.displayName = dataStr.split('%')[0] || 'Unknown';
    }

    if (result.displayName === 'Unknown') result.displayName = 'User';
    return result;
  }

  private normalizeTokenUrl(token: string): string {
    return token.trim();
  }

  private patchSessionTransport(): void {
    if (!this.session) {
      return;
    }

    const publicWsUri = getPublicOpenViduWsUri(this.config.openviduServerUrl || '');
    if (!publicWsUri) {
      return;
    }

    const publicHttpUri = publicWsUri
      .replace(/^wss:\/\//i, 'https://')
      .replace(/^ws:\/\//i, 'http://')
      .replace(/\/openvidu$/i, '');

    const openviduAny = this.openvidu as unknown as {
      startWs?: (onConnectSuccess: (error: Error) => void) => void;
      wsUri?: string;
      httpUri?: string;
    };

    const originalStartWs = openviduAny.startWs?.bind(this.openvidu);
    if (!originalStartWs) {
      return;
    }

    openviduAny.startWs = (onConnectSuccess: (error: Error) => void) => {
      openviduAny.wsUri = publicWsUri;
      openviduAny.httpUri = publicHttpUri;
      return originalStartWs(onConnectSuccess);
    };
  }

  // ✅ Initialize OpenVidu Session
  async initialize(mediaOptions?: {
    videoSource?: string | MediaStreamTrack | boolean;
    audioSource?: string | MediaStreamTrack | boolean;
    publishAudio?: boolean;
    publishVideo?: boolean;
  }): Promise<void> {
    try {
      // Merge caller media preferences into config
      if (mediaOptions) {
        this.config.options = { ...this.config.options, ...mediaOptions };
      }

      // Create session with OpenVidu instance
      this.session = this.openvidu.initSession();
      
      // Set up event listeners
      this.setupEventListeners();
      this.patchSessionTransport();

      // Connect to session
      const connectionToken = this.normalizeTokenUrl(this.config.token);
      console.warn('[VIDEO][OpenVidu] Connecting with transport:', {
        sessionId: this.config.sessionId,
        token: connectionToken,
        wsUri: (this.openvidu as unknown as { getWsUri?: () => string }).getWsUri?.() || 'unknown',
      });
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
        // Notify application that the publisher object itself has changed
        window.dispatchEvent(new CustomEvent('openvidu-publisher-changed', {
          detail: { publisher: this.publisher }
        }));
      }

      // Session initialized successfully
    } catch (error) {
      console.error('Failed to initialize OpenVidu session:', error);
      await this.dispose().catch(() => undefined);
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
    this.session.on('sessionDisconnected', (event: any) => {
      const reason = String(event?.reason || event?.exception || 'session disconnected');
      this.cleanup();
      window.dispatchEvent(new CustomEvent('openvidu-session-disconnected', {
        detail: {
          reason,
        },
      }));
    });

    // Exception occurred
    this.session.on('exception', (exception: Error) => {
      console.error('OpenVidu exception:', exception);
      window.dispatchEvent(new CustomEvent('openvidu-exception', {
        detail: {
          message: exception instanceof Error ? exception.message : 'OpenVidu exception',
          name: exception instanceof Error ? exception.name : 'OpenViduException',
        },
      }));
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

    const localConnectionId = this.session.connection?.connectionId;
    if (localConnectionId && stream.connection?.connectionId === localConnectionId) {
      return;
    }

    if (this.subscribers.has(stream.streamId)) {
      return;
    }

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
      const next = !this.publisher.stream.audioActive;
      this.publisher.publishAudio(next);
      window.dispatchEvent(new CustomEvent('openvidu-publisher-property-changed', {
        detail: { property: 'audioActive', value: next }
      }));
    }
  }

  private async acquireVideoTrack(deviceId?: string | null): Promise<MediaStreamTrack> {
    const mediaStream = await this.openvidu.getUserMedia({
      audioSource: false,
      videoSource: deviceId && deviceId.trim().length > 0 ? deviceId : true,
    });
    const videoTrack = mediaStream.getVideoTracks()[0];
    if (!videoTrack) {
      mediaStream.getTracks().forEach((track) => track.stop());
      throw new Error('No video track available');
    }
    return videoTrack;
  }

  toggleVideo(): boolean {
    if (!this.publisher) {
      return false;
    }

    const nextVideoActive = !this.publisher.stream.videoActive;

    if (!nextVideoActive) {
      const mediaStream = this.publisher.stream.getMediaStream?.();
      const videoTracks = mediaStream?.getVideoTracks() || [];
      videoTracks.forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore stop errors during video teardown
        }
      });
      this.publisher.publishVideo(false);
    } else {
      void this.acquireVideoTrack(this.activeVideoDeviceId)
        .then(async (videoTrack) => {
          if (!this.publisher) return;
          await this.publisher.replaceTrack(videoTrack);
          this.publisher.publishVideo(true);
          window.dispatchEvent(new CustomEvent('openvidu-publisher-property-changed', {
            detail: { property: 'videoActive', value: true }
          }));
        })
        .catch((error) => {
          console.error('[VIDEO] Failed to restore camera track:', error);
        });
    }

    window.dispatchEvent(new CustomEvent('openvidu-publisher-property-changed', {
      detail: { property: 'videoActive', value: nextVideoActive }
    }));

    return !nextVideoActive;
  }

  async applyVirtualBackground(options: {
    enabled: boolean;
    type: 'blur' | 'image' | 'video' | 'none';
    blurIntensity?: number;
    imageUrl?: string;
    videoUrl?: string;
  }): Promise<void> {
    if (!this.publisher) {
      return;
    }

    const nextType = options.enabled ? options.type : 'none';
    const nextUrl =
      nextType === 'image'
        ? options.imageUrl || null
        : nextType === 'video'
          ? options.videoUrl || null
          : null;

    if (
      this.virtualBackgroundFilter &&
      this.virtualBackgroundType === nextType &&
      this.virtualBackgroundUrl === nextUrl
    ) {
      return;
    }

    if (this.virtualBackgroundFilter) {
      try {
        await this.publisher.stream.removeFilter();
      } catch (error) {
        console.warn('[VIDEO] Failed to remove previous virtual background filter:', error);
      } finally {
        this.virtualBackgroundFilter = null;
        this.virtualBackgroundType = 'none';
        this.virtualBackgroundUrl = null;
      }
    }

    if (nextType === 'none') {
      return;
    }

    if (nextType === 'blur') {
      this.virtualBackgroundFilter = await this.publisher.stream.applyFilter('VB:blur', {});
      this.virtualBackgroundType = 'blur';
      this.virtualBackgroundUrl = null;
      return;
    }

    if (nextType === 'image') {
      if (!nextUrl) {
        throw new Error('Virtual background image URL is required');
      }
      this.virtualBackgroundFilter = await this.publisher.stream.applyFilter('VB:image', {
        url: nextUrl,
      });
      this.virtualBackgroundType = 'image';
      this.virtualBackgroundUrl = nextUrl;
      return;
    }

    if (nextType === 'video') {
      if (!nextUrl) {
        throw new Error('Virtual background video URL is required');
      }
      this.virtualBackgroundFilter = await this.publisher.stream.applyFilter('VB:image', {
        url: nextUrl,
      });
      this.virtualBackgroundType = 'video';
      this.virtualBackgroundUrl = nextUrl;
    }
  }

  async clearVirtualBackground(): Promise<void> {
    if (!this.publisher || !this.virtualBackgroundFilter) {
      this.virtualBackgroundFilter = null;
      this.virtualBackgroundType = 'none';
      this.virtualBackgroundUrl = null;
      return;
    }

    try {
      await this.publisher.stream.removeFilter();
    } finally {
      this.virtualBackgroundFilter = null;
      this.virtualBackgroundType = 'none';
      this.virtualBackgroundUrl = null;
    }
  }

  // ✅ Share Screen
  async shareScreen(): Promise<void> {
    if (!this.session || !this.publisher) return;

    try {
      // Create screen share publisher
      const screenPublisher = await this.openvidu.initPublisher(undefined, {
        videoSource: 'screen',
        publishAudio: false,
        publishVideo: true,
      });

      // Listen for when the user stops sharing via the browser's native button
      screenPublisher.once('streamDestroyed', async (event) => {
        if (event.reason === 'unpublish') {
          await this.stopScreenShare();
        }
      });

      screenPublisher.once('accessAllowed', async () => {
        if (!this.session || !this.publisher) return;
        
        // Stop current publisher only after access is allowed to screen
        await this.session.unpublish(this.publisher);
        this.publisher = screenPublisher;
        
        await this.session.publish(this.publisher);
        
        // Notify application that the publisher object itself has changed
        window.dispatchEvent(new CustomEvent('openvidu-publisher-changed', {
          detail: { publisher: this.publisher }
        }));

        window.dispatchEvent(new CustomEvent('openvidu-screen-share-started'));
      });

      screenPublisher.once('accessDenied', () => {
        window.dispatchEvent(new CustomEvent('openvidu-screen-share-stopped'));
      });

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
        if (this.virtualBackgroundType !== 'none') {
          await this.applyVirtualBackground({
            enabled: true,
            type: this.virtualBackgroundType,
            ...(this.virtualBackgroundType === 'image' && this.virtualBackgroundUrl
              ? { imageUrl: this.virtualBackgroundUrl }
              : {}),
            ...(this.virtualBackgroundType === 'video' && this.virtualBackgroundUrl
              ? { videoUrl: this.virtualBackgroundUrl }
              : {}),
          }).catch(() => undefined);
        }
        // Notify application that we've switched back to the camera publisher
        window.dispatchEvent(new CustomEvent('openvidu-publisher-changed', {
          detail: { publisher: this.publisher }
        }));
        window.dispatchEvent(new CustomEvent('openvidu-screen-share-stopped'));
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
    const seen = new Set<string>();
    
    // Add local participant (You)
    const local = this.getCurrentParticipant();
    if (local) {
      const localKey = `${local.connectionId}:${local.userId || local.displayName || ''}`;
      seen.add(localKey);
      participants.push({
        ...local,
        displayName: `${local.displayName || 'You'} (You)`
      });
    }

    this.session.remoteConnections.forEach((connection) => {
      const parsed = this.parseConnectionData(connection.data || '');
      const key = `${connection.connectionId}:${parsed.userId || parsed.displayName || ''}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      
      participants.push({
        connectionId: connection.connectionId,
        data: connection.data || '',
        role: connection.role || 'SUBSCRIBER',
        displayName: parsed.displayName,
        userId: parsed.userId,
        isSpeaking: false
      });
    });

    return participants;
  }

  getCurrentParticipant(): ParticipantInfo | null {
    if (!this.session || !this.session.connection) return null;

    const parsed = this.parseConnectionData(this.session.connection.data || '');

    return {
      connectionId: this.session.connection.connectionId,
      data: this.session.connection.data || '',
      role: this.session.connection.role || 'PUBLISHER',
      displayName: parsed.displayName,
      userId: parsed.userId,
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

  // ✅ Get Session
  getSession(): Session | null {
    return this.session;
  }

  // ✅ Get Devices
  async getDevices(): Promise<Device[]> {
    return await this.openvidu.getDevices();
  }

  // ✅ Change Audio Source
  async changeAudioSource(deviceId: string): Promise<void> {
    if (!this.publisher) return;
    try {
      const mediaStream = await this.openvidu.getUserMedia({ audioSource: deviceId, videoSource: false });
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        await this.publisher.replaceTrack(audioTrack);
        this.activeAudioDeviceId = deviceId;
      } else {
        throw new Error('No audio track found for selected device');
      }
    } catch (error) {
      console.error('[VIDEO] Failed to change audio source:', error);
      throw error;
    }
  }

  // ✅ Change Video Source
  async changeVideoSource(deviceId: string): Promise<void> {
    if (!this.publisher) return;
    try {
      const mediaStream = await this.openvidu.getUserMedia({ audioSource: false, videoSource: deviceId });
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        await this.publisher.replaceTrack(videoTrack);
        this.activeVideoDeviceId = deviceId;
      } else {
        throw new Error('No video track found for selected device');
      }
    } catch (error) {
      console.error('[VIDEO] Failed to change video source:', error);
      throw error;
    }
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
      await this.clearVirtualBackground().catch(() => undefined);

      const mediaStream = (this.publisher as unknown as {
        stream?: { getMediaStream?: () => MediaStream };
      } | null)?.stream?.getMediaStream?.();
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // Ignore stop errors during teardown
          }
        });
      }

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

  // ✅ Get Active Devices
  getActiveAudioDeviceId(): string | null {
    return this.activeAudioDeviceId;
  }

  getActiveVideoDeviceId(): string | null {
    return this.activeVideoDeviceId;
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
    openviduServerUrl: string,
    options?: {
      videoSource?: string | MediaStreamTrack | boolean;
      audioSource?: string | MediaStreamTrack | boolean;
      publishAudio?: boolean;
      publishVideo?: boolean;
      resolution?: string;
      frameRate?: number;
    }
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
      };

      const callOptions: NonNullable<OpenViduConfig["options"]> = {
        publishAudio: options?.publishAudio ?? true,
        publishVideo: options?.publishVideo ?? true,
        resolution: '1280x720',
        frameRate: 30,
      };

      if (options?.audioSource !== undefined) {
        callOptions.audioSource = options.audioSource;
      }

      if (options?.videoSource !== undefined) {
        callOptions.videoSource = options.videoSource;
      }

      config.options = callOptions;

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
