import { generateMetadata as generateSEOMetadata, pageSEO } from "@/lib/config/seo";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { LazySection } from "@/components/ui/lazy-section";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import HomeHero from "@/components/home/HomeHero";
import HomeStats from "@/components/home/HomeStats";
import HomeWhyChooseUs from "@/components/home/HomeWhyChooseUs";
import HomeMobileCtaBar from "@/components/home/HomeMobileCtaBar";
import { HomeMotionProvider } from "@/components/home/home-motion";
import { HEALTH_ASSESSMENT_SECTION_ID } from "@/components/home/home-links";
import {
  HomeCarePaths,
  HomeCertifications,
  HomeContactChannels,
  HomeFinalCta,
  HomeHealthAssessment,
  HomeSpecializations,
  HomeTestimonials,
  HomeTreatments,
  HomeTrust,
} from "@/lib/dynamic-imports";
import { SectionSkeleton } from "@/lib/dynamic-imports-skeletons";

// Generate SEO metadata using our SEO utility
export const metadata = generateSEOMetadata({
  title: pageSEO.home.title,
  description: pageSEO.home.description,
  keywords: [...pageSEO.home.keywords],
  url: "/",
  image: "/assets/og/og-image.png",
});

export default function AyurvedaHomePage() {
  return (
    <PageTransition>
      <HomeMotionProvider>
        <div className="overflow-x-clip font-body">
          {/* Above-the-fold content renders immediately */}
          <AuthRedirect />
          <HomeHero />
          <HomeStats />
          <HomeWhyChooseUs />

          {/* Below-the-fold sections are code-split and mounted when scrolled into view */}
          <LazySection fallback={<SectionSkeleton />}>
            <HomeSpecializations />
          </LazySection>

          <div id={HEALTH_ASSESSMENT_SECTION_ID} className="scroll-mt-24">
            <LazySection fallback={<SectionSkeleton />}>
              <HomeHealthAssessment />
            </LazySection>
          </div>

          <LazySection fallback={<SectionSkeleton />}>
            <HomeTreatments />
          </LazySection>

          <LazySection fallback={<SectionSkeleton />}>
            <HomeTestimonials />
          </LazySection>

          <LazySection fallback={<SectionSkeleton />}>
            <HomeTrust />
          </LazySection>

          <LazySection fallback={<SectionSkeleton />}>
            <HomeCertifications />
          </LazySection>

          <LazySection fallback={<SectionSkeleton />}>
            <HomeCarePaths />
          </LazySection>

          <LazySection fallback={<SectionSkeleton />}>
            <HomeContactChannels />
          </LazySection>

          <LazySection fallback={<SectionSkeleton />}>
            <HomeFinalCta />
          </LazySection>

          <HomeMobileCtaBar />
        </div>
      </HomeMotionProvider>
    </PageTransition>
  );
}
