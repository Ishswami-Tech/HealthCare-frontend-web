"use client";

import { useId, useMemo, useState } from "react";
import { CalendarOff, ChevronDown, Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChoiceChip,
  DateField,
  DialogError,
  EmptyBlock,
  Field,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SideDrawer,
  SideDrawerActions,
  SideDrawerBody,
  SkeletonRows,
  Surface,
  TbdPage,
  showUndoToast,
} from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext, useClinicLocations } from "@/hooks/query/useClinics";
import { useCancelLeave, useMyLeaveRequests, useRequestLeave, type CreateLeaveInput, type LeaveKind, type LeaveRequest } from "@/hooks/query/useLeaveRequests";
import { useRealTimeAppointments } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";
import { appointmentsInLeave, leaveProblem, LEAVE_KIND_LABEL, LEAVE_STATUS, sortLeave } from "./leave.logic";
import { DoctorWeeklyOPDSchedule } from "./DoctorWeeklyOPDSchedule";
import { DoctorScheduleCalendar } from "./DoctorScheduleCalendar";

const KINDS: LeaveKind[] = ["LEAVE", "HALF_DAY", "BREAK"];
const ALL_LOCATIONS = "__all";

/** The statuses that stay in the main list; everything else folds into "Past / cancelled". */
const ACTIVE_LEAVE_STATUSES = new Set<LeaveRequest["status"]>(["PENDING", "APPROVED"]);

/**
 * The leave rows, grouped: active (PENDING / APPROVED) rows first, then a collapsed
 * "Past / cancelled" sub-section the doctor can open when they need the history. The
 * cancelled pill noise of the main list disappears without losing the data.
 */
function LeaveRowList({
  rows,
  todayKey,
  onCancel,
  cancelling,
}: {
  rows: LeaveRequest[];
  todayKey: string;
  onCancel: (rowId: string) => void;
  cancelling: boolean;
}) {
  const [pastOpen, setPastOpen] = useState(false);
  const active = rows.filter((row) => ACTIVE_LEAVE_STATUSES.has(row.status));
  const inactive = rows.filter((row) => !ACTIVE_LEAVE_STATUSES.has(row.status));

  return (
    <>
      {active.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {active.map((row) => (
            <LeaveRow key={row.id} row={row} todayKey={todayKey} onCancel={onCancel} cancelling={cancelling} />
          ))}
        </ul>
      ) : null}

      {inactive.length > 0 ? (
        <div>
          <button
            type="button"
            className="flex w-full items-center gap-2 border-b border-hair px-5 py-2 text-[12px] font-bold text-ink-muted hover:text-ink"
            onClick={() => setPastOpen((open) => !open)}
            aria-expanded={pastOpen}
          >
            <ChevronDown className={`size-3.5 transition-transform ${pastOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            Past / cancelled ({inactive.length})
          </button>
          {pastOpen ? (
            <ul className="m-0 list-none p-0 opacity-80">
              {inactive.map((row) => (
                <InactiveLeaveRow key={row.id} row={row} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/** One active row (PENDING / APPROVED): full-height line, date tile, pill, cancel action. */
function LeaveRow({
  row,
  todayKey,
  onCancel,
  cancelling,
}: {
  row: LeaveRequest;
  todayKey: string;
  onCancel: (rowId: string) => void;
  cancelling: boolean;
}) {
  const status = LEAVE_STATUS[row.status] ?? LEAVE_STATUS.PENDING;
  const cancellable = ACTIVE_LEAVE_STATUSES.has(row.status) && row.endDate >= todayKey;
  const block = dayBlock(row.startDate);
  return (
    <li className="flex flex-wrap items-center gap-4 border-b border-hair px-5 py-3 last:border-b-0">
      <span className="flex w-12 shrink-0 flex-col items-center rounded-[12px] bg-mint-soft py-1.5 text-brand-dark">
        <span className="text-lg font-extrabold leading-none">{block.day}</span>
        <span className="text-[10px] font-extrabold tracking-[0.5px]">{block.month}</span>
      </span>
      <span className="flex min-w-[180px] flex-1 flex-col gap-0.5">
        <span className="text-sm font-bold text-ink">
          {LEAVE_KIND_LABEL[row.kind]}
          {row.reason ? <span className="font-medium text-ink-muted"> · {row.reason}</span> : null}
        </span>
        <span className="text-xs text-ink-muted">
          {rangeLabel(row)}
          {row.impactedAppointmentCount !== null
            ? ` · ${row.impactedAppointmentCount} booked ${row.impactedAppointmentCount === 1 ? "patient" : "patients"}`
            : ""}
          {row.patientsNotifiedAt ? " · patients told" : ""}
        </span>
        {row.decisionNote ? <span className="text-xs text-ink-soft">Admin: {row.decisionNote}</span> : null}
      </span>
      <Pill tone={status.tone} dot>
        {status.label}
      </Pill>
      {cancellable ? (
        <Button size="compact" variant="outline" disabled={cancelling} onClick={() => onCancel(row.id)}>
          Cancel
        </Button>
      ) : null}
    </li>
  );
}

/** One cancelled/declined row in the sub-section: a compact muted line, no pill stack. */
function InactiveLeaveRow({ row }: { row: LeaveRequest }) {
  const status = LEAVE_STATUS[row.status] ?? LEAVE_STATUS.PENDING;
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-hair px-5 py-2 last:border-b-0">
      <span className="flex w-11 shrink-0 flex-col items-center rounded-[10px] bg-muted py-1 text-ink-soft/70">
        <span className="text-sm font-extrabold leading-none">{dayBlock(row.startDate).day}</span>
        <span className="text-[10px] font-extrabold tracking-[0.5px]">{dayBlock(row.startDate).month}</span>
      </span>
      <span className="flex min-w-[150px] flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-bold text-ink-muted">
          {LEAVE_KIND_LABEL[row.kind]}
          {row.reason ? <span className="font-medium text-ink-soft/70"> · {row.reason}</span> : null}
        </span>
        <span className="text-xs text-ink-soft/70">{rangeLabel(row)}</span>
      </span>
      <Pill tone={status.tone} dot>
        {status.label}
      </Pill>
    </li>
  );
}

function dayBlock(date: string) {
  const parsed = new Date(`${date}T00:00:00+05:30`);
  return {
    day: formatDateInIST(parsed, { day: "numeric" }),
    month: formatDateInIST(parsed, { month: "short" }).toUpperCase(),
  };
}

function rangeLabel(row: Pick<LeaveRequest, "startDate" | "endDate" | "startTime" | "endTime" | "kind">): string {
  const from = formatDateInIST(new Date(`${row.startDate}T00:00:00+05:30`), { weekday: "short", day: "numeric", month: "short" });
  const to = formatDateInIST(new Date(`${row.endDate}T00:00:00+05:30`), { weekday: "short", day: "numeric", month: "short" });
  const days = row.startDate === row.endDate ? from : `${from} – ${to}`;
  return row.kind !== "LEAVE" && row.startTime && row.endTime ? `${days} · ${row.startTime}–${row.endTime}` : days;
}

/** DocLeave: the doctor's own schedule and time off — weekly OPD hours plus leave, reduced
 * hours or a break request that the clinic admin approves. */
export function DoctorLeaveContent() {
  const [adding, setAdding] = useState(false);
  // The IST day key the "Add leave" drawer should open pre-filled to, or null for "today".
  const [prefillDate, setPrefillDate] = useState<string | null>(null);
  const leave = useMyLeaveRequests();
  const cancel = useCancelLeave();
  const todayKey = formatDateKeyInIST(new Date());
  const rows = useMemo(() => sortLeave(leave.data ?? [], todayKey), [leave.data, todayKey]);

  // Open the drawer fresh (header button) or with a chosen day pre-filled (the calendar).
  // Leave can only start today or later, so a past day picked in the calendar falls back to
  // today instead of handing the drawer an invalid date.
  const openAddLeave = (dateKey: string | null) => {
    setPrefillDate(dateKey && dateKey < todayKey ? todayKey : dateKey);
    setAdding(true);
  };

  return (
    <TbdPage
      title="Your schedule & leave"
      description="See the month at a glance, check your weekly OPD hours, or ask for leave, reduced hours or a break. Leave goes to the clinic admin, who approves it and tells booked patients to reschedule."
      backHref="/doctor/profile"
      backLabel="Profile"
      actions={
        <Button size="md" onClick={() => openAddLeave(null)}>
          <Plus aria-hidden="true" />
          Add leave
        </Button>
      }
    >
      {/* "This month": the at-a-glance hero. A read-only calendar over the same data as the
          sections below it; its "Add leave" opens the drawer with that day's dates pre-filled. */}
      <DoctorScheduleCalendar onAddLeave={(dateKey) => openAddLeave(dateKey)} />

      {/* Section 2: the doctor's leave and break requests, with a single muted line carrying
          the notes that used to be two cards. */}
      <Surface flush as="section" aria-label="Your leave and breaks">
        <div className="border-b border-hair px-5 py-4">
          <SectionTitle icon={CalendarOff} title="Your leave and breaks" count={leave.data ? rows.length : undefined} />
        </div>
        {leave.isPending ? (
          <SkeletonRows rows={3} />
        ) : leave.error ? (
          <LoadError title="Your leave could not be loaded" message="Check the connection and try again." onRetry={() => void leave.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon={CalendarOff}
            title="No leave planned"
            description="Add a full day off, reduced hours or a break. Patients already booked in that time are told once it is approved."
          />
        ) : (
          <LeaveRowList rows={rows} todayKey={todayKey} onCancel={(rowId) => cancel.mutate(rowId)} cancelling={cancel.isPending} />
        )}
        {/* The info notes, consolidated into one muted line instead of cards. */}
        <div className="border-t border-hair px-5 py-3">
          <p className="m-0 text-[12px] leading-5 text-ink-muted">
            Clinic holidays are set by the clinic admin · A break never cancels a booked patient ·
            Video visits stop taking new bookings 5 hours ahead.
          </p>
        </div>
      </Surface>

      {/* Section 3: weekly OPD hours live here (and on the Profile's Availability tab — they
          edit the same record). */}
      <DoctorWeeklyOPDSchedule />

      {adding ? (
        <AddLeaveDrawer
          onClose={() => {
            setAdding(false);
            setPrefillDate(null);
          }}
          todayKey={todayKey}
          initialDate={prefillDate}
        />
      ) : null}
    </TbdPage>
  );
}

/**
 * The "Add leave" drawer. `initialDate` (an IST day key) pre-fills the From/To fields to
 * that day — the schedule calendar's "Add leave" shortcut does this; left undefined the
 * drawer opens on today, exactly as the header button has always behaved.
 */
function AddLeaveDrawer({
  onClose,
  todayKey,
  initialDate,
}: {
  onClose: () => void;
  todayKey: string;
  initialDate?: string | null;
}) {
  const id = useId();
  const { user } = useAuth();
  const { clinicId } = useClinicContext();
  const locations = useClinicLocations(clinicId || "", { enabled: Boolean(clinicId) });
  const request = useRequestLeave();
  const cancel = useCancelLeave();
  const [kind, setKind] = useState<LeaveKind>("LEAVE");
  const [startDate, setStartDate] = useState(initialDate ?? todayKey);
  const [endDate, setEndDate] = useState(initialDate ?? todayKey);
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("17:00");
  const [locationId, setLocationId] = useState(ALL_LOCATIONS);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const input: CreateLeaveInput = {
    kind,
    startDate,
    endDate: kind === "LEAVE" ? endDate : startDate,
    ...(kind !== "LEAVE" ? { startTime, endTime } : {}),
    ...(reason.trim() ? { reason: reason.trim().slice(0, 500) } : {}),
    ...(locationId !== ALL_LOCATIONS ? { locationId } : {}),
  };
  const problem = leaveProblem(input, todayKey);

  // The doctor's own appointments in the window: the "N booked patients" preview.
  const appointments = useRealTimeAppointments({
    doctorId: user?.id || undefined,
    startDate: input.startDate,
    endDate: input.endDate,
    limit: 500,
  } as Parameters<typeof useRealTimeAppointments>[0]);
  const impacted = useMemo(() => {
    const raw = appointments.data as { data?: unknown } | undefined;
    const list = Array.isArray(raw?.data) ? (raw.data as unknown[]) : [];
    return problem ? [] : appointmentsInLeave(list, input);
    // `input` is rebuilt every render; its fields are the real dependencies.
  }, [appointments.data, problem, kind, startDate, endDate, startTime, endTime, locationId]);

  const save = async () => {
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    try {
      const created = await request.mutateAsync(input);
      onClose();
      showUndoToast({
        message: "Leave sent to the clinic admin for approval.",
        durationMs: 30_000,
        onUndo: () => {
          if (created?.id) cancel.mutate(created.id);
        },
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The leave could not be saved.");
    }
  };

  const locationList = (locations.data ?? []) as { id?: string; name?: string }[];

  return (
    <SideDrawer open onClose={onClose} title="Add leave" description="Goes to the clinic admin for approval." width={480} busy={request.isPending}>
      <SideDrawerBody>
        <Field label="Type">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Type of leave">
            {KINDS.map((option) => (
              <ChoiceChip key={option} shape="box" active={kind === option} onClick={() => setKind(option)}>
                {LEAVE_KIND_LABEL[option]}
              </ChoiceChip>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={kind === "LEAVE" ? "From" : "Day"} htmlFor={`${id}-from`}>
            <DateField
              id={`${id}-from`}
              value={startDate}
              min={todayKey}
              onChange={(value) => {
                setStartDate(value);
                if (endDate < value) setEndDate(value);
              }}
            />
          </Field>
          {kind === "LEAVE" ? (
            <Field label="To" htmlFor={`${id}-to`}>
              <DateField id={`${id}-to`} value={endDate} min={startDate || todayKey} onChange={setEndDate} />
            </Field>
          ) : null}
        </div>
        {kind !== "LEAVE" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From time" htmlFor={`${id}-start`}>
              <Input id={`${id}-start`} type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </Field>
            <Field label="To time" htmlFor={`${id}-end`}>
              <Input id={`${id}-end`} type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </Field>
          </div>
        ) : null}
        <Field label="Applies to" htmlFor={`${id}-location`}>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger id={`${id}-location`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LOCATIONS}>All my clinic locations</SelectItem>
              {locationList
                .filter((location) => location.id)
                .map((location) => (
                  <SelectItem key={location.id} value={String(location.id)}>
                    {location.name || "Location"}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Reason (optional)" htmlFor={`${id}-reason`}>
          <Textarea id={`${id}-reason`} value={reason} maxLength={500} className="min-h-[72px] border-line" placeholder="Conference, personal leave..." onChange={(event) => setReason(event.target.value)} />
        </Field>

        <Note tone={impacted.length > 0 ? "amber" : "green"} icon={Users}>
          {appointments.isFetching && !appointments.data ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Checking your bookings...
            </span>
          ) : impacted.length > 0 ? (
            <>
              <strong className="font-bold">
                {impacted.length} booked {impacted.length === 1 ? "patient" : "patients"}
              </strong>{" "}
              will be told to reschedule once the clinic admin approves.
            </>
          ) : (
            "No booked patients in this time."
          )}
        </Note>
        <DialogError lead="Not saved." message={error} />
      </SideDrawerBody>
      <SideDrawerActions>
        <Button variant="outline" size="md" disabled={request.isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button size="md" disabled={request.isPending || Boolean(problem)} onClick={() => void save()}>
          {request.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Send for approval
        </Button>
      </SideDrawerActions>
    </SideDrawer>
  );
}
