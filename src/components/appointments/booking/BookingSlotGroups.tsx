import { useState, type KeyboardEvent } from "react";
import { CloudSun, Moon, Sun } from "lucide-react";
import type { TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { formatSlotLabel } from "./format";
import type { BookingPeriodKey, BookingSlotOption, BookingSlotPeriod } from "./types";

const PERIOD_ICON: Record<BookingPeriodKey, TbdIcon> = {
  morning: Sun,
  afternoon: CloudSun,
  evening: Moon,
};

const PERIOD_ORDER: readonly BookingPeriodKey[] = ["morning", "afternoon", "evening"];

const PERIOD_TITLE: Record<BookingPeriodKey, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

interface PeriodTheme {
  /** Active tab chip: soft tint, coloured border and text. */
  tabActive: string;
  /** Inactive tab chip hover. */
  tabHover: string;
  /** Icon colour on an inactive chip. */
  icon: string;
  /** Selected slot: solid tint, white text (AA contrast). */
  slotSelected: string;
  /** Free slot hover in the period colour. */
  slotHover: string;
}

/** Tabs variant colours: morning amber, afternoon sky, evening violet (literal classes for Tailwind). */
const PERIOD_THEME: Record<BookingPeriodKey, PeriodTheme> = {
  morning: {
    tabActive:
      "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-300",
    tabHover: "hover:border-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/20",
    icon: "text-amber-500 dark:text-amber-400",
    slotSelected:
      "border-amber-700 bg-amber-700 text-white shadow-[0_4px_10px_rgba(180,83,9,0.25)] dark:border-amber-600 dark:bg-amber-600",
    slotHover: "hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30",
  },
  afternoon: {
    tabActive:
      "border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500/60 dark:bg-sky-950/40 dark:text-sky-300",
    tabHover: "hover:border-sky-300 hover:bg-sky-50/60 dark:hover:bg-sky-950/20",
    icon: "text-sky-500 dark:text-sky-400",
    slotSelected:
      "border-sky-700 bg-sky-700 text-white shadow-[0_4px_10px_rgba(3,105,161,0.25)] dark:border-sky-600 dark:bg-sky-600",
    slotHover: "hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30",
  },
  evening: {
    tabActive:
      "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500/60 dark:bg-violet-950/40 dark:text-violet-300",
    tabHover: "hover:border-violet-300 hover:bg-violet-50/60 dark:hover:bg-violet-950/20",
    icon: "text-violet-500 dark:text-violet-400",
    slotSelected:
      "border-violet-600 bg-violet-600 text-white shadow-[0_4px_10px_rgba(124,58,237,0.25)] dark:border-violet-500 dark:bg-violet-500",
    slotHover: "hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30",
  },
};

/** Chosen-slot pill colours (next to "Available slots"), same palette as the tabs. */
const PERIOD_SUMMARY_CLASS: Record<BookingPeriodKey, string> = {
  morning:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-amber-950/60 dark:text-amber-200",
  afternoon:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/50 dark:bg-sky-950/60 dark:text-sky-200",
  evening:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-500/50 dark:bg-violet-950/60 dark:text-violet-200",
};

/** The period of a slot: the one listing it, else by the hour ("HH:mm", same cut-offs as the API grouping). */
export function slotPeriodKeyOf(periods: readonly BookingSlotPeriod[], slot: string): BookingPeriodKey {
  const listed = periods.find((period) => period.slots.some((option) => option.value === slot));
  if (listed) return listed.key;
  const hour = Number.parseInt(slot.split(":")[0] ?? "0", 10);
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}

/**
 * Small inline pill with the chosen slot ("12:03 PM · 22 Oct") in the colour of its period,
 * shown next to the "Available slots" heading once a slot is picked.
 */
export function BookingSelectedSlotPill({
  periods,
  slot,
  label,
  className,
}: {
  periods: readonly BookingSlotPeriod[];
  slot: string;
  label: string;
  className?: string | undefined;
}) {
  const key = slotPeriodKeyOf(periods, slot);
  const Icon = PERIOD_ICON[key];
  return (
    <span
      aria-live="polite"
      aria-label={`Selected ${PERIOD_TITLE[key].toLowerCase()} slot: ${label}`}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold",
        PERIOD_SUMMARY_CLASS[key],
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

interface SlotGridProps {
  slots: BookingSlotOption[];
  selected: string;
  onSelect: (slot: string) => void;
  timeStyle: "12h" | "24h";
  detail?: string | undefined;
  columnsClassName: string;
  /** Tabs variant: selected / hover colours of the period (default emerald). */
  theme?: PeriodTheme | undefined;
}

/** The slot chips of one period (selected = emerald or the period colour, unavailable = grey). */
function SlotGrid({ slots, selected, onSelect, timeStyle, detail, columnsClassName, theme }: SlotGridProps) {
  return (
    <div className={cn("grid gap-1.5", columnsClassName)}>
      {slots.map((slot) => {
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
              "flex min-h-9 flex-col items-center justify-center gap-px rounded-lg border px-1 py-1.5 text-center transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
              isSelected
                ? (theme?.slotSelected ?? "border-primary bg-primary text-white shadow-[0_4px_10px_rgba(4,120,87,0.22)]")
                : slot.unavailable
                  ? "cursor-not-allowed border-well bg-well text-[#94a3b8] line-through dark:text-slate-500"
                  : cn("border-line bg-card text-ink", theme?.slotHover ?? "hover:border-brand/50 hover:bg-mint-soft"),
            )}
          >
            <span className={cn("text-xs", detail ? "font-bold" : "font-semibold")}>{label}</span>
            {detail ? (
              <span
                className={cn(
                  "text-[11px]",
                  isSelected
                    ? theme
                      ? "text-white/85"
                      : "text-[#d1fae5]"
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
  );
}

interface BookingSlotPeriodTabsProps extends Omit<SlotGridProps, "slots"> {
  periods: BookingSlotPeriod[];
  className?: string | undefined;
  resetKey?: string | undefined;
}

/**
 * Morning / Afternoon / Evening as three tab chips with their open-slot count; only the active
 * period's slots render. Default tab: the period holding the selected slot, else the first one
 * with open slots. A period without open slots is disabled ("No slots"). A new `resetKey`
 * (the date) drops the manual choice so the default applies again.
 */
function BookingSlotPeriodTabs({
  periods,
  selected,
  onSelect,
  timeStyle,
  detail,
  columnsClassName,
  className,
  resetKey,
}: BookingSlotPeriodTabsProps) {
  const [choice, setChoice] = useState<{ key: BookingPeriodKey; resetKey: string | undefined } | null>(null);
  const byKey = new Map(periods.map((period) => [period.key, period]));
  const openCount = (key: BookingPeriodKey) => byKey.get(key)?.openCount ?? 0;
  const enabledKeys = PERIOD_ORDER.filter((key) => openCount(key) > 0);
  const chosenKey =
    choice && choice.resetKey === resetKey && openCount(choice.key) > 0 ? choice.key : null;
  const selectedKey =
    PERIOD_ORDER.find((key) =>
      byKey.get(key)?.slots.some((slot) => !slot.unavailable && slot.value === selected),
    ) ?? null;
  const activeKey = chosenKey ?? selectedKey ?? enabledKeys[0] ?? null;
  const activePeriod = activeKey ? byKey.get(activeKey) : undefined;
  const panelId = "booking-slot-period-panel";

  const pick = (key: BookingPeriodKey) => setChoice({ key, resetKey });
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    if (!activeKey || enabledKeys.length < 2) return;
    event.preventDefault();
    const index = enabledKeys.indexOf(activeKey);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = enabledKeys[(index + step + enabledKeys.length) % enabledKeys.length];
    if (next) {
      pick(next);
      document.getElementById(`booking-slot-tab-${next}`)?.focus();
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div role="tablist" aria-label="Time of day" className="grid grid-cols-3 gap-2">
        {PERIOD_ORDER.map((key) => {
          const Icon = PERIOD_ICON[key];
          const count = openCount(key);
          const disabled = count === 0;
          const isActive = activeKey === key;
          const theme = PERIOD_THEME[key];
          return (
            <button
              key={key}
              id={`booking-slot-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              aria-label={`${PERIOD_TITLE[key]}, ${disabled ? "no slots" : `${count} ${count === 1 ? "slot" : "slots"}`}`}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              onClick={() => pick(key)}
              onKeyDown={onTabKeyDown}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-1.5 text-center transition-colors sm:flex-row sm:gap-1.5",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                isActive
                  ? cn("border-2 shadow-sm", theme.tabActive)
                  : disabled
                    ? "cursor-not-allowed border-well bg-well text-[#94a3b8] dark:text-slate-500"
                    : cn("border-line bg-card text-ink", theme.tabHover),
              )}
            >
              <span className="flex items-center gap-1.5">
                <Icon
                  className={cn("size-4 shrink-0", !isActive && !disabled && theme.icon)}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="text-[13px] font-semibold">{PERIOD_TITLE[key]}</span>
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isActive ? "opacity-80" : disabled ? "" : "text-ink-muted",
                )}
              >
                {disabled ? "No slots" : `(${count})`}
              </span>
            </button>
          );
        })}
      </div>
      {activePeriod ? (
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`booking-slot-tab-${activePeriod.key}`}
          className="flex flex-col gap-2"
        >
          <p className="m-0 text-[11px] font-medium text-ink-muted">{activePeriod.range}</p>
          <SlotGrid
            slots={activePeriod.slots}
            selected={selected}
            onSelect={onSelect}
            timeStyle={timeStyle}
            detail={detail}
            columnsClassName={columnsClassName}
            theme={PERIOD_THEME[activePeriod.key]}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Slot chips grouped by Morning / Afternoon / Evening.
 *  - selected = emerald
 *  - unavailable = grey, struck through, disabled
 * `detail` adds the small second line ("15 min") the staff dialog shows under the time.
 * `variant="tabs"` (booking dialog) shows one period at a time behind three tab chips.
 */
export function BookingSlotGroups({
  periods,
  selected,
  onSelect,
  timeStyle = "24h",
  detail,
  columnsClassName = "grid-cols-3",
  className,
  variant = "stacked",
  resetKey,
}: {
  periods: BookingSlotPeriod[];
  selected: string;
  onSelect: (slot: string) => void;
  timeStyle?: "12h" | "24h" | undefined;
  detail?: string | undefined;
  /** Tailwind grid columns for the chips. */
  columnsClassName?: string | undefined;
  className?: string | undefined;
  /** "stacked" lists every period; "tabs" shows one period behind Morning / Afternoon / Evening tabs. */
  variant?: "stacked" | "tabs" | undefined;
  /** Tabs only: change it (e.g. the date) to return to the default tab. */
  resetKey?: string | undefined;
}) {
  if (variant === "tabs") {
    return (
      <BookingSlotPeriodTabs
        periods={periods}
        selected={selected}
        onSelect={onSelect}
        timeStyle={timeStyle}
        detail={detail}
        columnsClassName={columnsClassName}
        className={className}
        resetKey={resetKey}
      />
    );
  }

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
            <SlotGrid
              slots={period.slots}
              selected={selected}
              onSelect={onSelect}
              timeStyle={timeStyle}
              detail={detail}
              columnsClassName={columnsClassName}
            />
          </section>
        );
      })}
    </div>
  );
}
