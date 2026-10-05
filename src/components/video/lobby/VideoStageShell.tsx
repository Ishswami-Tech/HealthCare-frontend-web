import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Portal name under the brand: none for patients, "DOCTOR PORTAL" for doctors. */
export function videoPortalLabel(role?: string | null): string {
  const key = String(role ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!key || key === "PATIENT") return "";
  if (key === "PHARMACIST") return "PHARMACY PORTAL";
  return `${key.replace(/_/g, " ")} PORTAL`;
}

const BACK_LINK =
  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-card px-3.5 text-[13px] font-semibold text-ink shadow-card transition-colors hover:bg-mint-soft focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border dark:border-border/70";

/**
 * The frame of the video pages that are not the call itself (waiting room, "you left the call",
 * consultation summary). These routes stay fullscreen (no sidebar), so the frame is only the
 * lavender video background, a top bar with the brand and one back link, and a centred page column.
 */
export function VideoStageShell({
  portalLabel,
  backLabel,
  backHref,
  onBack,
  className,
  children,
}: {
  portalLabel?: string;
  backLabel?: string;
  /** Back link target. Use `onBack` instead when leaving needs clean-up first (camera preview). */
  backHref?: string;
  onBack?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const backBody = (
    <>
      <ChevronLeft className="size-4" strokeWidth={2.4} aria-hidden="true" />
      {/* Phones show the short word so the brand keeps its room. */}
      <span className="sm:hidden">Back</span>
      <span className="hidden sm:inline">{backLabel}</span>
    </>
  );
  return (
    <div className="tbd-wash flex min-h-dvh w-full flex-col text-ink" data-tone="lavender">
      <header className="mx-auto flex h-[72px] w-full max-w-[1160px] shrink-0 items-center justify-between gap-3 px-4 sm:px-6 md:px-8">
        <Link href="/" prefetch={false} className="flex min-w-0 items-center gap-2.5" aria-label="TestByDoctor home">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#047857] text-white shadow-[0_6px_14px_rgba(4,120,87,0.28)]"
            aria-hidden="true"
          >
            <Activity className="size-5" strokeWidth={2.6} />
          </span>
          <span className="flex min-w-0 flex-col justify-center leading-[1.15]">
            <span className="truncate text-base font-extrabold tracking-[-0.3px] text-ink">TestByDoctor</span>
            {portalLabel ? (
              <span className="truncate text-[10.5px] font-bold tracking-[0.4px] text-brand">{portalLabel}</span>
            ) : null}
          </span>
        </Link>
        {backLabel && onBack ? (
          <button type="button" onClick={onBack} className={BACK_LINK} aria-label={backLabel}>
            {backBody}
          </button>
        ) : backLabel && backHref ? (
          <Link href={backHref} className={BACK_LINK} aria-label={backLabel}>
            {backBody}
          </Link>
        ) : null}
      </header>
      <main
        className={cn(
          "mx-auto flex w-full max-w-[1160px] flex-1 flex-col gap-5 px-4 pb-10 pt-1 sm:px-6 md:px-8",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
