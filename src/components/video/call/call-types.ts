/** Shared types for the in-call screens (presentational pieces under `components/video/call`). */

export type MeetPanel = "chat" | "people";

export type VideoLayout = "auto" | "spotlight" | "tiled";

/**
 * Why the person is leaving the call screen.
 * - `left`: they chose to leave; the visit stays open.
 * - `completed`: the doctor completed the visit.
 * - `dropped`: the call ended by itself (connection lost, removed, room closed).
 */
export type CallExitReason = "left" | "completed" | "dropped";

export type CallChatMessage = {
  id: string;
  text: string;
  /** Name shown above a message from someone else. */
  senderName: string;
  /** "11:02 am" */
  timeLabel: string;
  isMine: boolean;
};

export type CallWaitingPerson = {
  id: string;
  name: string;
};

export type CallDeviceOption = {
  id: string;
  label: string;
};

export type CallDeviceGroup = {
  label: string;
  devices: CallDeviceOption[];
  currentId: string;
  onSelect: (deviceId: string) => void;
};

export function getCallInitials(label: string): string {
  return (
    label
      .replace(/^Dr\.?\s+/i, "")
      .replace(/\s*\(You\)\s*$/i, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U"
  );
}

/** "12:48" (or "1:02:48") from a number of seconds. */
export function formatCallDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const two = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${minutes}:${two(seconds)}`;
}
