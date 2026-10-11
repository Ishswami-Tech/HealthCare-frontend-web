import type { ReactNode } from "react";
import { CircleAlert, Hospital, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Chip, EmptyBlock, Note, Pill, type IconTone, type TbdIcon } from "./primitives";
import { visitTypeKind, visitTypeLabel } from "./status";

/**
 * Small blocks every portal needs: the "could not load" states, placeholder rows,
 * the video / in-clinic tag and the read-only fact tile. Server-safe (no hooks).
 */

// ── Could not load ─────────────────────────────────────────────────────────

/**
 * "Could not be loaded" block with a retry button, for the place where the list or the
 * card would be. Wrap it in a `Surface` when it stands alone on the page.
 */
export function LoadError({
  title,
  message,
  onRetry,
  retrying = false,
  retryLabel = "Try again",
  icon = CircleAlert,
  tone = "rose",
  action,
  className,
}: {
  title: ReactNode;
  message?: ReactNode;
  onRetry?: (() => void) | undefined;
  /** The retry is running: the button is disabled. */
  retrying?: boolean;
  retryLabel?: string;
  icon?: TbdIcon;
  tone?: IconTone;
  /** Replaces the retry button (another way out, or a different main button). */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <EmptyBlock
      icon={icon}
      tone={tone}
      title={title}
      description={message}
      className={className}
      action={
        action ??
        (onRetry ? (
          <Button variant="outline" size="md" onClick={onRetry} disabled={retrying}>
            {retryLabel}
          </Button>
        ) : undefined)
      }
    />
  );
}

/** One-line "could not load" note with a retry button, for the top of a page that still shows its content. */
export function LoadErrorNote({
  title,
  message,
  onRetry,
  icon = CircleAlert,
  className,
}: {
  title: ReactNode;
  message?: ReactNode;
  onRetry?: (() => void) | undefined;
  icon?: TbdIcon;
  className?: string;
}) {
  return (
    <Note tone="rose" icon={icon} className={cn("[&>div]:flex-1", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
        <span>
          <strong className="font-bold">{title}</strong> {message}
        </span>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    </Note>
  );
}

// ── Placeholder rows ───────────────────────────────────────────────────────

/**
 * Placeholder rows while a table loads. Without children every row is an avatar, two
 * text columns, a tag and a button; pass the cells of one row (and the row's grid in
 * `rowClassName`) when the table has its own columns.
 */
export function SkeletonRows({
  rows = 4,
  rowClassName,
  children,
}: {
  rows?: number;
  rowClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "border-b border-hair last:border-b-0",
            children ? null : "flex min-h-[72px] items-center gap-4 px-5 py-3",
            rowClassName,
          )}
        >
          {children ?? (
            <>
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-36 max-w-full rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <div className="hidden flex-1 flex-col gap-1.5 sm:flex">
                <Skeleton className="h-3.5 w-44 max-w-full rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="h-[22px] w-24 shrink-0 rounded-lg" />
              <Skeleton className="hidden h-10 w-36 shrink-0 rounded-xl md:block" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Visit type ─────────────────────────────────────────────────────────────

/**
 * Video (indigo) or in-clinic (green) tag for a visit. `pill` is the small status-style
 * tag of tables; `chip` is the soft chip with an icon on visit cards.
 */
export function VisitTypeChip({
  type,
  variant = "pill",
  label,
  className,
}: {
  /** The visit type as the API sends it: "VIDEO_CALL", "IN_PERSON", "video", … */
  type: string | null | undefined;
  variant?: "pill" | "chip";
  /** Replaces the standard wording ("In-Clinic · Main branch"). */
  label?: ReactNode;
  className?: string;
}) {
  const kind = visitTypeKind(type);
  if (variant === "chip") {
    const isVideo = kind === "video";
    return (
      <Chip icon={isVideo ? Video : Hospital} tone={isVideo ? "video" : "clinic"} className={cn("max-w-full", className)}>
        <span className="min-w-0 truncate">{label ?? (isVideo ? "Video" : "In-Clinic")}</span>
      </Chip>
    );
  }
  return (
    <Pill tone={kind ?? "slate"} className={className}>
      {label ?? (kind === "video" ? "Video call" : kind === "clinic" ? "In-clinic" : visitTypeLabel(type))}
    </Pill>
  );
}

// ── Facts ──────────────────────────────────────────────────────────────────

/** Read-only fact: small caps label over a bold value. Pass `children` for a tag instead of text. */
export function FactTile({
  label,
  value,
  children,
  className,
}: {
  label: ReactNode;
  value?: string | null | undefined;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-[14px] border border-line bg-[#fbfdfc] px-3.5 py-3 dark:bg-white/[0.03]",
        className,
      )}
    >
      <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">{label}</span>
      {children !== undefined ? (
        <span className="flex min-w-0 text-sm font-bold text-ink">{children}</span>
      ) : (
        <span className="text-sm font-bold text-ink [overflow-wrap:anywhere] md:truncate" title={value || undefined}>
          {value || "-"}
        </span>
      )}
    </div>
  );
}
