/**
 * Fixed dark colours of the call screens. The stage stays dark in both themes, so these are
 * literal values from the design boards and not theme tokens.
 */
export const CALL_COLORS = {
  page: "#0b1220",
  room: "#101828",
  panel: "#131c2e",
  raised: "#1f2a44",
  muted: "#9aa7bd",
} as const;

/** Stage background behind a participant whose camera is off. */
export const CALL_STAGE_BACKGROUND = "radial-gradient(520px 360px at 50% 42%, #24314f 0%, #151e33 70%)";

/** Visible keyboard focus on the dark call surfaces. */
export const CALL_FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#a5b4fc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131c2e]";

/**
 * Grows the touch target of a small control to at least 44 px without changing how it looks.
 * The control must be `relative`.
 */
export const CALL_HIT_44 = 
  "relative after:absolute after:left-1/2 after:top-1/2 after:size-full after:min-h-11 after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

/** One row of a call menu (42 px in the design; 44 px here for touch). */
export const CALL_MENU_ROW =
  "flex min-h-[44px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08]";
