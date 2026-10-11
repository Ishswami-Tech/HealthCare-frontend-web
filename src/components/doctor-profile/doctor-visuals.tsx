"use client";

import Image from "next/image";
import { m } from "motion/react";
import {
  Award,
  Globe,
  GraduationCap,
  HeartPulse,
  Medal,
  Mic,
  Presentation,
  Sprout,
  Stethoscope,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { REVEAL_ITEM_VARIANTS, RevealGroup } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";
import { ACCENTS, HOVER_TRANSITION_CHILD, type AccentName } from "@/lib/design/tokens";
import { splitAchievement } from "./doctor-profile-data";

/**
 * Shared by the homepage spotlight and the /drdeshmukh profile so the doctor
 * looks the same wherever he is introduced.
 */

/** Cut from the approved spotlight design; it carries its own pale botanical backdrop. */
const PORTRAIT = { src: "/assets/doctor/deshmukh-spotlight-portrait.webp", width: 598, height: 490 } as const;

/** Small decorative leaf, tinted by `currentColor`. */
export function LeafGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d="M3 29C3 14.6 13.4 3 29 3c0 15.6-11.6 26-26 26Z" fill="currentColor" />
      <path
        d="M3 29 21.5 10.5"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface DoctorPortraitProps {
  alt: string;
  experienceValue: string;
  experienceLabel: string;
  /** Set where the portrait is above the fold. */
  priority?: boolean;
}

/**
 * Feathered portrait with the experience badge. Must sit inside a
 * `.home-light-band`: the photograph's backdrop is pale in both themes.
 */
export function DoctorPortrait({ alt, experienceValue, experienceLabel, priority = false }: DoctorPortraitProps) {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* The photograph bleeds into the page margin on wide screens; the badge stays on the grid. */}
      <div className="home-spotlight-bleed">
        <Image
          src={PORTRAIT.src}
          alt={alt}
          width={PORTRAIT.width}
          height={PORTRAIT.height}
          priority={priority}
          sizes="(min-width: 1280px) 32rem, (min-width: 1024px) 40vw, 28rem"
          className="home-feather-portrait h-auto w-full"
        />
      </div>

      <div className="absolute bottom-[2%] left-0 flex items-center gap-3 rounded-2xl bg-card p-3 pr-4 shadow-[0_22px_44px_-20px_rgba(10,70,52,0.38)] ring-1 ring-border/70">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sprout className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading text-lg font-bold leading-tight text-foreground">{experienceValue}</p>
          <p className="mt-0.5 max-w-[9rem] text-xs leading-snug text-muted-foreground">{experienceLabel}</p>
        </div>
      </div>
    </div>
  );
}

type CredentialVisual = { Icon: LucideIcon; accent: AccentName };

/**
 * Each credential in `heroText` is authored with a leading emoji. That emoji is
 * the same in every language, so it keys the icon and accent shown in its
 * place. U+FE0F (emoji presentation) is stripped on both sides of the lookup.
 */
const stripPresentation = (value: string) => value.replace(/\uFE0F/g, "");

const CREDENTIAL_VISUALS = new Map<string, CredentialVisual>(
  (
    [
      ["\u{1F3C5}", { Icon: Award, accent: "amber" }], // Governor's award
      ["\u{1F1F3}\u{1F1F5}", { Icon: Medal, accent: "rose" }], // Government of Nepal award
      ["\u{1F947}", { Icon: GraduationCap, accent: "violet" }], // BAMS, DYND gold medalist
      ["\u{1F30D}", { Icon: Trophy, accent: "emerald" }], // Viddhakarma world record
      ["\u{1F468}\u200D\u2695", { Icon: Stethoscope, accent: "teal" }], // Vaidyaratna, Sushrutaratna
      ["\u{1F3A4}", { Icon: Mic, accent: "sky" }], // Lectures
      ["\u{1F393}", { Icon: Presentation, accent: "violet" }], // Workshops
      ["\u{1F30E}", { Icon: Globe, accent: "teal" }], // Patients from 22+ countries
      ["\u2764", { Icon: HeartPulse, accent: "rose" }], // Successful treatments
      ["\u{1F468}\u200D\u{1F393}", { Icon: Users, accent: "amber" }], // Doctors trained
    ] as const
  ).map(([emoji, visual]) => [stripPresentation(emoji), visual])
);

const FALLBACK_VISUAL: CredentialVisual = { Icon: Sprout, accent: "emerald" };

function credentialVisual(emoji: string | null): CredentialVisual {
  return (emoji && CREDENTIAL_VISUALS.get(stripPresentation(emoji))) || FALLBACK_VISUAL;
}

/** One credential, e.g. "🏅 Honored by the Governor of India", drawn as a coloured icon. */
function CredentialItem({ item }: { item: string }) {
  const { icon, label } = splitAchievement(item);
  const { Icon, accent } = credentialVisual(icon);
  const tint = ACCENTS[accent];

  return (
    <m.li
      variants={REVEAL_ITEM_VARIANTS}
      className="group flex items-center gap-3 text-left sm:flex-col sm:gap-0 sm:text-center"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full bg-card p-1 shadow-[0_12px_26px_-16px_rgba(10,70,52,0.5)] ring-1 ring-border/70 group-hover:-translate-y-1 group-hover:scale-105 sm:size-16 sm:p-1.5",
          HOVER_TRANSITION_CHILD
        )}
      >
        <span className={cn("flex size-full items-center justify-center rounded-full bg-linear-to-br text-white", tint.gradient, tint.glow)}>
          <Icon className="size-5 sm:size-6" strokeWidth={2} />
        </span>
      </span>
      <p className="min-w-0 text-[13px] font-semibold leading-snug text-pretty text-foreground sm:mt-3 sm:max-w-[11rem] sm:text-sm">
        {label}
      </p>
      <span aria-hidden="true" className={cn("mt-2.5 hidden h-0.5 w-8 rounded-full bg-linear-to-r sm:block", tint.gradient)} />
    </m.li>
  );
}

/**
 * The thread that runs through the credential plates on wide screens: one
 * 100-unit cell per credential, bowing alternately above and below the
 * centre line so it reads as a vine rather than a ruler.
 */
const CREDENTIAL_SLOTS = 10;
const VINE_PATH = `M0 32 ${Array.from(
  { length: CREDENTIAL_SLOTS },
  (_, index) => `Q ${index * 100 + 50} ${index % 2 === 0 ? 8 : 56} ${index * 100 + 100} 32`
).join(" ")}`;

/**
 * Ten credentials: compact icon-and-label rows (2 × 5) on phones, 5 × 2 on
 * tablets, one row of 10 on a vine on desktop.
 */
export function DoctorCredentials({ achievements, className }: { achievements: string[]; className?: string }) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <RevealGroup className={cn("relative", className)}>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${CREDENTIAL_SLOTS * 100} 64`}
        preserveAspectRatio="none"
        fill="none"
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-16 w-full text-primary/25 xl:block"
      >
        <path d={VINE_PATH} stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-5 sm:gap-x-4 sm:gap-y-9 xl:grid-cols-10">
        {achievements.map((item) => (
          <CredentialItem key={item} item={item} />
        ))}
      </ul>
    </RevealGroup>
  );
}
