"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox, Note, Pill, ReasonDialog } from "@/components/tbd";
import { useDecideLeave, useLeaveImpact } from "@/hooks/query/useClinicStaffAdmin";
import { formatDateLabel } from "@/lib/utils/date-time";
import { roleLabel } from "@/components/billing/staff/billing.logic";
import type { LeaveRequest } from "@/types/clinic-admin-ops.types";

const KIND_LABEL: Record<LeaveRequest["kind"], string> = { LEAVE: "Leave", HALF_DAY: "Half day", BREAK: "Break" };

export function leaveRangeLabel(leave: Pick<LeaveRequest, "startDate" | "endDate">): string {
  const start = formatDateLabel(leave.startDate);
  const end = formatDateLabel(leave.endDate);
  return start === end ? start : `${start} – ${end}`;
}

/**
 * One leave request with the clinic admin's decision: impact preview ("N booked patients will be
 * notified"), Approve, Decline with a note. Shared by CaNotifications, CaStaffDetail and the
 * holiday editor's pending list.
 */
export function LeaveDecisionCard({ leave, showProfileLink = true }: { leave: LeaveRequest; showProfileLink?: boolean }) {
  const decide = useDecideLeave();
  const [showImpact, setShowImpact] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const impact = useLeaveImpact(showImpact ? leave.id : null);
  const pending = leave.status === "PENDING";
  const count = impact.data?.impactedAppointmentCount ?? leave.impactedAppointmentCount;

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line p-4">
      <div className="flex items-start gap-3">
        <IconBox icon={CalendarOff} tone="amber" size={36} />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-ink">
            {KIND_LABEL[leave.kind]} request · {leave.requesterName}, {roleLabel(leave.requesterRole)}
          </p>
          <p className="text-sm text-ink-soft">
            {leaveRangeLabel(leave)}
            {leave.startTime ? ` · ${leave.startTime}–${leave.endTime ?? ""}` : ""}
            {leave.reason ? ` · ${leave.reason}` : ""}
          </p>
          {leave.coverName ? <p className="text-xs text-ink-muted">Cover: {leave.coverName}</p> : null}
        </div>
        <Pill tone={pending ? "amber" : leave.status === "APPROVED" ? "green" : "slate"}>{leave.status.toLowerCase()}</Pill>
      </div>

      {showImpact ? (
        <Note tone={count > 0 ? "amber" : "green"}>
          {impact.isPending
            ? "Checking booked patients…"
            : count > 0
              ? `${count} booked patient${count === 1 ? "" : "s"} will be notified to reschedule.`
              : "No booked patients are affected."}
        </Note>
      ) : null}

      {pending ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ leaveId: leave.id, decision: "APPROVE" })}>
            <Check aria-hidden="true" /> Approve
          </Button>
          <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => setDeclineOpen(true)}>
            <X aria-hidden="true" /> Decline
          </Button>
          {!showImpact ? (
            <Button size="sm" variant="ghost" onClick={() => setShowImpact(true)}>
              See impact on bookings
            </Button>
          ) : null}
          {showProfileLink ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/clinic-admin/staff/${leave.userId}`}>View profile</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <ReasonDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline leave request?"
        description={`${leave.requesterName} is told the reason.`}
        presets={["No cover available", "Clinic is short-staffed", "Please pick other dates"]}
        required={false}
        confirmLabel="Decline"
        busyLabel="Declining…"
        busy={decide.isPending}
        onConfirm={(note) =>
          void decide
            .mutateAsync({ leaveId: leave.id, decision: "DECLINE", ...(note ? { note } : {}) })
            .then(() => setDeclineOpen(false))
            .catch(() => undefined)
        }
      />
    </div>
  );
}
