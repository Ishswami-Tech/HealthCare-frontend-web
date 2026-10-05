/**
 * ============================================================================
 *  DESIGN TOKENS — the single source of truth for colour on public surfaces
 * ============================================================================
 *
 * Four tiers, in order of precedence. Pick from the highest tier that fits;
 * never reach past a tier to a raw Tailwind colour class.
 *
 *  1. SEMANTIC ROLES   `bg-background`, `text-foreground`, `bg-card`,
 *                      `border-border`, `bg-primary`, `text-muted-foreground`
 *                      Theme-aware CSS variables declared in `globals.css`.
 *                      These are the default for anything structural.
 *
 *  2. SURFACES         `SURFACE.canvas | raised | ink`
 *                      The three page bands. Alternate them for rhythm.
 *
 *  3. ACCENTS          `ACCENTS[<one of six>]`
 *                      Categorisation only — "this card is about Agnikarma".
 *                      Six and only six. Adding a seventh needs a real reason.
 *
 *  4. STATUS           `STATUS.success | warning | danger | info | neutral`
 *                      Meaning only — "this outcome is risky". Never decorative.
 *
 * The distinction between tiers 3 and 4 is the one that matters: an accent
 * says *what kind of thing* this is, a status says *how it is going*. Using a
 * red accent for decoration makes every genuine warning on the page quieter.
 *
 * Every value is a complete Tailwind class string so the compiler can detect
 * it statically — never build these by interpolation.
 */

/* -------------------------------------------------------------------------- */
/*  Tier 3 — Accents                                                           */
/* -------------------------------------------------------------------------- */

export type AccentName = "emerald" | "teal" | "sky" | "violet" | "amber" | "rose";

export interface AccentTokens {
  /** Soft tinted plate with a coloured icon and an inset hairline ring. */
  plate: string;
  /** Soft tinted surface for card headers and backgrounds. */
  soft: string;
  /** Saturated gradient stops, used together with `bg-linear-to-*`. */
  gradient: string;
  /** Darker gradient stops for the hovered state of a gradient surface. */
  gradientHover: string;
  /** Coloured text on light and dark surfaces. */
  text: string;
  /** Subtle coloured border. */
  border: string;
  /** Background for a hairline divider drawn inside a tinted surface. */
  rule: string;
  /** Diagonal tint-to-card wash for a card whose whole surface is coloured. */
  wash: string;
  /** Coloured drop shadow for raised gradient plates. */
  glow: string;
  /** Border treatment applied while a card is hovered. */
  hover: string;
}

export const ACCENTS: Record<AccentName, AccentTokens> = {
  emerald: {
    plate: "bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-300",
    soft: "bg-emerald-50/70 dark:bg-emerald-950/30",
    gradient: "from-emerald-500 to-teal-500",
    gradientHover: "from-emerald-600 to-teal-600",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/70 dark:border-emerald-900/50",
    rule: "bg-emerald-500/15 dark:bg-emerald-400/15",
    wash: "bg-linear-to-br from-emerald-50 via-card to-card dark:from-emerald-950/40 dark:via-card dark:to-card",
    glow: "shadow-lg shadow-emerald-500/25",
    hover: "hover:border-emerald-300/80 dark:hover:border-emerald-800",
  },
  teal: {
    plate: "bg-teal-500/10 text-teal-600 ring-1 ring-inset ring-teal-500/20 dark:text-teal-300",
    soft: "bg-teal-50/70 dark:bg-teal-950/30",
    gradient: "from-teal-500 to-cyan-600",
    gradientHover: "from-teal-600 to-cyan-700",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200/70 dark:border-teal-900/50",
    rule: "bg-teal-500/15 dark:bg-teal-400/15",
    wash: "bg-linear-to-br from-teal-50 via-card to-card dark:from-teal-950/40 dark:via-card dark:to-card",
    glow: "shadow-lg shadow-teal-500/25",
    hover: "hover:border-teal-300/80 dark:hover:border-teal-800",
  },
  sky: {
    plate: "bg-sky-500/10 text-sky-600 ring-1 ring-inset ring-sky-500/20 dark:text-sky-300",
    soft: "bg-sky-50/70 dark:bg-sky-950/30",
    gradient: "from-sky-500 to-cyan-500",
    gradientHover: "from-sky-600 to-cyan-600",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200/70 dark:border-sky-900/50",
    rule: "bg-sky-500/15 dark:bg-sky-400/15",
    wash: "bg-linear-to-br from-sky-50 via-card to-card dark:from-sky-950/40 dark:via-card dark:to-card",
    glow: "shadow-lg shadow-sky-500/25",
    hover: "hover:border-sky-300/80 dark:hover:border-sky-800",
  },
  violet: {
    plate: "bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/20 dark:text-violet-300",
    soft: "bg-violet-50/70 dark:bg-violet-950/30",
    gradient: "from-violet-500 to-indigo-500",
    gradientHover: "from-violet-600 to-indigo-600",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200/70 dark:border-violet-900/50",
    rule: "bg-violet-500/15 dark:bg-violet-400/15",
    wash: "bg-linear-to-br from-violet-50 via-card to-card dark:from-violet-950/40 dark:via-card dark:to-card",
    glow: "shadow-lg shadow-violet-500/25",
    hover: "hover:border-violet-300/80 dark:hover:border-violet-800",
  },
  amber: {
    plate: "bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-300",
    soft: "bg-amber-50/70 dark:bg-amber-950/30",
    gradient: "from-amber-500 to-orange-500",
    gradientHover: "from-amber-600 to-orange-600",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/70 dark:border-amber-900/50",
    rule: "bg-amber-500/15 dark:bg-amber-400/15",
    wash: "bg-linear-to-br from-amber-50 via-card to-card dark:from-amber-950/40 dark:via-card dark:to-card",
    glow: "shadow-lg shadow-amber-500/25",
    hover: "hover:border-amber-300/80 dark:hover:border-amber-800",
  },
  rose: {
    plate: "bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/20 dark:text-rose-300",
    soft: "bg-rose-50/70 dark:bg-rose-950/30",
    gradient: "from-rose-500 to-pink-500",
    gradientHover: "from-rose-600 to-pink-600",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200/70 dark:border-rose-900/50",
    rule: "bg-rose-500/15 dark:bg-rose-400/15",
    wash: "bg-linear-to-br from-rose-50 via-card to-card dark:from-rose-950/40 dark:via-card dark:to-card",
    glow: "shadow-lg shadow-rose-500/25",
    hover: "hover:border-rose-300/80 dark:hover:border-rose-800",
  },
};

/**
 * Each therapy owns exactly one accent, everywhere it appears — homepage
 * cards, nav, treatment pages, comparison tables. Read the accent from here
 * rather than re-picking a colour per page.
 */
export const THERAPY_ACCENT = {
  panchakarma: "sky",
  agnikarma: "amber",
  viddhakarma: "violet",
} as const satisfies Record<string, AccentName>;

/* -------------------------------------------------------------------------- */
/*  Tier 4 — Status                                                            */
/* -------------------------------------------------------------------------- */

export type StatusName = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusTokens {
  /** Foreground for a status word inside running text or a table cell. */
  text: string;
  /** Filled pill: background + text + border, for badges. */
  pill: string;
  /** Solid dot, for legends and inline markers. */
  dot: string;
}

export const STATUS: Record<StatusName, StatusTokens> = {
  success: {
    text: "text-emerald-700 dark:text-emerald-400",
    pill: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  warning: {
    text: "text-amber-700 dark:text-amber-400",
    pill: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  danger: {
    text: "text-rose-700 dark:text-rose-400",
    pill: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  info: {
    text: "text-sky-700 dark:text-sky-400",
    pill: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  neutral: {
    text: "text-muted-foreground",
    pill: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/50",
  },
};

/* -------------------------------------------------------------------------- */
/*  Tier 2 — Surfaces                                                          */
/* -------------------------------------------------------------------------- */

/** Deep emerald used for conversion bands and editorial contrast. */
export const INK_BG = "bg-[oklch(0.22_0.045_163)] dark:bg-[oklch(0.17_0.035_163)]";

export const SURFACE = {
  /** Page canvas — the lightest band in the stack. */
  canvas: "bg-background",
  /** Raised band used to separate consecutive light sections. */
  raised: "border-y border-border/60 bg-card",
  /** Warm paper band for editorial/heritage content. */
  parchment: "border-y border-amber-100/70 bg-[#faf8f2] dark:border-amber-950/40 dark:bg-[oklch(0.19_0.012_75)]",
  /** Deep emerald band. Sets `text-white`; pair with the grain/aurora layers. */
  ink: `relative isolate overflow-hidden text-white ${INK_BG}`,
} as const;

/* -------------------------------------------------------------------------- */
/*  Layout rhythm                                                              */
/* -------------------------------------------------------------------------- */

/** Horizontal gutter + max width shared by every section. */
export const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Vertical rhythm. Standard-website density, not a spaced-out landing page. */
export const SECTION_Y = "py-12 sm:py-14 lg:py-20";

/** Gap between a section heading and the content it introduces. */
export const HEADING_GAP = "mt-9 lg:mt-11";

/* -------------------------------------------------------------------------- */
/*  Cards and plates                                                           */
/* -------------------------------------------------------------------------- */

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * HOVER TIMING — one curve and one delay for every card on the site.
 *
 * The expo ease above is right for an entrance, where the element should
 * arrive quickly and settle. On hover it was wrong: expo puts ~80% of the
 * travel in the first third of the duration, so a card appeared to snap to its
 * raised position and then drift. This is a plain ease-out — gentle all the
 * way through, no snap — and the 90ms enter delay means a pointer passing over
 * a card on its way somewhere else never starts the animation at all.
 *
 * `translate` and `scale` must both be named in the property list. Tailwind v4
 * writes `-translate-y-1` / `scale-105` to the standalone `translate` and
 * `scale` properties rather than to `transform`, so a transition that lists
 * only `transform` animates nothing and the card jumps to its raised position
 * in a single frame. `transform` stays listed for rotation utilities.
 *
 * The delay is deliberately only on the way in: `delay-0` is the resting
 * value, so releasing a hover begins unwinding immediately and the card never
 * feels stuck to the cursor.
 *
 * USE THIS EVERYWHERE A HOVER MOVES SOMETHING. The homepage previously ran a
 * dozen clocks — cards at one duration, their icon plates at another, a glow
 * at a third — so hovering one card started four animations that finished at
 * four different moments. Individually each was fine; together they read as
 * the thing not settling. One duration, one curve, one delay is what makes a
 * card feel like a single object.
 */
const HOVER_EASE = "ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";
const HOVER_DURATION = "duration-[650ms]";

export const HOVER_TRANSITION =
  `transition-[translate,scale,transform,box-shadow,border-color,background-color,opacity] ${HOVER_DURATION} ${HOVER_EASE} delay-0 hover:delay-[90ms]`;

/**
 * Same curve and delay for an element that moves with its hovered ancestor —
 * an icon plate, a chevron, a watermark. Requires `group` on that ancestor.
 * Sharing the timing is what makes a card read as one object rather than a
 * pile of parts that each animate on their own schedule.
 */
export const HOVER_TRANSITION_CHILD =
  `transition-[translate,scale,transform,opacity,color,background-color,border-color,box-shadow] ${HOVER_DURATION} ${HOVER_EASE} delay-0 group-hover:delay-[90ms]`;

/**
 * The one distance a card travels when it is hovered. Cards that set their own
 * tint and shadow (the tinted feature, treatment and specialization grids)
 * import this instead of writing their own `hover:-translate-y-*`, so the whole
 * page lifts by the same amount.
 */
export const HOVER_CARD_LIFT = "hover:-translate-y-1";

/**
 * CONTROL HOVER — the second and last tier.
 *
 * A button, chip or icon button is small, is clicked rather than read, and
 * sits under the pointer for a moment, so it answers faster and travels less
 * than a card: half the distance, half the time, no enter delay, and the expo
 * curve that suits a short move. Two tiers is the whole system — anything that
 * moves on hover uses this or the card pair above, never a third duration.
 *
 * `active:translate-y-0` drops it back under the press so the click lands on a
 * control that is where the pointer is.
 */
export const CONTROL_TRANSITION =
  `transition-[translate,scale,transform,box-shadow,background-color,border-color,color] duration-300 ${EASE}`;

export const CONTROL_LIFT = "hover:-translate-y-0.5 active:translate-y-0";

/** Resting card: hairline border, almost no shadow, generous radius. */
export const CARD =
  `relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,40,32,0.05)] ${HOVER_TRANSITION}`;

/**
 * Add to `CARD` for an interactive card that lifts on hover.
 *
 * The lift is deliberately small (4px). A card that rises further reads as
 * jumping at the cursor; this is closer to the page breathing. Keep every card
 * lift on the homepage at this one distance — see `HOVER_CARD_LIFT`.
 */
export const CARD_INTERACTIVE =
  `${HOVER_CARD_LIFT} hover:border-primary/30 hover:shadow-[0_28px_56px_-28px_rgba(10,70,52,0.42)]`;

/** Flat card used inside dark bands. */
export const CARD_INK =
  `relative overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.06] backdrop-blur-sm ${HOVER_TRANSITION}`;

/** Inner panel nested inside a card (stat strips, meta rows). */
export const PANEL = "rounded-2xl border border-border/60 bg-background/70";

/** Hairline-divided board: put this on the grid, `bg-card` on each cell. */
export const BOARD = "grid gap-px overflow-hidden rounded-[1.75rem] border border-border/70 bg-border/70";

/** Square icon plate sized for card headers. Pair with `ACCENTS[x].plate`. */
export const ICON_PLATE =
  `flex size-12 shrink-0 items-center justify-center rounded-2xl ${HOVER_TRANSITION_CHILD} group-hover:scale-105`;

/** Gradient icon plate for category-led cards. Pair with `ACCENTS[x].gradient`. */
export const ICON_PLATE_SOLID =
  `flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white ${HOVER_TRANSITION_CHILD} group-hover:scale-105`;

/* -------------------------------------------------------------------------- */
/*  Typography                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Display ramp. `home-display` applies the negative tracking Sora needs at
 * large sizes — see `src/styles/home.css`.
 */
export const DISPLAY_XL =
  "home-display font-heading font-semibold text-balance text-[clamp(2.25rem,1.3rem+3.6vw,4rem)] leading-[1.04]";

export const DISPLAY_LG =
  "home-display font-heading font-semibold text-balance text-[clamp(1.6rem,1.1rem+1.9vw,2.75rem)] leading-[1.12]";

export const DISPLAY_MD = "home-display font-heading text-xl font-semibold sm:text-2xl";

/** Small uppercase label above a group of fields or list items. */
export const META_LABEL =
  "font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";
