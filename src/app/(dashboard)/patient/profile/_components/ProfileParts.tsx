import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InitialsAvatar, Note, type TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";

/** Small building blocks shared by the patient account screens (profile hub, settings, help). */

// ── Avatar ─────────────────────────────────────────────────────────────────

/** The patient's photo, or their initials when there is no photo. */
export function ProfileAvatar({
  name,
  photoUrl,
  size,
  className,
}: {
  name: string;
  photoUrl?: string | undefined;
  size: number;
  className?: string;
}) {
  return (
    <Avatar className={cn("bg-card", className)} style={{ width: size, height: size }}>
      {photoUrl ? <AvatarImage src={photoUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback className="bg-transparent">
        <InitialsAvatar name={name} size={size} />
      </AvatarFallback>
    </Avatar>
  );
}

// ── Menu rows ──────────────────────────────────────────────────────────────

const MENU_TONES = {
  blue: "bg-[#e6effd] text-[#2563eb] dark:bg-blue-500/15 dark:text-blue-300",
  orange: "bg-[#fdf0e1] text-[#ea8a1b] dark:bg-orange-500/15 dark:text-orange-300",
  violet: "bg-[#efeafd] text-[#6d28d9] dark:bg-violet-500/15 dark:text-violet-300",
  mint: "bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-[#fef3c7] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-300",
  sky: "bg-[#e0f2fe] text-[#0369a1] dark:bg-sky-500/15 dark:text-sky-300",
  slate: "bg-[#f1f5f9] text-[#3b4a5e] dark:bg-slate-500/20 dark:text-slate-300",
  pink: "bg-[#fce7f3] text-[#be185d] dark:bg-pink-500/15 dark:text-pink-300",
} as const;

export type MenuTone = keyof typeof MENU_TONES;

const ROW_SHELL = "flex min-h-[60px] items-center gap-3.5 border-b border-hair py-2 text-ink last:border-b-0";

function MenuIcon({ icon: Icon, tone }: { icon: TbdIcon; tone: MenuTone }) {
  return (
    <span
      className={cn("flex size-[38px] shrink-0 items-center justify-center rounded-[11px]", MENU_TONES[tone])}
      aria-hidden="true"
    >
      <Icon className="size-[18px]" strokeWidth={2} />
    </span>
  );
}

/** One row of a menu card: icon square, label, an optional value, then a chevron. Links when `href` is set. */
export function MenuRow({
  icon,
  tone,
  label,
  description,
  value,
  href,
  external = false,
  right,
}: {
  icon?: TbdIcon;
  tone?: MenuTone;
  label: ReactNode;
  description?: ReactNode;
  /** Short muted text before the chevron ("English"). */
  value?: ReactNode;
  href?: string;
  /** Opens in a new tab (public pages outside the portal). */
  external?: boolean;
  /** Replaces the chevron: a button, a tag. */
  right?: ReactNode;
}) {
  const body = (
    <>
      {icon ? <MenuIcon icon={icon} tone={tone ?? "slate"} /> : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-sm text-ink", description ? "font-bold" : "font-semibold")}>{label}</span>
        {description ? <span className="text-xs text-ink-muted">{description}</span> : null}
      </span>
      {value ? <span className="max-w-[45%] truncate text-[13px] text-ink-muted">{value}</span> : null}
      {right ?? (href ? <ChevronRight className="size-4 shrink-0 text-[#94a3b8]" strokeWidth={2.4} aria-hidden="true" /> : null)}
    </>
  );
  if (!href) return <div className={ROW_SHELL}>{body}</div>;
  const linkClass = cn(
    ROW_SHELL,
    "rounded-lg transition-colors hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {body}
    </a>
  ) : (
    <Link href={href} className={linkClass}>
      {body}
    </Link>
  );
}

/** Section heading with a solid icon square ("App language", "Privacy & security"). */
export function IconHeading({
  icon: Icon,
  iconClassName,
  id,
  children,
}: {
  icon: TbdIcon;
  /** Background of the icon square. */
  iconClassName: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="m-0 flex items-center gap-2.5 text-base font-bold text-ink">
      <span
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-[10px] text-white", iconClassName)}
        aria-hidden="true"
      >
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      {children}
    </h2>
  );
}

// ── States ─────────────────────────────────────────────────────────────────

/** "Could not load" note with a retry button. */
export function LoadErrorNote({
  title,
  message,
  onRetry,
}: {
  title: string;
  message?: string | null;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <Note tone="rose" icon={AlertCircle} className="[&>div]:flex-1">
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
