/**
 * Dynamic import utilities for Next.js 15 with enhanced code splitting
 * Optimizes bundle size and loading performance
 */

import React from "react";
import dynamic from "next/dynamic";
import { createDynamicComponent } from "@/lib/dynamic-imports-utils";
import {
  SectionSkeleton,
  CardSkeleton,
  FormSkeleton,
} from "@/lib/dynamic-imports-skeletons";

// Critical components (loaded immediately)
export const HeroSection = dynamic(
  () => import("@/components/ayurveda/HeroSection"),
  {
    ssr: true, // Server-side render for SEO
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 animate-pulse">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="h-12 bg-orange-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-6"></div>
            <div className="h-6 bg-orange-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
            <div className="flex justify-center gap-4">
              <div className="h-12 bg-orange-300 dark:bg-gray-600 rounded w-32"></div>
              <div className="h-12 bg-orange-300 dark:bg-gray-600 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export const StatsSection = dynamic(
  () => import("@/components/ayurveda/StatsSection"),
  {
    ssr: true,
    loading: () => (
      <div className="py-20 bg-gray-50 dark:bg-gray-900 animate-pulse">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

// Non-critical components (lazy loaded)
export const TreatmentOverview = createDynamicComponent(
  () => import("@/components/ayurveda/TreatmentOverview"),
  { ssr: false, loading: SectionSkeleton }
);

export const HealthAssessment = createDynamicComponent(
  () => import("@/components/ayurveda/HealthAssessment"),
  {
    ssr: false,
    loading: FormSkeleton,
  }
);

export const TestimonialsSection = createDynamicComponent(
  () => import("@/components/ayurveda/TestimonialsSection"),
  { ssr: false, loading: SectionSkeleton }
);

export const TrustBuilding = createDynamicComponent(
  () => import("@/components/ayurveda/TrustBuilding"),
  { ssr: false, loading: SectionSkeleton }
);

export const ComprehensiveCTA = createDynamicComponent(
  () => import("@/components/ayurveda/ComprehensiveCTA"),
  { ssr: false, loading: SectionSkeleton }
);



