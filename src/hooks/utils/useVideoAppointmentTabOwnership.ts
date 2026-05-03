"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TabOwnershipAction = "claim" | "release";

type TabOwnershipMessage = {
  appointmentId: string;
  ownerTabId: string;
  action: TabOwnershipAction;
  timestamp: number;
};

type UseVideoAppointmentTabOwnershipResult = {
  activeOwnerId: string;
  isOwnershipLost: boolean;
  claimOwnership: () => void;
  releaseOwnership: () => void;
};

const CHANNEL_NAME = "video-appointment-tab-ownership";
const STORAGE_PREFIX = "video-appointment-tab-ownership:";

function createTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readMessage(value: string | null): TabOwnershipMessage | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<TabOwnershipMessage>;
    if (
      typeof parsed.appointmentId === "string" &&
      typeof parsed.ownerTabId === "string" &&
      (parsed.action === "claim" || parsed.action === "release") &&
      typeof parsed.timestamp === "number"
    ) {
      return parsed as TabOwnershipMessage;
    }
  } catch {
    return null;
  }

  return null;
}

export function useVideoAppointmentTabOwnership(
  appointmentId: string
): UseVideoAppointmentTabOwnershipResult {
  const tabIdRef = useRef(createTabId());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const storageKey = useMemo(
    () => (appointmentId ? `${STORAGE_PREFIX}${appointmentId}` : ""),
    [appointmentId]
  );
  const [activeOwnerId, setActiveOwnerId] = useState(tabIdRef.current);
  const [isOwnershipLost, setIsOwnershipLost] = useState(false);

  const publish = useCallback(
    (message: TabOwnershipMessage) => {
      if (typeof window === "undefined" || !storageKey) return;

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(message));
      } catch {
        // Ignore storage failures; BroadcastChannel still covers modern browsers.
      }

      channelRef.current?.postMessage(message);
    },
    [storageKey]
  );

  const claimOwnership = useCallback(() => {
    if (!appointmentId) return;

    const message: TabOwnershipMessage = {
      appointmentId,
      ownerTabId: tabIdRef.current,
      action: "claim",
      timestamp: Date.now(),
    };

    setActiveOwnerId(tabIdRef.current);
    setIsOwnershipLost(false);
    publish(message);
  }, [appointmentId, publish]);

  const releaseOwnership = useCallback(() => {
    if (!appointmentId) return;

    const current = readMessage(
      typeof window !== "undefined" && storageKey
        ? window.localStorage.getItem(storageKey)
        : null
    );

    if (current?.ownerTabId !== tabIdRef.current) {
      return;
    }

    const message: TabOwnershipMessage = {
      appointmentId,
      ownerTabId: tabIdRef.current,
      action: "release",
      timestamp: Date.now(),
    };

    publish(message);

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage cleanup failures.
    }
  }, [appointmentId, publish, storageKey]);

  useEffect(() => {
    if (!appointmentId || typeof window === "undefined") {
      return;
    }

    const onMessage = (event: MessageEvent<TabOwnershipMessage>) => {
      const message = event.data;

      if (!message || message.appointmentId !== appointmentId) {
        return;
      }

      if (message.ownerTabId === tabIdRef.current) {
        setActiveOwnerId(tabIdRef.current);
        return;
      }

      setActiveOwnerId(message.ownerTabId);
      if (message.action === "claim") {
        setIsOwnershipLost(true);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return;
      }

      const message = readMessage(event.newValue);
      if (!message || message.appointmentId !== appointmentId) {
        return;
      }

      onMessage({ data: message } as MessageEvent<TabOwnershipMessage>);
    };

    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.addEventListener("message", onMessage as EventListener);
    }

    window.addEventListener("storage", onStorage);

    return () => {
      channelRef.current?.removeEventListener("message", onMessage as EventListener);
      channelRef.current?.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, [appointmentId, storageKey]);

  return {
    activeOwnerId,
    isOwnershipLost,
    claimOwnership,
    releaseOwnership,
  };
}
