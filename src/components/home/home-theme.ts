/**
 * Homepage view of the project design tokens.
 *
 * The canonical definitions live in `@/lib/design/tokens` — this module only
 * re-exports them under the names the `home/` components already use, so the
 * homepage, the doctor profile page and the treatment pages all resolve to one
 * palette. New code should import from `@/lib/design/tokens` directly.
 */

export {
  ACCENTS as HOME_TINTS,
  BOARD,
  CARD,
  CARD_INK,
  CARD_INTERACTIVE,
  CONTAINER,
  HEADING_GAP,
  ICON_PLATE,
  ICON_PLATE_SOLID,
  PANEL,
  SECTION_Y,
} from "@/lib/design/tokens";

export type { AccentName as HomeTint, AccentTokens as HomeTintStyle } from "@/lib/design/tokens";

import { SURFACE } from "@/lib/design/tokens";

export const SURFACE_CANVAS = SURFACE.canvas;
export const SURFACE_RAISED = SURFACE.raised;
export const SURFACE_INK = SURFACE.ink;
