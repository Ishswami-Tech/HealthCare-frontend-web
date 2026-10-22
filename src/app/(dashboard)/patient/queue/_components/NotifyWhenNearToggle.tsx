"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BellRing } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { IconBox, Surface } from "@/components/tbd";
import { showInfoToast } from "@/hooks/utils/use-toast";

/**
 * "Notify me when 1 patient is ahead of me". There is no per-visit notification preference on the
 * backend, so the choice is kept on this device (localStorage, per appointment). While the live
 * queue is open it raises an in-app alert at the threshold; the backend already sends its own
 * "Almost your turn" (1–2 ahead) and "You're next" push/in-app notifications on its own.
 */

const STORAGE_PREFIX = "patient-queue-notify:";
const NOTIFY_AT_AHEAD = 1;
const CHANGE_EVENT = "patient-queue-notify-change";

function storageKey(appointmentId: string): string {
  return `${STORAGE_PREFIX}${appointmentId}`;
}

function readStored(appointmentId: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(appointmentId)) === "1";
  } catch {
    return false;
  }
}

function writeStored(appointmentId: string, on: boolean): void {
  try {
    if (on) window.localStorage.setItem(storageKey(appointmentId), "1");
    else window.localStorage.removeItem(storageKey(appointmentId));
  } catch {
    // Private mode / storage full: the toggle still works for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function NotifyWhenNearToggle({
  appointmentId,
  patientsAhead,
}: {
  appointmentId: string;
  /** People waiting before the patient (null while unknown). */
  patientsAhead: number | null;
}) {
  const enabled = useSyncExternalStore(
    subscribe,
    () => readStored(appointmentId),
    () => false,
  );
  const [alerted, setAlerted] = useState(false);
  const previousAhead = useRef<number | null>(patientsAhead);

  useEffect(() => {
    const before = previousAhead.current;
    previousAhead.current = patientsAhead;
    if (!enabled || alerted || patientsAhead === null) return;
    // Only on the way down to the threshold, not when the page opens already there.
    if (patientsAhead <= NOTIFY_AT_AHEAD && before !== null && before > patientsAhead) {
      setAlerted(true);
      const message =
        patientsAhead === 0 ? "You're next. Please stay near the doctor's room." : "1 patient is ahead of you. Please stay close.";
      showInfoToast(message, { id: `queue-near-${appointmentId}` });
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification("Almost your turn", { body: message, tag: `queue-near-${appointmentId}` });
        } catch {
          // Some browsers only allow notifications from a service worker: the toast is enough.
        }
      }
    }
  }, [patientsAhead, enabled, alerted, appointmentId]);

  const switchId = `notify-near-${appointmentId}`;
  return (
    <Surface className="p-4">
      <div className="flex items-center gap-3.5">
        <IconBox icon={BellRing} tone="amber" size={40} />
        <label htmlFor={switchId} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
          <span className="text-sm font-bold text-ink">Notify me</span>
          <span className="text-xs text-ink-muted">When 1 patient is ahead of me</span>
        </label>
        <Switch
          id={switchId}
          checked={enabled}
          onCheckedChange={(on) => {
            writeStored(appointmentId, on);
            if (on) setAlerted(false);
            if (on && typeof Notification !== "undefined" && Notification.permission === "default") {
              void Notification.requestPermission().catch(() => undefined);
            }
          }}
          className="h-6 w-11 [&>span]:size-5"
        />
      </div>
    </Surface>
  );
}
