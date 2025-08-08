"use client";

import React from "react";
import HeroSection from "@/components/ayurveda/HeroSection";
import TreatmentOverview from "@/components/ayurveda/TreatmentOverview";
import HealthAssessment from "@/components/ayurveda/HealthAssessment";
import TestimonialsSection from "@/components/ayurveda/TestimonialsSection";
import StatsSection from "@/components/ayurveda/StatsSection";
import TrustBuilding from "@/components/ayurveda/TrustBuilding";
import TechnologyIntegration from "@/components/ayurveda/TechnologyIntegration";
import ComprehensiveCTA from "@/components/ayurveda/ComprehensiveCTA";

export default function AyurvedaHomePage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <StatsSection />
      <HealthAssessment />
      <TreatmentOverview />
      <TestimonialsSection />
      <TrustBuilding />
      <TechnologyIntegration />
      <ComprehensiveCTA />
    </div>
  );
}
