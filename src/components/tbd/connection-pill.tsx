"use client";

import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { Pill, type PillTone } from "./primitives";

/** Live-updates tag for a page banner: shows the state of the socket that keeps the lists fresh. */
export function ConnectionPill() {
  const { isConnected, connectionStatus, error } = useWebSocketStatus();

  let tone: PillTone = "slate";
  let label = "Offline";
  if (error) {
    tone = "rose";
    label = "Connection error";
  } else if (connectionStatus === "connecting") {
    tone = "amber";
    label = "Connecting";
  } else if (connectionStatus === "reconnecting") {
    tone = "amber";
    label = "Reconnecting";
  } else if (isConnected) {
    tone = "green";
    label = "Connected";
  }

  return (
    <span role="status" aria-label={`Live updates: ${label}`}>
      <Pill tone={tone} dot>
        {label}
      </Pill>
    </span>
  );
}
