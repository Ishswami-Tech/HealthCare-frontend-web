"use client";

import { useCallback } from "react";
import { showUndoToast } from "@/components/tbd/undo-toast";

/**
 * Wraps an action that can be taken back for 5 seconds (check-in, mark ready, hand-over, no-show).
 *
 *   const run = useUndoableAction();
 *   run({ message: "Checked in K-014", perform: () => checkIn(), undo: () => undoCheckIn() });
 *
 * `perform` runs at once; `undo` is the reverse call, sent only if Undo is pressed within `durationMs`.
 */
export function useUndoableAction() {
  return useCallback(
    async ({
      message,
      perform,
      undo,
      durationMs,
    }: {
      message: string;
      perform: () => Promise<unknown> | unknown;
      undo: () => Promise<unknown> | unknown;
      durationMs?: number;
    }) => {
      await perform();
      showUndoToast({ message, onUndo: () => void undo(), ...(durationMs ? { durationMs } : {}) });
    },
    [],
  );
}
