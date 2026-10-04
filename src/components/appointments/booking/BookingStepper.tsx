import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookingStepperStep {
  id: string;
  label: string;
}

/**
 * Wizard progress: numbered circles joined by a line (board DocAppointmentDialogs3).
 * Done steps show a tick, the current one has a mint ring. Every step is a button so people
 * can jump back, exactly like the old step bar.
 */
export function BookingStepper<T extends BookingStepperStep>({
  steps,
  current,
  onStepClick,
  className,
}: {
  steps: readonly T[];
  /** 1-based number of the current step. */
  current: number;
  onStepClick?: ((id: T["id"]) => void) | undefined;
  className?: string | undefined;
}) {
  // With many steps there is no room for every label: only the current one keeps its label.
  const showAllLabels = steps.length <= 4;
  return (
    <ol className={cn("m-0 flex w-full min-w-0 list-none items-center gap-2 p-0 sm:gap-2.5", className)}>
      {steps.map((item, index) => {
        const number = index + 1;
        const done = current > number;
        const active = current === number;
        return (
          <li
            key={item.id}
            className={cn("flex min-w-0 items-center gap-2 sm:gap-2.5", index < steps.length - 1 && "flex-1")}
          >
            <button
              type="button"
              onClick={() => onStepClick?.(item.id)}
              aria-current={active ? "step" : undefined}
              aria-label={`Step ${number}: ${item.label}${done ? ", done" : ""}`}
              className="flex min-w-0 shrink-0 items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span
                className={cn(
                  "flex size-[26px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors",
                  done || active ? "bg-[#047857] text-white" : "bg-well text-ink-muted",
                  active && "shadow-[0_0_0_4px_#d1fae5] dark:shadow-[0_0_0_4px_rgba(16,185,129,0.25)]",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : number}
              </span>
              <span
                className={cn(
                  "truncate text-[13px]",
                  done || active ? "font-bold text-ink" : "font-medium text-ink-muted",
                  active ? "inline" : showAllLabels ? "hidden sm:inline" : "hidden",
                )}
              >
                {item.label}
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn("h-0.5 min-w-3 flex-1 rounded-full", done ? "bg-[#047857]" : "bg-line")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Small help line under the stepper (the same phone number the old step bar showed). */
export function BookingHelpLine({ className }: { className?: string | undefined }) {
  return (
    <p
      className={cn(
        "m-0 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-xl bg-[#fffbeb] px-3 py-2 text-center text-xs text-[#92400e] dark:bg-amber-950/30 dark:text-amber-200",
        className,
      )}
    >
      <span>Need help?</span>
      <a
        href="tel:+917218378311"
        className="font-bold text-[#b45309] underline-offset-2 hover:underline dark:text-amber-300"
      >
        Call +91 7218378311
      </a>
      <span className="max-sm:hidden">for booking assistance</span>
    </p>
  );
}
