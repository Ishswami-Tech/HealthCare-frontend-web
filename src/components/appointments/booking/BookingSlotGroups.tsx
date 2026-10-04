import { CloudSun, Moon, Sun } from "lucide-react";
import type { TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { formatSlotLabel } from "./format";
import type { BookingPeriodKey, BookingSlotPeriod } from "./types";

const PERIOD_ICON: Record<BookingPeriodKey, TbdIcon> = {
  morning: Sun,
  afternoon: CloudSun,
  evening: Moon,
};

/**
 * Slot chips grouped by Morning / Afternoon / Evening.
 *  - selected = emerald
 *  - unavailable = grey, struck through, disabled
 * `detail` adds the small second line ("15 min") the staff dialog shows under the time.
 */
export function BookingSlotGroups({
  periods,
  selected,
  onSelect,
  timeStyle = "24h",
  detail,
  columnsClassName = "grid-cols-3",
  className,
}: {
  periods: BookingSlotPeriod[];
  selected: string;
  onSelect: (slot: string) => void;
  timeStyle?: "12h" | "24h" | undefined;
  detail?: string | undefined;
  /** Tailwind grid columns for the chips. */
  columnsClassName?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {periods.map((period) => {
        const Icon = PERIOD_ICON[period.key];
        return (
          <section key={period.key} className="flex flex-col gap-2" aria-label={`${period.label} slots`}>
            <div className="flex items-center gap-2">
              <Icon className="size-4 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden="true" />
              <h3 className="m-0 text-xs font-extrabold uppercase tracking-[0.6px] text-ink-soft">{period.label}</h3>
              <span className="text-[11px] font-medium text-ink-muted">({period.range})</span>
              <span className="ml-auto rounded-md bg-well px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                {period.openCount} {period.openCount === 1 ? "slot" : "slots"}
              </span>
            </div>
            <div className={cn("grid gap-2", columnsClassName)}>
              {period.slots.map((slot) => {
                const isSelected = !slot.unavailable && selected === slot.value;
                const label = formatSlotLabel(slot.value, timeStyle);
                return (
                  <button
                    key={slot.value}
                    type="button"
                    disabled={slot.unavailable}
                    aria-pressed={isSelected}
                    aria-label={slot.unavailable ? `${label}, not available` : label}
                    onClick={() => onSelect(slot.value)}
                    className={cn(
                      "flex min-h-11 flex-col items-center justify-center gap-px rounded-xl border px-1 py-2 text-center transition-colors",
                      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                      isSelected
                        ? "border-[#047857] bg-[#047857] text-white shadow-[0_6px_14px_rgba(4,120,87,0.25)]"
                        : slot.unavailable
                          ? "cursor-not-allowed border-well bg-well text-[#94a3b8] line-through dark:text-slate-500"
                          : "border-line bg-card text-ink hover:border-brand/50 hover:bg-mint-soft",
                    )}
                  >
                    <span className={cn("text-[13px]", detail ? "font-bold" : "font-semibold")}>{label}</span>
                    {detail ? (
                      <span
                        className={cn(
                          "text-[11px]",
                          isSelected
                            ? "text-[#d1fae5]"
                            : slot.unavailable
                              ? "text-[#94a3b8] dark:text-slate-500"
                              : "text-ink-muted",
                        )}
                      >
                        {slot.unavailable ? "Booked" : isSelected ? `Selected · ${detail}` : detail}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
