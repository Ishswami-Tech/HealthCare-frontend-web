"use client";

import { toast } from "sonner";

export interface UndoToastOptions {
  /** Message, for example "Vitals saved for Asha K.". */
  message: string;
  /** Called when the person presses Undo before the timer ends. */
  onUndo: () => void | Promise<void>;
  /** Called when the timer ends without Undo (commit point for deferred actions). */
  onExpire?: () => void;
  /** Milliseconds the Undo button stays. Default 5000 (the designs use 5 s). */
  durationMs?: number;
  /** Toast id; the same id replaces the earlier toast. */
  id?: string | number;
  label?: string;
}

/**
 * Toast with an Undo button, 5 s by default. Two ways to use it:
 *  - action already sent: `onUndo` sends the reverse call (reverse dispense, un-check-in);
 *  - action held back: do the real call in `onExpire` and nothing on Undo.
 * Returns the toast id.
 */
export function showUndoToast({ message, onUndo, onExpire, durationMs = 5000, id, label = "Undo" }: UndoToastOptions) {
  let undone = false;
  return toast(message, {
    ...(id !== undefined ? { id } : {}),
    duration: durationMs,
    action: {
      label,
      onClick: () => {
        undone = true;
        void onUndo();
      },
    },
    onAutoClose: () => {
      if (!undone) onExpire?.();
    },
  });
}
