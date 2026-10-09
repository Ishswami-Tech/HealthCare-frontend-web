import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Info, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TestByDoctor web design system — building blocks shared by the patient, doctor and
 * pharmacy portals. Server-safe (no hooks); interactive pieces live in `controls.tsx`.
 *
 * Rules the designs follow:
 *  - emerald is the main colour; amber (`action`) only for book / pay / order / join video;
 *    indigo only for video; red only for cancel and errors;
 *  - one main button per card;
 *  - white cards (radius 20) on a soft section wash; feature cards use `SoftCard`.
 */

export type TbdIcon = ComponentType<LucideProps>;

// ── Pills ──────────────────────────────────────────────────────────────────

export type PillTone =
  | "green"
  | "amber"
  | "rose"
  | "blue"
  | "teal"
  | "slate"
  | "video"
  | "clinic"
  | "white";

const PILL_TONES: Record<PillTone, string> = {
  green: "bg-[#d1fae5] text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-[#fef3c7] text-[#92400e] dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-[#ffe4e6] text-[#be123c] dark:bg-rose-500/15 dark:text-rose-300",
  blue: "bg-[#eff6ff] text-[#1e40af] dark:bg-blue-500/15 dark:text-blue-300",
  teal: "bg-[#ccfbf1] text-[#0f766e] dark:bg-teal-500/15 dark:text-teal-300",
  slate: "bg-[#f1f5f9] text-[#334155] dark:bg-slate-500/20 dark:text-slate-300",
  video: "bg-[#eef2ff] text-[#3730a3] dark:bg-indigo-500/15 dark:text-indigo-300",
  clinic: "bg-[#ecfdf5] text-[#065f46] dark:bg-emerald-500/10 dark:text-emerald-300",
  white:
    "border border-[#a7f3d0] bg-white text-[#047857] dark:border-emerald-800 dark:bg-transparent dark:text-emerald-300",
};

/** Status tag: small, uppercase, one colour per meaning. Text carries the meaning, not colour alone. */
export function Pill({
  tone = "green",
  dot = false,
  className,
  children,
}: {
  tone?: PillTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[8px] px-[9px] py-1 text-[11px] font-extrabold uppercase leading-none tracking-[0.4px]",
        PILL_TONES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** Soft information chip (date, visit type). Not a status. */
export function Chip({
  icon: Icon,
  tone = "slate",
  className,
  children,
}: {
  icon?: TbdIcon;
  tone?: "slate" | "video" | "clinic" | "green" | "amber" | "blue" | "teal" | "rose";
  className?: string;
  children: ReactNode;
}) {
  const iconColor =
    tone === "video"
      ? "text-[#4f46e5] dark:text-indigo-300"
      : tone === "clinic"
        ? "text-[#059669] dark:text-emerald-300"
        : "text-brand";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 py-[7px] text-xs font-semibold",
        PILL_TONES[tone],
        tone === "slate" && "text-ink dark:text-slate-200",
        className,
      )}
    >
      {Icon ? <Icon className={cn("size-3.5 shrink-0", iconColor)} strokeWidth={2.2} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** Small pulsing "Live" / "Active shift" tag. */
export function LiveTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#d1fae5] px-[9px] py-1 text-[11px] font-extrabold uppercase leading-none tracking-[0.4px] text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300",
        className,
      )}
    >
      <span className="tbd-pulse size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

// ── Icon square ────────────────────────────────────────────────────────────

export type IconTone =
  | "mint"
  | "blue"
  | "amber"
  | "rose"
  | "violet"
  | "video"
  | "aqua"
  | "slate"
  | "orange";

const ICON_TONES: Record<IconTone, { soft: string; solid: string }> = {
  mint: {
    soft: "bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300",
    solid: "bg-[#047857] text-white",
  },
  blue: {
    soft: "bg-[#eff6ff] text-[#1d4ed8] dark:bg-blue-500/15 dark:text-blue-300",
    solid: "bg-[#3b82f6] text-white",
  },
  amber: {
    soft: "bg-[#fef3c7] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-300",
    solid: "bg-[#f59e0b] text-white",
  },
  rose: {
    soft: "bg-[#ffe4e6] text-[#be123c] dark:bg-rose-500/15 dark:text-rose-300",
    solid: "bg-[#f87171] text-white",
  },
  violet: {
    soft: "bg-[#efeafd] text-[#6d28d9] dark:bg-violet-500/15 dark:text-violet-300",
    solid: "bg-[#8b5cf6] text-white",
  },
  video: {
    soft: "bg-[#eef2ff] text-[#4f46e5] dark:bg-indigo-500/15 dark:text-indigo-300",
    solid: "bg-[#6366f1] text-white",
  },
  aqua: {
    soft: "bg-[#ccfbf1] text-[#0f766e] dark:bg-teal-500/15 dark:text-teal-300",
    solid: "bg-[#14b8a6] text-white",
  },
  slate: {
    soft: "bg-[#f1f5f9] text-[#334155] dark:bg-slate-500/20 dark:text-slate-300",
    solid: "bg-[#475569] text-white",
  },
  orange: {
    soft: "bg-[#fff7ed] text-[#c2410c] dark:bg-orange-500/15 dark:text-orange-300",
    solid: "bg-[#f97316] text-white",
  },
};

/** Rounded icon square. `solid` = coloured square with a white icon. */
export function IconBox({
  icon: Icon,
  tone = "mint",
  size = 44,
  solid = false,
  className,
}: {
  icon: TbdIcon;
  tone?: IconTone;
  size?: number;
  solid?: boolean;
  className?: string;
}) {
  const radius = size >= 44 ? 14 : size >= 36 ? 12 : 10;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        solid ? ICON_TONES[tone].solid : ICON_TONES[tone].soft,
        className,
      )}
      style={{ width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      <Icon style={{ width: Math.round(size * 0.46), height: Math.round(size * 0.46) }} strokeWidth={2.2} />
    </span>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────

/** Class string for a white card, for places that cannot use `<Surface>`. */
export const TBD_SURFACE =
  "rounded-[20px] bg-card text-card-foreground shadow-card dark:border dark:border-border/70";

/** White card. `flush` removes the padding (tables, lists with their own rows). */
export function Surface({
  as: Tag = "div",
  flush = false,
  className,
  children,
  ...rest
}: {
  as?: "div" | "section" | "article" | "aside";
  flush?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <Tag
      className={cn(TBD_SURFACE, "min-w-0", flush ? "overflow-hidden" : "flex flex-col gap-3.5 p-5", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Feature card: light gradient with two soft circles. tone: default mint, or video / aqua / sun. */
export function SoftCard({
  tone,
  className,
  children,
  as: Tag = "div",
  ...rest
}: {
  tone?: "video" | "aqua" | "sun";
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "header";
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <Tag className={cn("tbd-hero min-w-0 p-6", className)} {...(tone ? { "data-tone": tone } : {})} {...rest}>
      {children}
    </Tag>
  );
}

/** Page banner: eyebrow, title, one line of text, optional badge and actions. */
export function PageHero({
  eyebrow,
  title,
  description,
  badge,
  actions,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  /** Extra content on the right (for example stat tiles). Replaces `actions` when given. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <SoftCard as="header" className={cn("p-[26px]", className)}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          {eyebrow ? (
            <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-brand">{eyebrow}</span>
          ) : null}
          <h1 className="m-0 text-[26px] font-extrabold leading-tight tracking-[-0.5px] text-ink">{title}</h1>
          {description ? (
            <p className="m-0 max-w-[620px] text-sm text-ink-muted" suppressHydrationWarning>
              {description}
            </p>
          ) : null}
          {badge ? <div className="mt-1 flex flex-wrap items-center gap-2">{badge}</div> : null}
        </div>
        {children ?? (actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null)}
      </div>
    </SoftCard>
  );
}

/** Plain title row for inner pages (no banner). `backHref` adds a small back link above. */
export function PageHead({
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-5", className)}>
      <div className="flex min-w-0 flex-col">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-1.5 inline-flex items-center gap-1 self-start text-[13px] font-semibold text-ink-muted hover:text-ink"
          >
            <ChevronLeft className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.4px] text-ink">{title}</h1>
        {description ? <p className="m-0 mt-0.5 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

/** Card heading: title on the left, one action on the right. */
export function SectionTitle({
  title,
  description,
  icon: Icon,
  count,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: TbdIcon;
  count?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-[18px] shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" /> : null}
          <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
          {count !== undefined && count !== null ? (
            <span className="inline-flex h-[22px] min-w-6 items-center justify-center rounded-full bg-mint px-[7px] text-xs font-extrabold text-brand-dark">
              {count}
            </span>
          ) : null}
        </div>
        {description ? <p className="m-0 text-[13px] text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────

/** Stat card: label, big number, small line under it, icon square on the right. */
export function Kpi({
  label,
  value,
  hint,
  icon,
  tone = "mint",
  valueClassName,
  href,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: TbdIcon;
  tone?: IconTone;
  valueClassName?: string;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-xs font-bold text-ink-muted">{label}</span>
        <span className={cn("truncate text-[26px] font-extrabold leading-[1.15] text-ink", valueClassName)}>
          {value}
        </span>
        {hint ? <span className="truncate text-xs text-ink-muted">{hint}</span> : null}
      </span>
      {icon ? <IconBox icon={icon} tone={tone} /> : null}
    </>
  );
  const shell = cn(
    "flex min-w-0 items-center gap-3.5 rounded-[18px] bg-card px-[18px] py-4 shadow-card dark:border dark:border-border/70",
    href && "transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
    className,
  );
  return href ? (
    <Link href={href} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/** Small number tile used inside a banner ("6 Today", "4 Confirmed"). */
export function MiniStat({
  value,
  label,
  valueClassName,
  labelClassName,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[96px] flex-col gap-0.5 rounded-2xl bg-white/85 px-3.5 py-2.5 shadow-card dark:bg-white/5",
        className,
      )}
    >
      <span className={cn("text-2xl font-extrabold leading-[1.1] text-ink", valueClassName)}>{value}</span>
      <span className={cn("whitespace-nowrap text-xs font-semibold text-ink-muted", labelClassName)}>{label}</span>
    </div>
  );
}

// ── Details ────────────────────────────────────────────────────────────────

/** Label over value (details grids). */
export function Kv({
  label,
  value,
  strong = true,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={cn("text-sm text-ink", strong ? "font-bold" : "font-medium")}>{value}</span>
    </div>
  );
}

/** One row of a summary: label on the left, amount on the right. */
export function SummaryLine({
  label,
  value,
  bold = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-3 text-ink",
        bold ? "text-[15px] font-extrabold" : "text-sm font-medium",
        className,
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-hair", className)} role="separator" />;
}

/** List row: icon or avatar on the left, title + second line, something on the right. */
export function ListRow({
  left,
  title,
  description,
  right,
  href,
  border = true,
  className,
}: {
  left?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  href?: string;
  border?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {left}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-ink">{title}</span>
        {description ? <span className="truncate text-xs text-ink-muted">{description}</span> : null}
      </span>
      {right}
    </>
  );
  const shell = cn("flex items-center gap-3.5 py-3.5 text-ink", border && "border-b border-hair last:border-b-0", className);
  return href ? (
    <Link href={href} className={cn(shell, "hover:text-brand-dark")}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/** Round avatar with initials (fallback when there is no photo). */
const AVATAR_TONES = [
  "bg-[#fde68a] text-[#92400e]",
  "bg-[#ddd6fe] text-[#5b21b6]",
  "bg-[#bae6fd] text-[#075985]",
  "bg-[#fecdd3] text-[#9f1239]",
  "bg-[#bbf7d0] text-[#166534]",
  "bg-[#fed7aa] text-[#9a3412]",
] as const;

export function InitialsAvatar({
  name,
  size = 38,
  square = false,
  className,
}: {
  name?: string | null;
  size?: number;
  square?: boolean;
  className?: string;
}) {
  const clean = String(name ?? "").replace(/^Dr\.?\s+/i, "").trim();
  const initials =
    clean
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";
  const hash = clean.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center font-extrabold",
        AVATAR_TONES[hash % AVATAR_TONES.length],
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: square ? Math.round(size * 0.3) : size / 2,
        fontSize: Math.max(11, Math.round(size * 0.36)),
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

// ── Notes ──────────────────────────────────────────────────────────────────

const NOTE_TONES = {
  blue: "border-[#93c5fd] bg-[#eef6ff] text-[#1e3a8a] [&_svg]:text-[#2563eb] dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200 dark:[&_svg]:text-blue-300",
  green:
    "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46] [&_svg]:text-[#047857] dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 dark:[&_svg]:text-emerald-300",
  amber:
    "border-[#fcd34d] bg-[#fffbeb] text-[#92400e] [&_svg]:text-[#d97706] dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 dark:[&_svg]:text-amber-300",
  rose: "border-[#fecdd3] bg-[#fff1f2] text-[#9f1239] [&_svg]:text-[#e11d48] dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200 dark:[&_svg]:text-rose-300",
} as const;

/** Dashed information note. */
export function Note({
  tone = "blue",
  icon: Icon = Info,
  className,
  children,
}: {
  tone?: keyof typeof NOTE_TONES;
  icon?: TbdIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3.5 text-[13px] leading-normal",
        NOTE_TONES[tone],
        className,
      )}
    >
      <Icon className="size-[22px] shrink-0" strokeWidth={2} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Empty state inside a card. */
export function EmptyBlock({
  icon: Icon,
  tone = "mint",
  title,
  description,
  action,
  className,
}: {
  icon?: TbdIcon;
  /** Icon colour: mint for "nothing here", rose for "could not load", amber for a warning. */
  tone?: IconTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5 px-5 py-10 text-center", className)}>
      {Icon ? <IconBox icon={Icon} tone={tone} size={48} /> : null}
      <h3 className="m-0 text-base font-bold text-ink">{title}</h3>
      {description ? <p className="m-0 max-w-[46ch] text-[13.5px] leading-relaxed text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-1.5">{action}</div> : null}
    </div>
  );
}

// ── Data rows (grid tables) ────────────────────────────────────────────────

/** Header row of a grid table. `columns` is a CSS grid-template-columns value shared with the rows. */
export function GridHead({
  columns,
  labels,
  className,
}: {
  columns: string;
  labels: ReactNode[];
  className?: string;
}) {
  return (
    <div
      role="row"
      className={cn(
        "hidden items-center gap-4 border-b border-hair px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted lg:grid",
        className,
      )}
      style={{ gridTemplateColumns: columns }}
    >
      {labels.map((label, index) => (
        <span role="columnheader" key={index}>
          {label}
        </span>
      ))}
    </div>
  );
}

/** One row of a grid table (stacks on small screens). */
export function GridRow({
  columns,
  className,
  children,
}: {
  columns: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="row"
      className={cn(
        "flex flex-col gap-3 border-b border-hair px-5 py-3 text-sm last:border-b-0 lg:grid lg:min-h-[60px] lg:items-center lg:gap-4 lg:py-2 [&>*]:min-w-0",
        className,
      )}
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </div>
  );
}

/** Two-line table cell (bold title, muted second line), optional avatar or icon on the left. */
export function CellTitle({
  title,
  description,
  left,
  className,
  wrapTitle = false,
  titleHint,
}: {
  title: ReactNode;
  description?: ReactNode;
  left?: ReactNode;
  className?: string;
  /** Let a long title wrap onto a second line instead of being cut off with an ellipsis. */
  wrapTitle?: boolean;
  /** Native tooltip with the full title text. */
  titleHint?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {left}
      <span className="flex min-w-0 flex-col gap-px">
        <span
          className={cn("text-sm font-bold text-ink", wrapTitle ? "line-clamp-2 break-words" : "truncate")}
          {...(titleHint ? { title: titleHint } : {})}
        >
          {title}
        </span>
        {description ? <span className="truncate text-xs text-ink-muted">{description}</span> : null}
      </span>
    </div>
  );
}
