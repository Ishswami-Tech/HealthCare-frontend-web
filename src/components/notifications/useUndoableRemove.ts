"use client";

import { useCallback, useState } from "react";
import { showUndoToast } from "@/components/tbd/undo-toast";

/**
 * Deferred removal for list rows: the row is hidden at once, an Undo toast stays for 5 s, and the
 * real delete call is only made when the timer ends without Undo.
 */
export function useUndoableRemove(commitRemove: (id: string) => Promise<void> | void) {
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(() => new Set());

  const setHidden = useCallback((id: string, hidden: boolean) => {
    setHiddenIds((current) => {
      const next = new Set(current);
      if (hidden) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const requestRemove = useCallback(
    (id: string) => {
      setHidden(id, true);
      showUndoToast({
        id: `notification-remove-${id}`,
        message: "Notification removed",
        onUndo: () => setHidden(id, false),
        onExpire: () => {
          void Promise.resolve(commitRemove(id)).finally(() => setHidden(id, false));
        },
      });
    },
    [commitRemove, setHidden],
  );

  return { hiddenIds, requestRemove };
}
