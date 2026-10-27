"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, CalendarClock, MoreHorizontal, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CancelVisitDialog } from "@/components/appointments/manager/ManagerDialogs";
import type { ReceptionVisit } from "./reception.logic";
import { RECEPTION_ROUTES, useReceptionCancel, useReceptionNoShow } from "./useReceptionDesk";

/**
 * The "more" menu of a desk row and of the appointment page: Reschedule, Cancel and Mark no-show
 * with a 5 s Undo. Items show only when the visit allows them. One doctor: no doctor picker.
 */
export function ReceptionRowActions({ visit, onChanged }: { visit: ReceptionVisit; onChanged?: () => void }) {
  const noShow = useReceptionNoShow();
  const { cancel, isPending: cancelling } = useReceptionCancel();
  const [cancelOpen, setCancelOpen] = useState(false);
  const hasAny = visit.canReschedule || visit.canMarkNoShow || visit.canCancel;
  if (!hasAny) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={`More actions for ${visit.patientName}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {visit.canReschedule ? (
            <DropdownMenuItem asChild>
              <Link href={RECEPTION_ROUTES.reschedule(visit.id)}>
                <CalendarClock aria-hidden="true" /> Reschedule
              </Link>
            </DropdownMenuItem>
          ) : null}
          {visit.canMarkNoShow ? (
            <DropdownMenuItem disabled={noShow.isPending} onSelect={() => void noShow.mark(visit).then(onChanged)}>
              <UserX aria-hidden="true" /> Mark no-show
            </DropdownMenuItem>
          ) : null}
          {visit.canCancel ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setCancelOpen(true)}>
              <Ban aria-hidden="true" /> Cancel
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <CancelVisitDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        visit={{ title: visit.patientName, whenLabel: visit.whenLabel }}
        submitting={cancelling}
        onConfirm={() =>
          void cancel(visit).then(() => {
            setCancelOpen(false);
            onChanged?.();
          })
        }
      />
    </>
  );
}
