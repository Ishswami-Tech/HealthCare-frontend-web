import Image from "next/image";
import type { ReactNode } from "react";
import { Clock, MapPin } from "lucide-react";
import { EmptyBlock, Pill, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { BookingDoctorInfo, BookingHoursRow } from "./types";

/** Doctor photo on a mint tile; falls back to the first letter of the name. */
export function BookingDoctorPhoto({
  name,
  image,
  className,
  sizes = "56px",
}: {
  name: string;
  image?: string | undefined;
  className?: string | undefined;
  sizes?: string | undefined;
}) {
  const letter = name.replace(/^Dr\.?\s+/i, "").trim().charAt(0).toUpperCase() || "D";
  return (
    <span
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-mint text-lg font-extrabold text-brand-dark",
        className,
      )}
      aria-hidden="true"
    >
      {image ? <Image src={image} alt="" fill sizes={sizes} className="object-cover object-top" /> : letter}
    </span>
  );
}

/** Photo + name + one line; used at the top of the summary and success cards. */
export function BookingDoctorRow({
  doctor,
  subtitle,
  right,
  className,
}: {
  doctor: BookingDoctorInfo | null;
  /** Overrides the doctor's own subtitle (for example "Video Consultation"). */
  subtitle?: ReactNode | undefined;
  right?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const name = doctor?.name || "Doctor";
  const line = subtitle ?? doctor?.subtitle;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3.5 gap-y-3", className)}>
      <div className="flex min-w-0 flex-1 basis-[200px] items-center gap-3.5">
        <BookingDoctorPhoto name={name} image={doctor?.image} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="break-words text-[15px] font-bold text-ink">{name}</span>
          {line ? <span className="break-words text-[13px] text-ink-muted">{line}</span> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

/** The large "Your Doctor" card (board WebDoctorProfile). */
export function BookingDoctorProfile({
  doctor,
  className,
}: {
  doctor: BookingDoctorInfo;
  className?: string | undefined;
}) {
  const stats = doctor.stats ?? [];
  return (
    <Surface className={className}>
      <div className="flex items-center gap-4 sm:gap-5">
        <BookingDoctorPhoto
          name={doctor.name}
          image={doctor.image}
          sizes="148px"
          className="size-[84px] rounded-[22px] text-3xl sm:size-[148px] sm:rounded-[28px] sm:text-5xl"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-lg font-extrabold leading-tight tracking-[-0.3px] text-ink sm:text-[22px]">
            {doctor.name}
          </span>
          {doctor.subtitle ? <span className="text-sm text-ink-soft">{doctor.subtitle}</span> : null}
          {doctor.locationName ? (
            <span className="flex items-center gap-1.5 text-[13px] text-ink-soft">
              <MapPin className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span className="truncate">{doctor.locationName}</span>
            </span>
          ) : null}
          {stats.length > 0 ? (
            <div className="mt-2.5 hidden grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-2.5 sm:grid">
              {stats.map((stat) => (
                <BookingStatTile key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:hidden">
          {stats.map((stat) => (
            <BookingStatTile key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      ) : null}
    </Surface>
  );
}

function BookingStatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-[#f5f8fc] px-2 py-2.5 dark:bg-well">
      <span className="text-[22px] font-extrabold leading-tight text-ink">{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

/**
 * Two-column "Your Doctor" page (board WebDoctorProfile): the doctor and the clinic timings on
 * the left, the booking card (date, slots, fee) on the right. On a phone the booking card
 * comes right after the doctor.
 */
export function BookingDoctorPage({
  doctor,
  hours = [],
  hoursTag,
  children,
  className,
}: {
  doctor: BookingDoctorInfo | null;
  hours?: BookingHoursRow[] | undefined;
  /** Small tag on the timings card ("Video"). */
  hoursTag?: string | undefined;
  /** Content of the booking card. */
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start", className)}>
      <div className="flex min-w-0 flex-col gap-5 max-lg:contents">
        {doctor ? (
          <BookingDoctorProfile doctor={doctor} className="max-lg:order-1" />
        ) : (
          <Surface className="max-lg:order-1">
            <EmptyBlock title="No doctor selected" description="Go back and choose a doctor to see their slots." />
          </Surface>
        )}
        {hours.length > 0 ? (
          <Surface className="gap-3 max-lg:order-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[#047857] text-white"
                aria-hidden="true"
              >
                <Clock className="size-4" strokeWidth={2.2} />
              </span>
              <h2 className="m-0 flex-1 text-base font-bold text-ink">Clinic timings</h2>
              {hoursTag ? <Pill tone="video">{hoursTag}</Pill> : null}
            </div>
            {hours.map((row) => (
              <div key={row.label} className="flex justify-between gap-3 text-sm">
                <span className="whitespace-nowrap text-ink-muted">{row.label}</span>
                <span className="text-right font-bold text-ink">{row.value}</span>
              </div>
            ))}
          </Surface>
        ) : null}
      </div>
      <Surface className="gap-[18px] max-lg:order-2">{children}</Surface>
    </div>
  );
}
