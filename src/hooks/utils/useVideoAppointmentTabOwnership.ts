"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

type TabOwnershipAction = "claim" | "release";

type TabOwnershipMessage = {
  appointmentId: string;
  ownerTabId: string;
  action: TabOwnershipAction;
  timestamp: number;
};

type OwnershipState = {
  activeOwnerId: string;
  isOwnershipLost: boolean;
};

type OwnershipAction =
  | { type: "SET_OWNER"; ownerId: string }
  | { type: "SET_LOST"; value: boolean }
  | { type: "SYNC"; ownerId: string; isLost: boolean };

function ownershipReducer(state: OwnershipState, action: OwnershipAction): OwnershipState {
  switch (action.type) {
    case "SET_OWNER":
      return { ...state, activeOwnerId: action.ownerId };
    case "SET_LOST":
      return { ...state, isOwnershipLost: action.value };
    case "SYNC":
      return {
        activeOwnerId: action.ownerId,
        isOwnershipLost: action.isLost,
      };
    default:
      return state;
  }
}

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
  const storageKey = appointmentId ? `${STORAGE_PREFIX}${appointmentId}` : "";
  const [ownershipState, dispatchOwnership] = useReducer(ownershipReducer, {
    activeOwnerId: tabIdRef.current,
    isOwnershipLost: false,
  });

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

    dispatchOwnership({
      type: "SYNC",
      ownerId: tabIdRef.current,
      isLost: false,
    });
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
        dispatchOwnership({
          type: "SYNC",
          ownerId: tabIdRef.current,
          isLost: false,
        });
        return;
      }

      dispatchOwnership({
        type: "SYNC",
        ownerId: message.ownerTabId,
        isLost: message.action === "claim",
      });
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
    activeOwnerId: ownershipState.activeOwnerId,
    isOwnershipLost: ownershipState.isOwnershipLost,
    claimOwnership,
    releaseOwnership,
  };
}
