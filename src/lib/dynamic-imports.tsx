/**
 * Dynamic import utilities for Next.js 15 with enhanced code splitting
 * Optimizes bundle size and loading performance
 */

import React from "react";
import dynamic from "next/dynamic";
import { ComponentType, ReactNode } from "react";

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

export const SectionSkeleton = () => (
  <div className="py-20 bg-gray-50 dark:bg-gray-900 animate-pulse">
    <div className="container mx-auto px-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-8"></div>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm animate-pulse">
    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
  </div>
);

export const FormSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mt-6"></div>
  </div>
);

// ============================================================================
// DYNAMIC IMPORT FACTORY
// ============================================================================

interface DynamicImportOptions {
  loading?: ComponentType;
  ssr?: boolean;
  suspense?: boolean;
}

/**
 * Creates a dynamically imported component with optimized loading
 */
export function createDynamicComponent<T = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: DynamicImportOptions = {}
) {
  const { loading = SectionSkeleton, ssr = false, suspense = true } = options;

  return dynamic(importFn, {
    loading: () => <>{loading && React.createElement(loading)}</>,
    ssr,
    suspense,
  });
}

// ============================================================================
// AYURVEDA COMPONENTS - LAZY LOADED
// ============================================================================

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
  { ssr: false }
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
  { ssr: false }
);

export const TrustBuilding = createDynamicComponent(
  () => import("@/components/ayurveda/TrustBuilding"),
  { ssr: false }
);

export const ComprehensiveCTA = createDynamicComponent(
  () => import("@/components/ayurveda/ComprehensiveCTA"),
  { ssr: false }
);

// ============================================================================
// TREATMENT PAGE COMPONENTS (Optional - only if they exist)
// ============================================================================

// Note: These components are optional and will be created as needed
// Commenting out until components are created to avoid build errors

// export const PanchakarmaDetails = createDynamicComponent(
//   () => import("@/components/ayurveda/treatments/PanchakarmaDetails"),
//   { ssr: true } // SEO important for treatment pages
// );

// export const AgnikarmaDetails = createDynamicComponent(
//   () => import("@/components/ayurveda/treatments/AgnikarmaDetails"),
//   { ssr: true }
// );

// export const ViddhaKarmaDetails = createDynamicComponent(
//   () => import("@/components/ayurveda/treatments/ViddhaKarmaDetails"),
//   { ssr: true }
// );

// ============================================================================
// INTERACTIVE COMPONENTS (Optional - only if they exist)
// ============================================================================

// Note: These components are optional and will be created as needed
// Commenting out until components are created to avoid build errors

// export const BookingForm = createDynamicComponent(
//   () => import('@/components/ayurveda/BookingForm'),
//   {
//     ssr: false,
//     loading: FormSkeleton,
//   }
// );

// export const ContactForm = createDynamicComponent(
//   () => import('@/components/ayurveda/ContactForm'),
//   {
//     ssr: false,
//     loading: FormSkeleton,
//   }
// );

// export const NewsletterSignup = createDynamicComponent(
//   () => import('@/components/ayurveda/NewsletterSignup'),
//   { ssr: false }
// );

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Preload a component for better UX
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<Record<string, unknown>> }>
) {
  if (typeof window !== "undefined") {
    // Preload on user interaction or after initial load
    const preload = () => {
      importFn().catch(console.error);
    };

    // Preload on hover, focus, or after a delay
    document.addEventListener("mouseover", preload, { once: true });
    document.addEventListener("touchstart", preload, { once: true });
    setTimeout(preload, 2000); // Fallback after 2 seconds
  }
}

/**
 * Batch preload multiple components
 */
export function preloadComponents(
  importFns: Array<
    () => Promise<{ default: ComponentType<Record<string, unknown>> }>
  >
) {
  importFns.forEach(preloadComponent);
}

// ============================================================================
// ROUTE-BASED CODE SPLITTING
// ============================================================================

/**
 * Preload components based on current route
 */
export function preloadRouteComponents(pathname: string) {
  switch (pathname) {
    case "/ayurveda":
      preloadComponents([
        () => import("@/components/ayurveda/TreatmentOverview"),
        () => import("@/components/ayurveda/HealthAssessment"),
        () => import("@/components/ayurveda/TestimonialsSection"),
      ]);
      break;
    case "/ayurveda/treatments":
      preloadComponents([
        () => import("@/components/ayurveda/TreatmentOverview"),
        () => import("@/components/ayurveda/TrustBuilding"),
      ]);
      break;
    case "/ayurveda/contact":
      // Contact form will be created later
      break;
  }
}
