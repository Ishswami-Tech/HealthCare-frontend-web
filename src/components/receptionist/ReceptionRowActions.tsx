"use client";

import Link from "next/link";
import { CalendarClock, MoreHorizontal, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReceptionVisit } from "./reception.logic";
import { RECEPTION_ROUTES, useReceptionNoShow } from "./useReceptionDesk";

/**
 * The "more" menu of a desk row and of the appointment page: Reschedule and Mark no-show
 * with a 5 s Undo. Items show only when the visit allows them. One doctor: no doctor picker.
 */
export function ReceptionRowActions({ visit, onChanged }: { visit: ReceptionVisit; onChanged?: () => void }) {
  const noShow = useReceptionNoShow();
  const hasAny = visit.canReschedule || visit.canMarkNoShow;
  if (!hasAny) return null;

  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
