import { cn } from "@/lib/utils";

/**
 * Hero artwork for the patient-facing page headers.
 *
 * Drawn rather than shipped as an image: it stays crisp at any size, adds no
 * network weight, and the greens follow the theme. Skin and hair keep fixed
 * values so the figure reads the same in light and dark mode.
 */
export function DashboardHeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 240"
      role="img"
      aria-label="Illustration of a doctor wearing a stethoscope"
      className={cn("h-full w-auto", className)}
    >
      {/* backdrop */}
      <circle cx="196" cy="126" r="104" className="fill-emerald-200/70 dark:fill-emerald-900/50" />
      <circle cx="196" cy="126" r="80" className="fill-emerald-300/70 dark:fill-emerald-800/50" />

      {/* leaves behind the figure */}
      <g className="fill-emerald-400 dark:fill-emerald-700">
        <path d="M104 60c26-20 54-20 76-6-16 24-44 32-72 22-2-5-3-11-4-16Z" />
        <path d="M302 70c-4 30-24 52-50 58 2-30 20-50 50-58Z" />
        <path d="M46 168c22-14 46-14 66 0-18 18-44 20-66 0Z" />
      </g>
      <g className="fill-emerald-500 dark:fill-emerald-600">
        <path d="M116 64c18-2 36 2 52 12-18 2-36-2-52-12Z" />
        <path d="M290 82c-8 22-22 38-40 46 6-22 20-38 40-46Z" />
      </g>

      {/* coat */}
      <path
        d="M132 240v-24c0-26 16-46 40-54l24-8 24 8c24 8 40 28 40 54v24Z"
        className="fill-white dark:fill-slate-200"
      />
      <path
        d="M132 240v-24c0-24 14-43 36-52l-12 76Z"
        className="fill-slate-100 dark:fill-slate-300"
      />

      {/* neck */}
      <path d="M182 146h28v22c0 8-28 8-28 0Z" fill="#D99B74" />

      {/* scrubs under the coat */}
      <path d="M196 240l-18-86 18 8 18-8Z" className="fill-emerald-600" />
      <path d="M178 154l18 30 18-30-18-8Z" className="fill-emerald-700" />

      {/* lapels */}
      <path
        d="M172 162l24 78-40-24 4-48Z"
        strokeWidth="2"
        className="fill-white stroke-slate-200 dark:fill-slate-200 dark:stroke-slate-400"
      />
      <path
        d="M220 162l-24 78 40-24-4-48Z"
        strokeWidth="2"
        className="fill-white stroke-slate-200 dark:fill-slate-200 dark:stroke-slate-400"
      />

      {/* head */}
      <ellipse cx="196" cy="112" rx="34" ry="38" fill="#E8AF86" />
      <circle cx="162" cy="116" r="7" fill="#E8AF86" />
      <circle cx="230" cy="116" r="7" fill="#E8AF86" />
      <path
        d="M162 106c0-24 15-38 34-38s34 14 34 38c-6-4-9-12-10-20-10 10-26 14-44 10-6 2-11 6-14 10Z"
        fill="#2E2A26"
      />
      <g fill="#2E2A26">
        <rect x="176" y="107" width="13" height="3" rx="1.5" />
        <rect x="203" y="107" width="13" height="3" rx="1.5" />
        <circle cx="182.5" cy="118" r="3.4" />
        <circle cx="209.5" cy="118" r="3.4" />
      </g>
      <path
        d="M187 133c5 5 13 5 18 0"
        stroke="#B9764E"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* stethoscope */}
      <g
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        className="stroke-slate-700 dark:stroke-slate-600"
      >
        <path d="M172 160c-4 22 2 40 14 52" />
        <path d="M220 160c4 20 0 34-10 44" />
      </g>
      <circle cx="210" cy="208" r="10" className="fill-slate-700 dark:fill-slate-600" />
      <circle cx="210" cy="208" r="5" className="fill-slate-400" />
    </svg>
  );
}
