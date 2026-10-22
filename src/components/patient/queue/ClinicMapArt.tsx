import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Map drawing ────────────────────────────────────────────────────────────

/**
 * A drawn street map with the clinic pin. Decoration only: it is not a live map.
 * Cropped from the left on narrow cards, so the pin stays in view.
 */
export function ClinicMapArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 680 224"
      preserveAspectRatio="xMaxYMid slice"
      className={cn("block size-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="680" height="224" className="fill-[#e9f0ea] dark:fill-[#1c2a26]" />
      <g className="fill-[#dde6de] dark:fill-[#24352f]">
        <rect x="18" y="22" width="170" height="100" rx="12" />
        <rect x="224" y="22" width="190" height="78" rx="12" />
        <rect x="470" y="22" width="190" height="118" rx="12" />
        <rect x="18" y="164" width="330" height="60" rx="12" />
        <rect x="384" y="196" width="276" height="40" rx="12" />
      </g>
      <ellipse cx="566" cy="88" rx="58" ry="34" className="fill-[#c5e3cd] dark:fill-[#2c4a3d]" />
      <g className="fill-white dark:fill-[#3a4b46]">
        <rect x="0" y="140" width="680" height="16" />
        <rect x="200" y="0" width="16" height="224" />
        <rect x="446" y="0" width="16" height="224" />
      </g>
      <path
        d="M366 0C352 76 300 150 150 224"
        fill="none"
        strokeWidth="18"
        strokeLinecap="round"
        className="stroke-[#fbe38e] dark:stroke-[#7a6a2c]"
      />
      <path
        d="M232 216C300 176 372 148 452 118"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="2 14"
        className="stroke-[#2563eb] dark:stroke-[#60a5fa]"
      />
      <g transform="translate(456 20)">
        <path d="M0 38C0 17 17 0 38 0s38 17 38 38c0 26-38 62-38 62S0 64 0 38z" fill="#dc2626" />
        <circle cx="38" cy="38" r="17" fill="#ffffff" />
        <path d="M38 28v20M28 38h20" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * The drawn map as a tile. With a directions link the whole tile opens Google Maps directions to
 * the clinic (new tab); without one it is decoration. `badge` sits along the bottom edge.
 */
export function ClinicMapTile({
  directionsUrl,
  placeName,
  badge,
  className,
}: {
  directionsUrl?: string | null;
  /** Used in the link label: "Directions to Main Clinic". */
  placeName?: string | null;
  badge?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <ClinicMapArt />
      {badge ? <span className="absolute bottom-3 left-3 right-3 z-10 flex">{badge}</span> : null}
      {directionsUrl ? (
        <span
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-bold text-[#047857] shadow-sm dark:bg-black/60 dark:text-emerald-300"
          aria-hidden="true"
        >
          Open map
          <ExternalLink className="size-3" strokeWidth={2.4} />
        </span>
      ) : null}
    </>
  );
  const frame = cn("relative block overflow-hidden rounded-2xl", className);
  return directionsUrl ? (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Directions to ${placeName || "the clinic"} in Google Maps (opens in a new tab)`}
      className={cn(frame, "transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40")}
    >
      {body}
    </a>
  ) : (
    <div className={frame}>{body}</div>
  );
}
