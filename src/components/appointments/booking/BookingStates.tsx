import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { EmptyBlock, type IconTone, type TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";

const NOTICE_TONES = {
  amber:
    "border-[#fcd34d] bg-[#fffbeb] text-[#92400e] [&_svg]:text-[#d97706] dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 dark:[&_svg]:text-amber-300",
  rose: "border-[#fecdd3] bg-[#fff1f2] text-[#9f1239] [&_svg]:text-[#e11d48] dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200 dark:[&_svg]:text-rose-300",
  green:
    "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46] [&_svg]:text-[#047857] dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 dark:[&_svg]:text-emerald-300",
} as const;

/** Warning / error / information box with a title, a few lines and optional buttons. */
export function BookingNotice({
  tone = "amber",
  icon: Icon,
  title,
  children,
  actions,
  className,
}: {
  tone?: keyof typeof NOTICE_TONES | undefined;
  icon?: TbdIcon | undefined;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      role={tone === "rose" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-2xl border p-4 text-[13px] leading-normal", NOTICE_TONES[tone], className)}
    >
      {Icon ? <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden="true" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="m-0 text-sm font-bold">{title}</p>
        {children}
        {actions ? <div className="mt-2 flex flex-wrap gap-2 [&_svg]:text-current">{actions}</div> : null}
      </div>
    </div>
  );
}

/** Dashed empty / "nothing to show yet" block inside a step. */
export function BookingEmpty({
  icon,
  tone = "mint",
  title,
  description,
  children,
  className,
}: {
  icon?: TbdIcon | undefined;
  tone?: IconTone | undefined;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-line", className)}>
      <EmptyBlock
        {...(icon ? { icon } : {})}
        tone={tone}
        title={title}
        description={description}
        action={children}
        className="py-8"
      />
    </div>
  );
}

/** One centred line with a spinner. */
export function BookingLoading({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <div
      role="status"
      className={cn("flex items-center justify-center gap-2 py-6 text-sm font-medium text-ink-muted", className)}
    >
      <Loader2 className="size-5 animate-spin text-brand" aria-hidden="true" />
      {children}
    </div>
  );
}

/** Grey placeholder rows while a list loads. */
export function BookingSkeletonRows({ rows = 4, className }: { rows?: number | undefined; className?: string | undefined }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-[68px] animate-pulse rounded-2xl bg-well" />
      ))}
    </div>
  );
}

/** Small uppercase label above a group of options. */
export function BookingGroupLabel({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <p className={cn("m-0 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted", className)}>
      {children}
    </p>
  );
}

/**
 * Class names for a selectable row or tile (location, service, doctor, patient, visit type):
 * white with a grey border, mint with an emerald border when chosen.
 */
export function bookingOptionClass(selected: boolean, className?: string): string {
  return cn(
    "w-full rounded-2xl border-2 text-left transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
    selected
      ? "border-[#047857] bg-mint-soft dark:border-emerald-500"
      : "border-line bg-card hover:border-brand/40 hover:bg-mint-soft/60",
    className,
  );
}
