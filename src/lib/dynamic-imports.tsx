"use client";

/**
 * Dynamic imports for the public homepage.
 * Below-the-fold sections are code-split and rendered on the client once
 * `LazySection` scrolls them into view.
 */

import { createDynamicComponent } from "@/lib/dynamic-imports-utils";
import { SectionSkeleton } from "@/lib/dynamic-imports-skeletons";

const LAZY_OPTIONS = { ssr: false, loading: SectionSkeleton } as const;

export const HomeSpecializations = createDynamicComponent(
  () => import("@/components/home/HomeSpecializations"),
  LAZY_OPTIONS
);

export const HomeHealthAssessment = createDynamicComponent(
  () => import("@/components/home/HomeHealthAssessment"),
  LAZY_OPTIONS
);

export const HomeTreatments = createDynamicComponent(
  () => import("@/components/home/HomeTreatments"),
  LAZY_OPTIONS
);

export const HomeTestimonials = createDynamicComponent(
  () => import("@/components/home/HomeTestimonials"),
  LAZY_OPTIONS
);

export const HomeTrust = createDynamicComponent(
  () => import("@/components/home/HomeTrust"),
  LAZY_OPTIONS
);

export const HomeCertifications = createDynamicComponent(
  () => import("@/components/home/HomeCertifications"),
  LAZY_OPTIONS
);

export const HomeCarePaths = createDynamicComponent(
  () => import("@/components/home/HomeCarePaths"),
  LAZY_OPTIONS
);

export const HomeContactChannels = createDynamicComponent(
  () => import("@/components/home/HomeContactChannels"),
  LAZY_OPTIONS
);

export const HomeFinalCta = createDynamicComponent(
  () => import("@/components/home/HomeFinalCta"),
  LAZY_OPTIONS
);
