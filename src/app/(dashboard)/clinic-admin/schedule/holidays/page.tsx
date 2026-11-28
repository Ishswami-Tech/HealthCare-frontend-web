"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ChoiceChip,
  DateField,
  DialogActions,
  DialogBody,
  DialogError,
  DialogShell,
  EmptyBlock,
  Field,
  ListRow,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  showUndoToast,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { LeaveDecisionCard } from "@/components/clinic-admin/LeaveDecisionCard";
import { coversDay, dayKey, isoDay, monthBounds, monthGrid } from "@/components/clinic-admin/holiday-calendar.logic";
import {
  useClinicHolidays,
  useDeleteClinicHoliday,
  useLeaveRequests,
  useSaveClinicHoliday,
} from "@/hooks/query/useClinicStaffAdmin";
import { useClinicLocations, useCurrentClinicId } from "@/hooks/query/useClinics";
import { formatDateLabel } from "@/lib/utils/date-time";
import { cn } from "@/lib/utils";
import type { ClinicHoliday, HolidayKind } from "@/types/clinic-admin-ops.types";

const KIND_LABEL: Record<HolidayKind, string> = { HOLIDAY: "Clinic holiday", CLOSURE: "Reduced hours / closure", DOCTOR_LEAVE: "Doctor leave" };
const KIND_CLASS: Record<HolidayKind, string> = {
  HOLIDAY: "bg-[#ffe4e6] text-[#be123c]",
  CLOSURE: "bg-[#fef3c7] text-[#92400e]",
  DOCTOR_LEAVE: "bg-[#fef3c7] text-[#92400e]",
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// CaHolidayEditor (B2): closures, doctor leave and pending staff leave on one calendar.
export default function CaHolidayEditorPage() {
  const clinicId = useCurrentClinicId();
  const today = dayKey(new Date());
  const [cursor, setCursor] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));
  const bounds = monthBounds(cursor.year, cursor.month);
  const holidays = useClinicHolidays({ from: bounds.from, to: bounds.to });
  const upcoming = useClinicHolidays({ from: today });
  const pendingLeave = useLeaveRequests({ status: "PENDING" });
  const locations = useClinicLocations(clinicId);
  const remove = useDeleteClinicHoliday();
  const [editing, setEditing] = useState<ClinicHoliday | "new" | null>(null);

  const grid = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const locationName = (id: string | null) => (id ? locations.data?.find((entry) => entry.id === id)?.name ?? "One location" : "All locations");
  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const date = new Date(year, month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  return (
    <TbdPage
      title="Closures, doctor leave and their impact"
      backHref="/clinic-admin/schedule"
      backLabel="Schedule"
      actions={
        <Button size="md" onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" /> Add holiday or leave
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Surface as="section" aria-label="Calendar">
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => shift(-1)}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span className="font-extrabold text-ink">{monthLabel}</span>
            <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => shift(1)}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          {holidays.error ? (
            <LoadError title="Holidays could not be loaded" message={holidays.error.message} onRetry={() => void holidays.refetch()} />
          ) : (
            <div className="grid grid-cols-7 gap-1 text-xs">
              {WEEKDAYS.map((day) => (
                <span key={day} className="py-1 text-center font-extrabold uppercase text-ink-muted">
                  {day}
                </span>
              ))}
              {grid.map((cell) => {
                const entries = (holidays.data ?? []).filter((holiday) => coversDay(holiday, cell.day));
                return (
                  <div
                    key={cell.day}
                    className={cn(
                      "flex min-h-[72px] flex-col gap-0.5 rounded-lg border border-hair p-1",
                      !cell.inMonth && "opacity-40",
                      cell.day === today && "border-brand",
                    )}
                  >
                    <span className="font-bold text-ink-soft">{Number(cell.day.slice(8))}</span>
                    {entries.slice(0, 2).map((holiday) => (
                      <button
                        type="button"
                        key={holiday.id}
                        onClick={() => setEditing(holiday)}
                        className={cn("truncate rounded px-1 text-left text-[10px] font-bold", KIND_CLASS[holiday.kind])}
                        title={`${holiday.title} · ${locationName(holiday.locationId)}`}
                      >
                        {holiday.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <Note tone="blue" className="mt-3">Clinic QR check-in is switched off automatically on closed days.</Note>
        </Surface>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Upcoming">
            <SectionTitle title="Upcoming" icon={CalendarDays} />
            {upcoming.isPending ? (
              <SkeletonRows rows={3} />
            ) : (upcoming.data ?? []).length === 0 ? (
              <EmptyBlock icon={CalendarDays} title="Nothing scheduled" />
            ) : (
              (upcoming.data ?? []).slice(0, 8).map((holiday) => (
                <ListRow
                  key={holiday.id}
                  title={holiday.title}
                  description={`${formatDateLabel(holiday.startDate)}${isoDay(holiday.endDate) !== isoDay(holiday.startDate) ? ` – ${formatDateLabel(holiday.endDate)}` : ""} · ${locationName(holiday.locationId)}${holiday.notifiedCount ? ` · ${holiday.notifiedCount} notified` : ""}`}
                  right={
                    <span className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(holiday)}>
                        Edit
                      </Button>
                      <Button size="icon" variant="ghost" aria-label={`Remove ${holiday.title}`} disabled={remove.isPending} onClick={() => remove.mutate(holiday.id)}>
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </span>
                  }
                />
              ))
            )}
          </Surface>
          <Surface as="section" aria-label="Pending leave">
            <SectionTitle title="Pending leave" count={pendingLeave.data?.length ?? 0} />
            <div className="flex flex-col gap-3">
              {(pendingLeave.data ?? []).map((leave) => (
                <LeaveDecisionCard key={leave.id} leave={leave} />
              ))}
              {!pendingLeave.isPending && (pendingLeave.data ?? []).length === 0 ? <p className="text-sm text-ink-muted">No leave waiting for a decision.</p> : null}
            </div>
          </Surface>
        </div>
      </div>

      <HolidayDialog
        open={editing !== null}
        holiday={editing === "new" ? null : editing}
        locations={(locations.data ?? []).map((entry) => ({ id: entry.id, name: entry.name }))}
        onClose={() => setEditing(null)}
      />
    </TbdPage>
  );
}

function HolidayDialog({
  open,
  holiday,
  locations,
  onClose,
}: {
  open: boolean;
  holiday: ClinicHoliday | null;
  locations: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const save = useSaveClinicHoliday();
  return (
    <DialogShell open={open} onClose={onClose} busy={save.isPending} title={holiday ? "Edit holiday or leave" : "Add holiday or leave"} width={560}>
      {open ? <HolidayForm key={holiday?.id ?? "new"} holiday={holiday} locations={locations} onClose={onClose} save={save} /> : null}
    </DialogShell>
  );
}

function HolidayForm({
  holiday,
  locations,
  onClose,
  save,
}: {
  holiday: ClinicHoliday | null;
  locations: Array<{ id: string; name: string }>;
  onClose: () => void;
  save: ReturnType<typeof useSaveClinicHoliday>;
}) {
  const remove = useDeleteClinicHoliday();
  const [kind, setKind] = useState<HolidayKind>(holiday?.kind ?? "HOLIDAY");
  const [title, setTitle] = useState(holiday?.title ?? "");
  const [startDate, setStartDate] = useState(holiday ? isoDay(holiday.startDate) : "");
  const [endDate, setEndDate] = useState(holiday ? isoDay(holiday.endDate) : "");
  const [locationIds, setLocationIds] = useState<string[]>(holiday?.locationId ? [holiday.locationId] : []);
  const [notify, setNotify] = useState(holiday?.notifyPatients ?? true);
  const [message, setMessage] = useState(
    holiday?.messageTemplate ?? "Hello {name}, the clinic will be closed on {date}. Please choose a new time for your visit. We are sorry for the inconvenience.",
  );
  const [error, setError] = useState<string | null>(null);
  // Create flow, one record per location: what is already saved (location id, "" = all locations ->
  // record id), so a retry after a partial failure only creates the missing ones.
  const [savedByLocation, setSavedByLocation] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const submit = async () => {
    setError(null);
    if (!title.trim() || !startDate) {
      setError("Enter a title and the start date.");
      return;
    }
    const base = {
      title: title.trim(),
      kind,
      startDate,
      endDate: endDate || startDate,
      notifyPatients: notify,
      ...(notify && message.trim() ? { messageTemplate: message.trim() } : {}),
    };
    if (holiday) {
      // UpdateClinicHolidayDto has no locationId (unknown keys are rejected): the location of an
      // existing entry cannot change, so it is never sent on edit.
      try {
        await save.mutateAsync({ id: holiday.id, input: base });
        onClose();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The holiday could not be saved");
      }
      return;
    }

    // One record per chosen location (none chosen = all locations). Skip the ones a previous attempt saved.
    const targets = locationIds.length > 0 ? locationIds : [""];
    const saved: Record<string, string> = { ...savedByLocation };
    let failure: unknown = null;
    for (const locationId of targets) {
      if (saved[locationId]) continue;
      try {
        const row = await save.mutateAsync({ input: { ...base, ...(locationId ? { locationId } : {}) } });
        saved[locationId] = row.id;
      } catch (caught) {
        failure = caught;
        break;
      }
    }
    setSavedByLocation(saved);
    const created = Object.values(saved);
    if (failure) {
      void queryClient.invalidateQueries({ queryKey: ["clinic-holidays"] });
      const savedNames = targets
        .filter((locationId) => saved[locationId])
        .map((locationId) => (locationId ? locations.find((entry) => entry.id === locationId)?.name ?? "One location" : "All locations"));
      const reason = failure instanceof Error ? failure.message : "The holiday could not be saved";
      setError(
        savedNames.length > 0
          ? `Saved for ${savedNames.join(", ")}; the rest failed: ${reason}. Save again to add only the missing locations.`
          : reason,
      );
      return;
    }
    onClose();
    showUndoToast({
      message: created.length > 1 ? `${created.length} entries saved.` : "Holiday saved.",
      durationMs: 30_000,
      onUndo: () => {
        for (const id of created) remove.mutate(id);
      },
    });
  };

  return (
    <>
      <DialogBody>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind">
          {(Object.keys(KIND_LABEL) as HolidayKind[]).map((value) => (
            <ChoiceChip key={value} active={kind === value} onClick={() => setKind(value)}>
              {KIND_LABEL[value]}
            </ChoiceChip>
          ))}
        </div>
        <Field label="Title" htmlFor="hol-title" required>
          <Input id="hol-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Diwali – Lakshmi Pujan" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From" htmlFor="hol-from" required>
            <DateField id="hol-from" value={startDate} onChange={setStartDate} />
          </Field>
          <Field label="To" htmlFor="hol-to">
            <DateField id="hol-to" value={endDate} onChange={setEndDate} {...(startDate ? { min: startDate } : {})} />
          </Field>
        </div>
        {holiday ? (
          <Field label="Applies to" hint="The location cannot be changed. To move it, remove this entry and add a new one.">
            <p className="m-0 text-sm font-bold text-ink">
              {holiday.locationId ? locations.find((entry) => entry.id === holiday.locationId)?.name ?? "One location" : "All locations"}
            </p>
          </Field>
        ) : (
          <Field label="Applies to (none = all locations)">
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <ChoiceChip
                  key={location.id}
                  active={locationIds.includes(location.id)}
                  onClick={() =>
                    setLocationIds((current) =>
                      current.includes(location.id) ? current.filter((id) => id !== location.id) : [...current, location.id],
                    )
                  }
                >
                  {location.name}
                  {savedByLocation[location.id] ? " · saved" : ""}
                </ChoiceChip>
              ))}
            </div>
          </Field>
        )}
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm">
          <span className="font-bold text-ink">Notify booked patients on WhatsApp and SMS</span>
          <Switch checked={notify} onCheckedChange={setNotify} />
        </label>
        {notify ? (
          <Field label="Message" htmlFor="hol-msg" hint="{name} and {date} are filled in for each patient.">
            <Textarea id="hol-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
        ) : null}
        {holiday?.notifiedCount ? <Pill tone="green">{holiday.notifiedCount} patients already notified</Pill> : null}
        <DialogError message={error} />
      </DialogBody>
      <DialogActions>
        <Button variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button onClick={() => void submit()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </>
  );
}
