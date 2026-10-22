"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChoiceChip,
  EmptyBlock,
  Field,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  statusLabel,
  statusTone,
  SummaryLine,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { BookingDateStrip } from "@/components/appointments/booking/BookingDateStrip";
import { useUserProfile } from "@/hooks/query/useUsers";
import { useCancelLabBooking, useCreateLabBooking, useLabCatalog, useMyLabBookings } from "@/hooks/query/useLabBookings";
import { asRow, text } from "@/components/patient/home/homeData";
import { formatDateInIST, formatISODateInIST } from "@/lib/utils/date-time";
import { cn } from "@/lib/utils";
import type { LabBooking } from "@/lib/actions/lab-bookings.server";

const DAYS_AHEAD = 7;
const CANCELLABLE = new Set(["REQUESTED", "CONFIRMED"]);

/** Pickup days: tomorrow and the six days after it. */
function pickupDays() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: DAYS_AHEAD }, (_, index) => ({
    date: new Date(start.getTime() + (index + 1) * 24 * 60 * 60 * 1000),
    disabled: false,
  }));
}

/** "07:00-09:00" -> "7:00 – 9:00 AM" style label. */
function windowLabel(window: string): string {
  const [from, to] = window.split("-");
  const format = (value?: string) => {
    const [hours, minutes] = String(value ?? "").split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value ?? "";
    const suffix = (hours ?? 0) >= 12 ? "PM" : "AM";
    const hour12 = (hours ?? 0) % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
  };
  return to ? `${format(from)} – ${format(to)}` : window;
}

function MyBookings() {
  const bookings = useMyLabBookings();
  const cancel = useCancelLabBooking();
  const rows: LabBooking[] = bookings.data ?? [];
  if (bookings.isPending) return <SkeletonRows rows={2} />;
  if (bookings.error) {
    return <LoadError title="Your bookings could not be loaded" message={bookings.error.message} onRetry={() => void bookings.refetch()} />;
  }
  if (rows.length === 0) return <p className="m-0 text-[13px] text-ink-muted">No home lab bookings yet.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {rows.map((booking) => (
        <li key={booking.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line px-4 py-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold text-ink">{booking.packageName}</span>
            <span className="truncate text-xs text-ink-muted">
              {formatDateInIST(`${booking.slotDate}T00:00:00+05:30`, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
              {windowLabel(booking.slotWindow)} · {booking.addressLine}
            </span>
          </span>
          <Pill tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Pill>
          {CANCELLABLE.has(booking.status) ? (
            <Button variant="outline" size="md" disabled={cancel.isPending} onClick={() => void cancel.mutateAsync(booking.id).catch(() => undefined)}>
              Cancel
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** WebLabBooking: book a home sample pickup (`POST /lab-bookings`). No prices and no payment on this screen. */
export default function PatientLabBookingPage() {
  const catalog = useLabCatalog();
  const profile = useUserProfile();
  const create = useCreateLabBooking();
  const days = useMemo(() => pickupDays(), []);
  const profileRow = asRow(profile.data);

  const [packageCode, setPackageCode] = useState("");
  const [day, setDay] = useState<Date | undefined>(days[0]?.date);
  const [slotWindow, setSlotWindow] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Until the patient types, the address comes from the profile.
  const addressValue = address ?? text(profileRow?.address);
  const cityValue = city ?? text(profileRow?.city);
  const zipValue = zipCode ?? text(profileRow?.zipCode);
  const packages = catalog.data?.packages ?? [];
  const windows = catalog.data?.slotWindows ?? [];
  const chosen = packages.find((entry) => entry.code === packageCode);
  const ready = Boolean(chosen && day && slotWindow && addressValue.trim());

  const submit = async () => {
    if (!chosen || !day || !slotWindow || !addressValue.trim()) return;
    try {
      await create.mutateAsync({
        packageCode: chosen.code,
        packageName: chosen.name,
        tests: chosen.tests,
        addressLine: addressValue.trim(),
        ...(cityValue.trim() ? { city: cityValue.trim() } : {}),
        ...(zipValue.trim() ? { zipCode: zipValue.trim() } : {}),
        slotDate: formatISODateInIST(day),
        slotWindow,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setPackageCode("");
      setSlotWindow("");
      setNotes("");
    } catch {
      // The mutation hook shows the error toast; the form keeps the choices.
    }
  };

  return (
    <TbdPage
      title="Book a lab test at home"
      description="A trained phlebotomist visits you to collect the sample. Reports appear in Reports & Lab."
      backHref="/patient/health/reports"
      backLabel="Reports"
    >
      {catalog.isPending ? (
        <SkeletonRows rows={4} />
      ) : catalog.error ? (
        <Surface flush>
          <LoadError title="Lab packages could not be loaded" message={catalog.error.message} onRetry={() => void catalog.refetch()} />
        </Surface>
      ) : packages.length === 0 ? (
        <Surface flush>
          <EmptyBlock icon={FlaskConical} title="No lab packages yet" description="Home lab tests are not offered by your clinic yet." />
        </Surface>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Surface as="section" aria-label="Book a lab test" className="gap-6">
            <section className="flex flex-col gap-2.5" aria-label="Package">
              <SectionTitle title="1. Choose a package" />
              <div role="radiogroup" aria-label="Package" className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {packages.map((entry) => {
                  const active = entry.code === packageCode;
                  return (
                    <button
                      key={entry.code}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPackageCode(entry.code)}
                      className={cn(
                        "flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition-colors",
                        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                        active ? "border-brand bg-mint-soft" : "border-line bg-card hover:bg-mint-soft",
                      )}
                    >
                      <span className="text-sm font-bold text-ink">{entry.name}</span>
                      <span className="line-clamp-2 text-xs text-ink-muted">
                        {entry.tests.length} tests · {entry.tests.slice(0, 4).join(", ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-3" aria-label="Address">
              <SectionTitle title="2. Collection address" />
              <Field label="House / street, area" htmlFor="lab-address" required>
                <Input id="lab-address" autoComplete="street-address" value={addressValue} onChange={(event) => setAddress(event.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="City" htmlFor="lab-city">
                  <Input id="lab-city" autoComplete="address-level2" value={cityValue} onChange={(event) => setCity(event.target.value)} />
                </Field>
                <Field label="PIN code" htmlFor="lab-zip">
                  <Input id="lab-zip" inputMode="numeric" autoComplete="postal-code" value={zipValue} onChange={(event) => setZipCode(event.target.value)} />
                </Field>
              </div>
            </section>

            <section className="flex flex-col gap-3" aria-label="Date and time">
              <SectionTitle title="3. Pick a date and time" />
              <div className="overflow-x-auto pb-1">
                <BookingDateStrip days={days} selected={day} onSelect={setDay} className="min-w-[420px]" />
              </div>
              <div className="flex flex-wrap gap-2">
                {windows.map((window) => (
                  <ChoiceChip key={window} active={slotWindow === window} onClick={() => setSlotWindow(window)}>
                    {windowLabel(window)}
                  </ChoiceChip>
                ))}
              </div>
              <Note tone="amber">Some tests need 10 to 12 hours of fasting. Only water is allowed, so book a morning slot.</Note>
            </section>

            <Field label="Note for the lab (optional)" htmlFor="lab-notes">
              <Textarea
                id="lab-notes"
                value={notes}
                maxLength={500}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="For example: call before arriving, third floor"
              />
            </Field>
          </Surface>

          <div className="flex flex-col gap-5">
            <Surface as="aside" aria-label="Booking summary">
              <SectionTitle title="Booking summary" />
              <div className="flex flex-col gap-2">
                <SummaryLine label="Package" value={chosen?.name ?? "Not chosen"} />
                <SummaryLine
                  label="When"
                  value={day && slotWindow ? `${formatDateInIST(day, { weekday: "short", day: "numeric", month: "short" })} · ${windowLabel(slotWindow)}` : "—"}
                />
                <SummaryLine label="Where" value={addressValue.trim() || "—"} />
              </div>
              <Button size="md" disabled={!ready || create.isPending} onClick={() => void submit()}>
                {create.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CalendarCheck aria-hidden="true" />}
                {create.isPending ? "Booking…" : "Confirm booking"}
              </Button>
              <p className="m-0 text-xs text-ink-muted">
                The lab confirms the pickup and calls before arriving. You can cancel while the booking is requested or confirmed.
              </p>
            </Surface>
            <Surface as="section" aria-label="Your lab bookings">
              <SectionTitle title="Your lab bookings" />
              <MyBookings />
            </Surface>
          </div>
        </div>
      )}
    </TbdPage>
  );
}
