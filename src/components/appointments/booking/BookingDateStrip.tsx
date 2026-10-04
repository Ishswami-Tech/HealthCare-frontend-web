import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { BookingDay } from "./types";

/**
 * Row of day buttons (board WebDoctorProfile, "Select date").
 * Selected = emerald; closed days are greyed, struck through and cannot be picked.
 */
export function BookingDateStrip({
  days,
  selected,
  onSelect,
  className,
}: {
  days: BookingDay[];
  selected?: Date | undefined;
  onSelect: (date: Date) => void;
  className?: string | undefined;
}) {
  return (
    <div
      role="group"
      aria-label="Appointment date"
      className={cn("grid gap-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}
    >
      {days.map((day) => {
        const active = selected ? isSameDay(day.date, selected) : false;
        return (
          <button
            key={day.date.toISOString()}
            type="button"
            disabled={day.disabled}
            aria-pressed={active}
            aria-label={`${format(day.date, "EEEE, d MMMM")}${day.disabled ? ", closed" : ""}`}
            onClick={() => onSelect(day.date)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-[14px] border p-0 transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
              active
                ? "border-[#047857] bg-[#047857] text-white"
                : day.disabled
                  ? "cursor-not-allowed border-well bg-well text-[#94a3b8] line-through dark:text-slate-500"
                  : "border-line bg-card text-ink hover:border-brand/50 hover:bg-mint-soft",
            )}
          >
            <span className="text-[11px] font-semibold">{format(day.date, "EEE")}</span>
            <span className="text-base font-extrabold">{format(day.date, "d")}</span>
          </button>
        );
      })}
    </div>
  );
}
