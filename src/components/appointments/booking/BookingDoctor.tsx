import Image from "next/image";
import type { ReactNode } from "react";
import { Award, Building2, Clock, GraduationCap, Languages, MapPin } from "lucide-react";
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
  /** Desktop sidebar: smaller photo so the booking card can take the width. */
  compact = false,
}: {
  doctor: BookingDoctorInfo;
  className?: string | undefined;
  compact?: boolean | undefined;
}) {
  const stats = doctor.stats ?? [];
  return (
    <Surface className={className}>
      <div className={cn("flex gap-4 sm:gap-5", compact ? "flex-col items-stretch lg:items-start" : "items-center")}>
        <BookingDoctorPhoto
          name={doctor.name}
          image={doctor.image}
          sizes={compact ? "96px" : "148px"}
          className={cn(
            "rounded-[22px] text-3xl sm:rounded-[28px]",
            compact
              ? "size-14 text-2xl sm:size-[72px] sm:text-3xl"
              : "size-[84px] sm:size-[148px] sm:text-5xl",
          )}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              "font-extrabold leading-tight tracking-[-0.3px] text-ink",
              compact ? "text-base sm:text-lg" : "text-lg sm:text-[22px]",
            )}
          >
            {doctor.name}
          </span>
          {doctor.subtitle ? <span className="text-sm text-ink-soft">{doctor.subtitle}</span> : null}
          {doctor.clinicName ? (
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft">
              <Building2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span className="min-w-0 break-words">{doctor.clinicName}</span>
            </span>
          ) : null}
          {doctor.locationName ? (
            <span className="flex items-center gap-1.5 text-[13px] text-ink-soft">
              <MapPin className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span className="truncate">{doctor.locationName}</span>
            </span>
          ) : null}
          {stats.length > 0 ? (
            <div
              className={cn(
                "mt-2 gap-2",
                compact
                  ? "grid grid-cols-2"
                  : "hidden grid-cols-[repeat(auto-fit,minmax(96px,1fr))] sm:grid",
              )}
            >
              {stats.map((stat) => (
                <BookingStatTile key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {!compact && stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:hidden">
          {stats.map((stat) => (
            <BookingStatTile key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      ) : null}
      <BookingDoctorAbout doctor={doctor} />
    </Surface>
  );
}

/** Education, languages and the doctor's recognitions; renders only what the doctor entered. */
function BookingDoctorAbout({ doctor }: { doctor: BookingDoctorInfo }) {
  const highlights = doctor.highlights ?? [];
  const languages = doctor.languages ?? [];
  if (!doctor.education && highlights.length === 0 && languages.length === 0) return null;
  return (
    <div className="mt-1 flex flex-col gap-2.5 border-t border-line pt-3.5">
      {doctor.education ? (
        <p className="flex items-start gap-2 text-[13px] text-ink-soft">
          <GraduationCap className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
          <span className="min-w-0 break-words">{doctor.education}</span>
        </p>
      ) : null}
      {languages.length > 0 ? (
        <p className="flex items-start gap-2 text-[13px] text-ink-soft">
          <Languages className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
          <span className="min-w-0 break-words">{languages.join(" · ")}</span>
        </p>
      ) : null}
      {highlights.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {highlights.map((line) => (
            <li key={line} className="flex items-start gap-2 text-[13px] leading-snug text-ink">
              <Award className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
              <span className="min-w-0 break-words">{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function BookingStatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-[#f5f8fc] px-1.5 py-2 dark:bg-well">
      <span className="text-lg font-extrabold leading-tight text-ink sm:text-[20px]">{value}</span>
      <span className="text-[11px] text-ink-muted">{label}</span>
    </div>
  );
}

/**
 * Two-column "Your Doctor" page (board WebDoctorProfile): compact doctor + timings on the
 * left, the booking card (type, date, slots, fee) as the wide main column on the right.
 * On a phone the booking card comes right after the doctor.
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
    <div className={cn("grid gap-3.5 lg:grid-cols-[minmax(220px,250px)_minmax(0,1fr)] lg:items-start", className)}>
      <div className="flex min-w-0 flex-col gap-3.5 max-lg:contents lg:sticky lg:top-0">
        {doctor ? (
          <BookingDoctorProfile doctor={doctor} className="gap-3 p-3.5 max-lg:order-1" compact />
        ) : (
          <Surface className="gap-3 p-3.5 max-lg:order-1">
            <EmptyBlock title="No doctor selected" description="Go back and choose a doctor to see their slots." />
          </Surface>
        )}
        {hours.length > 0 ? (
          <Surface className="gap-2.5 p-3.5 max-lg:order-3">
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#047857] text-white"
                aria-hidden="true"
              >
                <Clock className="size-3.5" strokeWidth={2.2} />
              </span>
              <h2 className="m-0 flex-1 text-sm font-bold text-ink">Clinic timings</h2>
              {hoursTag ? <Pill tone="video">{hoursTag}</Pill> : null}
            </div>
            {hours.map((row) => (
              <div key={row.label} className="flex justify-between gap-3 text-[13px]">
                <span className="whitespace-nowrap text-ink-muted">{row.label}</span>
                <span className="text-right font-bold text-ink">{row.value}</span>
              </div>
            ))}
          </Surface>
        ) : null}
      </div>
      <Surface className="gap-3.5 p-3.5 max-lg:order-2 sm:p-4">{children}</Surface>
    </div>
  );
}
