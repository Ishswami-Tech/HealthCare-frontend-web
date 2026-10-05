import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookingStepperStep {
  id: string;
  label: string;
}

/**
 * Wizard progress: equal-width steps with circles connected by a line, labels under each circle.
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
  return (
    <ol className={cn("m-0 flex w-full min-w-0 list-none items-start p-0", className)}>
      {steps.map((item, index) => {
        const number = index + 1;
        const done = current > number;
        const active = current === number;
        const isLast = index === steps.length - 1;
        return (
          <li key={item.id} className="relative flex min-w-0 flex-1 flex-col items-center">
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-3 left-[calc(50%+12px)] right-[calc(-50%+12px)] h-0.5 rounded-full",
                  done ? "bg-[#047857]" : "bg-line",
                )}
              />
            ) : null}
            <button
              type="button"
              onClick={() => onStepClick?.(item.id)}
              aria-current={active ? "step" : undefined}
              aria-label={`Step ${number}: ${item.label}${done ? ", done" : ""}`}
              className="relative z-10 flex max-w-full flex-col items-center gap-1 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition-colors",
                  done || active ? "bg-[#047857] text-white" : "bg-well text-ink-muted",
                  active && "ring-[3px] ring-[#d1fae5] dark:ring-emerald-500/25",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : number}
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-center text-[11px] leading-tight sm:text-xs",
                  done || active ? "font-bold text-ink" : "font-medium text-ink-muted",
                )}
              >
                {item.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact help line under the stepper. */
export function BookingHelpLine({ className }: { className?: string | undefined }) {
  return (
    <p
      className={cn(
        "m-0 flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center text-[11px] text-ink-muted",
        className,
      )}
    >
      <span>Need help?</span>
      <a
        href="tel:+917218378311"
        className="font-bold text-[#b45309] underline-offset-2 hover:underline dark:text-amber-300"
      >
        +91 7218378311
      </a>
    </p>
  );
}
