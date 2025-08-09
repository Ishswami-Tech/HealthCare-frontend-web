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
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Our Specializations
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Experience authentic Ayurvedic healing with our specialized
                  treatments
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    Panchakarma
                  </h3>
                  <p className="text-gray-600">
                    Complete detoxification and rejuvenation therapy
                  </p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-800 mb-2">
                    Viddhakarma
                  </h3>
                  <p className="text-gray-600">
                    Specialized treatment for neurological conditions
                  </p>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-lg">
                  <h3 className="text-xl font-semibold text-orange-800 mb-2">
                    Agnikarma
                  </h3>
                  <p className="text-gray-600">
                    Therapeutic heat treatment for joint disorders
                  </p>
                </div>
              </div>
            </div>
          </section>
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
