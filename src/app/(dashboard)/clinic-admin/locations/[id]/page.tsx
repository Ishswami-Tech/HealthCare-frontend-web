"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, Printer, QrCode, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmDialog,
  DialogError,
  Field,
  ListRow,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { LocationSwitch } from "@/components/clinic/LocationQrPoster";
import { CHECK_IN_CLOSES_MINUTES_AFTER, CHECK_IN_OPENS_MINUTES_BEFORE } from "@/lib/utils/appointmentUtils";
import {
  copyMondayToWeekdays,
  editDay,
  locationChanges,
  readWeekHours,
  WEEK_DAYS,
  weekHoursError,
  type DayHours,
  type LocationBasics,
  type WeekHours,
} from "@/components/clinic/location-hours.logic";
import { useCheckInLocationFor } from "@/hooks/query/useClinicQr";
import { useClinicHolidays } from "@/hooks/query/useClinicStaffAdmin";
import { useClinicLocations, useCurrentClinicId, useUpdateClinicLocation } from "@/hooks/query/useClinics";
import { formatDateKeyInIST, formatDateLabel } from "@/lib/utils/date-time";
import type { ClinicLocation } from "@/types/clinic.types";

type Basics = LocationBasics;

const basicsOf = (location: ClinicLocation): Basics => ({
  name: location.name ?? "",
  phone: location.phone ?? "",
  address: location.address ?? "",
  city: location.city ?? "",
  zipCode: location.zipCode ?? "",
});

// CaLocationEdit (B3): details, weekly hours, QR, holidays and open / close of one location.
export default function CaLocationEditPage() {
  const params = useParams<{ id: string }>();
  const locationId = String(params?.id ?? "");
  const clinicId = useCurrentClinicId();
  const locations = useClinicLocations(clinicId, { includeInactive: true });
  const update = useUpdateClinicLocation();
  const checkIn = useCheckInLocationFor(locationId);
  const holidays = useClinicHolidays({ from: formatDateKeyInIST(new Date()), locationId });
  const location = locations.data?.find((entry) => entry.id === locationId) ?? null;
  const [basics, setBasics] = useState<Basics | null>(null);
  const [hours, setHours] = useState<WeekHours | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);

  useEffect(() => {
    if (!location) return;
    setBasics(basicsOf(location));
    setHours(readWeekHours(location.workingHours));
  }, [location]);

  if (locations.error && !location) {
    return (
      <TbdPage title="Location" backHref="/clinic-admin/locations" backLabel="Locations">
        <LoadError title="Location could not be loaded" message={locations.error.message} onRetry={() => void locations.refetch()} />
      </TbdPage>
    );
  }
  if (!location || !basics || !hours) {
    return (
      <TbdPage title="Location" backHref="/clinic-admin/locations" backLabel="Locations">
        <Surface>{locations.isPending ? <SkeletonRows rows={6} /> : <p className="text-sm text-ink-muted">This location was not found.</p>}</Surface>
      </TbdPage>
    );
  }

  const setDay = (day: (typeof WEEK_DAYS)[number], patch: Partial<Omit<DayHours, "sessions">>) =>
    setHours((current) => (current ? editDay(current, day, patch) : current));
  const changes = locationChanges(basicsOf(location), basics, readWeekHours(location.workingHours), hours);
  const dirty = Object.keys(changes).length > 0;

  const save = async () => {
    setError(null);
    if (basics.name.trim().length < 2) {
      setError("Enter the location name.");
      return;
    }
    const problem = weekHoursError(hours);
    if (problem) {
      setError(problem);
      return;
    }
    if (!dirty) return;
    try {
      // Only what the admin changed: an untouched field (or hours) is never re-sent.
      await update.mutateAsync({ clinicId, locationId, data: changes });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The location could not be saved");
    }
  };

  const setActive = async (isActive: boolean) => {
    await update.mutateAsync({ clinicId, locationId, data: { isActive } });
    setCloseOpen(false);
  };

  return (
    <TbdPage
      title={
        <span className="flex items-center gap-2">
          {location.name} <Pill tone={location.isActive ? "green" : "slate"}>{location.isActive ? "Open" : "Closed"}</Pill>
        </span>
      }
      backHref="/clinic-admin/locations"
      backLabel="Locations"
      actions={
        <Button size="md" disabled={!dirty || update.isPending} onClick={() => void save()}>
          <Save aria-hidden="true" /> {update.isPending ? "Saving…" : "Save location"}
        </Button>
      }
    >
      <LocationSwitch currentId={locationId} locations={(locations.data ?? []).map((entry) => ({ id: entry.id, name: entry.name }))} />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Basic details" className="flex flex-col gap-3">
            <SectionTitle title="Basic details" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Location name" htmlFor="loc-name" required>
                <Input id="loc-name" value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })} />
              </Field>
              <Field label="Clinic phone" htmlFor="loc-phone">
                <Input id="loc-phone" value={basics.phone} onChange={(e) => setBasics({ ...basics, phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Address" htmlFor="loc-address">
              <Textarea id="loc-address" rows={2} value={basics.address} onChange={(e) => setBasics({ ...basics, address: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="City" htmlFor="loc-city">
                <Input id="loc-city" value={basics.city} onChange={(e) => setBasics({ ...basics, city: e.target.value })} />
              </Field>
              <Field label="PIN code" htmlFor="loc-zip">
                <Input id="loc-zip" value={basics.zipCode} onChange={(e) => setBasics({ ...basics, zipCode: e.target.value })} />
              </Field>
            </div>
            <Note tone="blue">Patient QR check-in opens {CHECK_IN_OPENS_MINUTES_BEFORE} minutes before the slot and closes {CHECK_IN_CLOSES_MINUTES_AFTER} minutes after it starts.</Note>
          </Surface>

          <Surface as="section" aria-label="Hours" className="flex flex-col gap-2">
            <SectionTitle
              title="Clinic hours"
              action={
                <Button variant="ghost" size="sm" onClick={() => setHours(copyMondayToWeekdays(hours))}>
                  Copy Monday to all weekdays
                </Button>
              }
            />
            {WEEK_DAYS.map((day) => (
              <div key={day} className="grid grid-cols-[90px_60px_1fr_1fr] items-center gap-3 text-sm">
                <span className="font-bold capitalize text-ink">{day.slice(0, 3)}</span>
                <Switch checked={hours[day].open} onCheckedChange={(open) => setDay(day, { open })} aria-label={`Open on ${day}`} />
                {hours[day].open && hours[day].sessions ? (
                  <button
                    type="button"
                    className="col-span-2 text-left text-ink-soft underline-offset-2 hover:underline"
                    title="Edit to replace the split sessions with one opening time"
                    onClick={() => setDay(day, { start: hours[day].start, end: hours[day].end })}
                  >
                    {(hours[day].sessions ?? []).map((session) => `${session.start}–${session.end}`).join(", ")}
                  </button>
                ) : hours[day].open ? (
                  <>
                    <Input type="time" aria-label={`${day} opens`} value={hours[day].start} onChange={(e) => setDay(day, { start: e.target.value })} />
                    <Input type="time" aria-label={`${day} closes`} value={hours[day].end} onChange={(e) => setDay(day, { end: e.target.value })} />
                  </>
                ) : (
                  <span className="col-span-2 text-ink-muted">Closed</span>
                )}
              </div>
            ))}
            <Note tone="blue">Doctor sessions are set in Schedule. Video visits are separate and keep the 5-hour join window.</Note>
            <DialogError message={error} />
          </Surface>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Check-in QR" className="flex flex-col gap-2">
            <SectionTitle title="Check-in QR" icon={QrCode} />
            <p className="text-sm text-ink-soft">
              {checkIn.row
                ? `QR is ${checkIn.row.isActive ? "on" : "off"}. Patients scan it at the door to check in at ${location.name} only.`
                : checkIn.isPending
                  ? "Loading…"
                  : "No check-in QR for this location yet."}
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/clinic-admin/locations/${locationId}/qr`}>
                  <QrCode aria-hidden="true" /> View QR
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/clinic-admin/locations/${locationId}/qr/print`}>
                  <Printer aria-hidden="true" /> Print poster
                </Link>
              </Button>
            </div>
          </Surface>

          <Surface as="section" aria-label="Holidays and closures">
            <SectionTitle
              title="Holidays and closures"
              icon={CalendarDays}
              action={
                <Link href="/clinic-admin/schedule/holidays" className="text-[13px] font-bold text-brand">
                  Manage
                </Link>
              }
            />
            {(holidays.data ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">{holidays.isPending ? "Loading…" : "Nothing upcoming."}</p>
            ) : (
              (holidays.data ?? []).slice(0, 4).map((holiday) => <ListRow key={holiday.id} title={holiday.title} description={formatDateLabel(holiday.startDate)} />)
            )}
          </Surface>

          <Surface as="section" aria-label="Close this location" className="flex flex-col gap-2">
            <SectionTitle title={location.isActive ? "Close this location" : "Reopen this location"} />
            <p className="text-sm text-ink-soft">
              {location.isActive ? "Stops new bookings and QR check-in. Existing bookings stay; tell patients first." : "Allows bookings and QR check-in again."}
            </p>
            <Button
              variant={location.isActive ? "danger" : "default"}
              size="sm"
              className="w-fit"
              disabled={update.isPending}
              onClick={() => (location.isActive ? setCloseOpen(true) : void setActive(true))}
            >
              {location.isActive ? "Deactivate location" : "Reopen location"}
            </Button>
          </Surface>
        </div>
      </div>

      <ConfirmDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title={`Deactivate ${location.name}?`}
        description="New bookings and QR check-in stop at this location. You can reopen it any time."
        confirmLabel="Deactivate"
        busyLabel="Saving…"
        tone="danger"
        busy={update.isPending}
        onConfirm={() => void setActive(false)}
      />
    </TbdPage>
  );
}
