"use client";

import { useState } from "react";
import { FilterChips, Note, SegTabs, Surface, TbdPage } from "@/components/tbd";
import { AssistantAppointmentsTable } from "./AssistantAppointmentsTable";
import { useAssistantDay } from "./useAssistantDay";

type DayRange = "TODAY" | "UPCOMING" | "PAST";
type VisitKind = "ALL" | "CLINIC" | "VIDEO";

const RANGES: Record<DayRange, { fromDays: number; toDays: number }> = {
  TODAY: { fromDays: 0, toDays: 0 },
  UPCOMING: { fromDays: 1, toDays: 7 },
  PAST: { fromDays: -7, toDays: -1 },
};

/** AsAppointments: the doctor's appointments as the assistant works them (no start / complete). */
export function AssistantAppointmentsScreen() {
  const [range, setRange] = useState<DayRange>("TODAY");
  const [kind, setKind] = useState<VisitKind>("ALL");
  const day = useAssistantDay(RANGES[range]);
  const rows = day.appointments.filter((appointment) => (kind === "ALL" ? true : kind === "VIDEO" ? appointment.isVideo : !appointment.isVideo));
  const count = (wanted: VisitKind) =>
    day.appointments.filter((appointment) => (wanted === "ALL" ? true : wanted === "VIDEO" ? appointment.isVideo : !appointment.isVideo)).length;
  const doctor = day.doctor.doctorName || "the doctor";

  return (
    <TbdPage title="Appointments" description={`${doctor}'s appointments. You prepare drafts and dispense; the doctor calls, starts and completes each visit.`}>
      <Surface flush>
        <div className="flex flex-col gap-3 border-b border-hair px-5 py-3.5 md:flex-row md:items-center md:justify-between">
          <SegTabs<DayRange>
            ariaLabel="Day"
            value={range}
            onChange={setRange}
            options={[
              { value: "TODAY", label: "Today" },
              { value: "UPCOMING", label: "Next 7 days" },
              { value: "PAST", label: "Past 7 days" },
            ]}
          />
          <FilterChips<VisitKind>
            ariaLabel="Visit type"
            value={kind}
            onChange={setKind}
            options={[
              { value: "ALL", label: "All", count: count("ALL") },
              { value: "CLINIC", label: "In-clinic", count: count("CLINIC") },
              { value: "VIDEO", label: "Video", count: count("VIDEO") },
            ]}
          />
        </div>
        <AssistantAppointmentsTable
          appointments={rows}
          loading={day.appointmentsLoading}
          error={day.appointmentsError}
          onRetry={day.refetch}
          emptyDescription={range === "TODAY" ? "Nothing is booked for today." : "Nothing is booked in this range."}
        />
      </Surface>
      <Note tone="blue">
        In-clinic patients join the queue when they check in at the clinic. Video visits have no queue; the doctor runs the call.
      </Note>
    </TbdPage>
  );
}
