"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import {
  EmptyBlock,
  InitialsAvatar,
  ListRow,
  LoadError,
  Pager,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  serverPaging,
  type PillTone,
} from "@/components/tbd";
import type { InPersonStage, InPersonVisit } from "@/types/in-person.types";
import { RECEPTION_ROUTES, useReceptionDeskBoard } from "./useReceptionDesk";

const STAGE_PILL: Record<InPersonStage, { label: string; tone: PillTone }> = {
  BOOKED: { label: "Booked", tone: "slate" },
  CHECKED_IN: { label: "Waiting", tone: "amber" },
  WITH_DOCTOR: { label: "With doctor", tone: "blue" },
  COMPLETED: { label: "Done", tone: "green" },
  NO_SHOW: { label: "Missed", tone: "rose" },
  EXPIRED: { label: "Expired", tone: "slate" },
  CANCELLED: { label: "Cancelled", tone: "slate" },
};

function stagePill(stage: InPersonStage): { label: string; tone: PillTone } {
  return STAGE_PILL[stage] ?? { label: String(stage || "Booked"), tone: "slate" };
}

function rowDescription(visit: InPersonVisit): string {
  return [visit.time, visit.doctorName, visit.token ? `token ${visit.token}` : ""].filter(Boolean).join(" · ");
}

/**
 * Today's in-clinic board of the reception location (`GET /in-person/desk`), paged by the server
 * (100 rows a page). The count in the title is the whole day's; the pager only appears when the
 * backend pages the board and the day needs more than one page.
 */
export function ReceptionDeskBoard() {
  const [page, setPage] = useState(1);
  const board = useReceptionDeskBoard(page);
  const paging = serverPaging({
    page: board.page,
    pageSize: board.pageSize,
    total: board.total,
    pageCount: board.pageCount,
    rowCount: board.visits.length,
    onPageChange: setPage,
  });

  return (
    <Surface flush as="section" aria-label="In-clinic board" className="gap-0">
      <div className="px-5 pb-2 pt-5">
        <SectionTitle
          title="In-clinic board"
          count={board.total}
          description="Every in-clinic appointment at your location today, in slot order."
        />
      </div>
      {board.isLoading && board.visits.length === 0 ? (
        <div className="px-5 pb-5">
          <SkeletonRows rows={4} />
        </div>
      ) : board.error && board.visits.length === 0 ? (
        <div className="px-5 pb-5">
          <LoadError
            title="The board could not be loaded"
            message={board.error.message}
            onRetry={() => void board.refetch()}
          />
        </div>
      ) : board.visits.length === 0 ? (
        <EmptyBlock
          icon={ClipboardList}
          title="No in-clinic visits today"
          description="Visits booked at your location for today show here."
          className="py-8"
        />
      ) : (
        <div className="px-5 pb-2">
          {board.visits.map((visit) => {
            const pill = stagePill(visit.stage);
            return (
              <ListRow
                key={visit.appointmentId}
                href={RECEPTION_ROUTES.appointment(visit.appointmentId)}
                left={<InitialsAvatar name={visit.patientName} size={34} />}
                title={visit.patientName}
                description={rowDescription(visit)}
                right={<Pill tone={pill.tone}>{pill.label}</Pill>}
              />
            );
          })}
        </div>
      )}
      {board.isPaged ? (
        <Pager paging={paging} noun="visits" hideWhenSinglePage busy={board.isFetching} label="Board pages" id="desk-board-pager" />
      ) : null}
    </Surface>
  );
}
