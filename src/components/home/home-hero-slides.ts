"use client";

import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { BadgeCheck, Flame, Zap, type LucideIcon } from "lucide-react";
import { HOME_LINKS } from "./home-links";
import type { AccentName } from "@/lib/design/tokens";

/** Dwell time per slide before the hero advances on its own. */
export const SLIDE_DURATION_MS = 5000;

export interface HeroSlide {
  key: string;
  /** Drop a file at this path to change the image; no code change needed. */
  image: string;
  href: string;
  accent: AccentName;
  icon: LucideIcon;
  /** Caption shown over the photograph. */
  overlayTitleKey: string;
  overlayCaptionKey: string;
  /** Display lines for the left column; the second takes the gradient. */
  headlineKeys: readonly string[];
  /** Medium accent line under the headline. Treatments only. */
  taglineKey?: string;
  ledeKey: string;
  /**
   * `object-position` for this photograph. Each picture puts its subject
   * somewhere different — the moxa point on the knee sits low and right, the
   * Viddhakarma needle high and centre — so one shared value is necessarily
   * wrong for most of them, and at narrow widths "wrong" means the subject is
   * cropped out entirely. `focalMobile` is the tighter phone crop.
   */
  focal: string;
  focalMobile: string;
  /**
   * Translation path of this therapy's benefit list. The brand slide has none
   * — its three-line headline fills the same space that the benefits fill on
   * the single-line treatment slides.
   */
  benefitsKey?: string;
  /** The opening slide is the clinic itself, so it keeps the brand headline. */
  isDoctor?: boolean;
}

/** Benefits shown per treatment slide; more than this overflows the band. */
export const HERO_BENEFIT_COUNT = 3;

export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    key: "brand",
    image: "/assets/treatments/agnikarma-hero.webp",
    href: HOME_LINKS.treatments,
    accent: "emerald",
    icon: BadgeCheck,
    overlayTitleKey: "doctor.name",
    overlayCaptionKey: "doctor.title",
    headlineKeys: ["hero.title1", "hero.title2", "hero.title"],
    ledeKey: "hero.description",
    focal: "78% 60%",
    focalMobile: "80% 62%",
    isDoctor: true,
  },
  {
    key: "agnikarma-clinic",
    image: "/assets/treatments/agnikarma-clinic-heat.webp",
    href: HOME_LINKS.agnikarma,
    accent: "amber",
    icon: Flame,
    overlayTitleKey: "homepage.specializations.agnikarma.title",
    overlayCaptionKey: "homepage.specializations.agnikarma.description",
    /* `treatments.*.name` rather than the specializations title: the latter
       is "Viddha Karma", which wraps to a second display line and drags the
       whole reserved height up with it. The names are single words in every
       language and match the nav items. */
    headlineKeys: ["treatments.agnikarma.name"],
    taglineKey: "treatments.agnikarma.subtitle",
    ledeKey: "treatments.agnikarma.description",
    focal: "66% 56%",
    focalMobile: "68% 58%",
    benefitsKey: "treatments.agnikarma.benefits",
  },
  {
    key: "viddhakarma",
    image: "/assets/treatments/viddhakarma-hero.webp",
    href: HOME_LINKS.viddhaKarma,
    accent: "violet",
    icon: Zap,
    overlayTitleKey: "homepage.specializations.viddhakarma.title",
    overlayCaptionKey: "homepage.specializations.viddhakarma.description",
    headlineKeys: ["treatments.viddhakarma.name"],
    taglineKey: "treatments.viddhakarma.subtitle",
    ledeKey: "treatments.viddhakarma.description",
    focal: "68% 40%",
    focalMobile: "68% 38%",
    benefitsKey: "treatments.viddhakarma.benefits",
  },
  {
    key: "agnikarma-marma",
    image: "/assets/treatments/agnikarma-brow-marma.webp",
    href: HOME_LINKS.agnikarma,
    accent: "amber",
    icon: Flame,
    overlayTitleKey: "homepage.specializations.agnikarma.title",
    overlayCaptionKey: "homepage.specializations.agnikarma.description",
    headlineKeys: ["treatments.agnikarma.name"],
    taglineKey: "treatments.agnikarma.subtitle",
    ledeKey: "treatments.agnikarma.description",
    focal: "66% 44%",
    focalMobile: "68% 44%",
    benefitsKey: "treatments.agnikarma.benefits",
  },
];

export interface HeroCarousel {
  index: number;
  slide: HeroSlide;
  isPlaying: boolean;
  isStopped: boolean;
  goTo: (next: number) => void;
  toggleStopped: () => void;
  /** Spread onto whatever region should pause rotation while in use. */
  pauseHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocusCapture: () => void;
    onBlurCapture: () => void;
  };
}

/**
 * Owns the hero's rotation so the headline on the left and the photograph on
 * the right always describe the same service. Pauses while the visitor is
 * interacting with the hero, and never autoplays under reduced motion.
 */
export function useHeroCarousel(): HeroCarousel {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  const total = HERO_SLIDES.length;
  const isPlaying = !isPaused && !isStopped && !prefersReducedMotion;

  const goTo = useCallback((next: number) => setIndex(((next % total) + total) % total), [total]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % total), SLIDE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [index, isPlaying, total]);

  return {
    index,
    slide: HERO_SLIDES[index] ?? HERO_SLIDES[0]!,
    isPlaying,
    isStopped,
    goTo,
    toggleStopped: useCallback(() => setIsStopped((stopped) => !stopped), []),
    pauseHandlers: {
      onMouseEnter: () => setIsPaused(true),
      onMouseLeave: () => setIsPaused(false),
      onFocusCapture: () => setIsPaused(true),
      onBlurCapture: () => setIsPaused(false),
    },
  };
}
