import React, { Suspense } from "react";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { pageSEO } from "@/lib/seo";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { LazySection } from "@/components/ui/lazy-section";
import {
  HeroSection,
  StatsSection,
  TreatmentOverview,
  HealthAssessment,
  TestimonialsSection,
  TrustBuilding,
  ComprehensiveCTA,
  SectionSkeleton,
} from "@/lib/dynamic-imports";
import WhyChooseUsSection from "@/components/ayurveda/WhyChooseUsSection";
import SpecializationsSection from "@/components/ayurveda/SpecializationsSection";
import { LanguageProvider } from "@/lib/i18n/context";

// Generate SEO metadata using our SEO utility
export const metadata = generateSEOMetadata({
  title: pageSEO.home.title,
  description: pageSEO.home.description,
  keywords: pageSEO.home.keywords,
  url: "/ayurveda",
  image: "/images/ayurveda-hero.jpg",
});

// Preload components for better UX
if (typeof window !== "undefined") {
  // Preload non-critical components after initial load
  setTimeout(() => {
    import("@/components/ayurveda/TreatmentOverview");
    import("@/components/ayurveda/HealthAssessment");
  }, 1000);
}

export default function AyurvedaHomePage() {
  return (
    <PageTransition>
      <div className="overflow-hidden">
        {/* Critical above-the-fold content - load immediately */}
        <HeroSection />
        <StatsSection />

        {/* Why Choose Us Section - load immediately after hero */}
        <WhyChooseUsSection />

        {/* Quick Overview Section */}
        <LazySection fallback={<SectionSkeleton />}>
          <SpecializationsSection />
        </LazySection>

        {/* Non-critical content - lazy load with intersection observer */}
        <LazySection fallback={<SectionSkeleton />}>
          <Suspense fallback={<SectionSkeleton />}>
            <HealthAssessment />
          </Suspense>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <Suspense fallback={<SectionSkeleton />}>
            <TreatmentOverview />
          </Suspense>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <Suspense fallback={<SectionSkeleton />}>
            <TestimonialsSection />
          </Suspense>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <Suspense fallback={<SectionSkeleton />}>
            <TrustBuilding />
          </Suspense>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <Suspense fallback={<SectionSkeleton />}>
            <ComprehensiveCTA />
          </Suspense>
        </LazySection>
      </div>
    </PageTransition>
  );
}
