"use client";

import { Layout } from "../Layout";
import { TreatmentShowcase } from "./TreatmentShowcase";
import { HealthAssessment } from "./HealthAssessment";
import { TeamShowcase } from "./TeamShowcase";
import { FacilitiesSection } from "./FacilitiesSection";
import { ResearchSection } from "./ResearchSection";
import { TestimonialSection } from "./TestimonialSection";
import { ContactSection } from "./ContactSection";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

export const WebsitePage = () => {
  return (
    <Layout>
      <section id="home"></section>

      <section id="treatments">
        <TreatmentShowcase />
      </section>

      <section id="assessment">
        <HealthAssessment />
      </section>

      <section id="team">
        <TeamShowcase />
      </section>

      <section id="facilities">
        <FacilitiesSection />
      </section>

      <section id="research">
        <ResearchSection />
      </section>

      <section id="testimonials">
        <TestimonialSection />
      </section>

      <section id="contact">
        <ContactSection />
      </section>

      <FloatingWhatsApp />
    </Layout>
  );
};
