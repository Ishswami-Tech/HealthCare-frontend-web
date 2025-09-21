"use client";

import React from "react";
import {
  Shield,
  Heart,
  Users,
  Leaf,
  Clock,
  Star,
  CheckCircle,
  Award,
} from "lucide-react";
import {
  ScrollReveal,
  HoverAnimation,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animated-wrapper";
import { useTranslation } from "@/lib/i18n/context";

const WhyChooseUsSection = () => {
  const { t } = useTranslation();
  const features = [
    {
      icon: Shield,
      title: t("whyChooseUs.features.governmentCertified.title"),
      description: t("whyChooseUs.features.governmentCertified.description"),
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: Heart,
      title: t("whyChooseUs.features.authenticAyurveda.title"),
      description: t("whyChooseUs.features.authenticAyurveda.description"),
      color: "from-red-500 to-pink-600",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: Users,
      title: t("whyChooseUs.features.personalizedCare.title"),
      description: t("whyChooseUs.features.personalizedCare.description"),
      color: "from-green-500 to-emerald-600",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: Leaf,
      title: t("whyChooseUs.features.naturalTreatment.title"),
      description: t("whyChooseUs.features.naturalTreatment.description"),
      color: "from-orange-500 to-red-600",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: Award,
      title: t("whyChooseUs.features.provenResults.title"),
      description: t("whyChooseUs.features.provenResults.description"),
      color: "from-purple-500 to-indigo-600",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: CheckCircle,
      title: t("whyChooseUs.features.expertTeam.title"),
      description: t("whyChooseUs.features.expertTeam.description"),
      color: "from-teal-500 to-cyan-600",
      bgColor: "from-primary/5 to-primary/10",
    },
  ];

  const stats = [
    {
      number: "5000+",
      label: t("whyChooseUs.stats.livesTransformed"),
      icon: Users,
    },
    { number: "20+", label: t("whyChooseUs.stats.yearsLegacy"), icon: Clock },
    { number: "95%", label: t("whyChooseUs.stats.successRate"), icon: Star },
    {
      number: "4.9/5",
      label: t("whyChooseUs.stats.patientRating"),
      icon: Star,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal direction="up" className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Award className="w-4 h-4" />
            {t("whyChooseUs.title")}
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t("whyChooseUs.title")}
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("whyChooseUs.description")}
          </p>
        </ScrollReveal>

        {/* Stats Row */}
        <ScrollReveal direction="up" delay={0.2} className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <HoverAnimation type="scale">
                  <div className="text-center p-6 bg-card rounded-2xl shadow-lg border border-border glass card-hover">
                    <div className={`w-12 h-12 bg-gradient-to-r ${
                      index === 0 ? 'from-sky-500 to-blue-700' :
                      index === 1 ? 'from-lime-500 to-green-800' :
                      index === 2 ? 'from-fuchsia-500 to-purple-800' :
                      'from-zinc-500 to-stone-700'
                    } rounded-full flex items-center justify-center mx-auto mb-3 interactive`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1 gradient-text">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </div>
                </HoverAnimation>
              </StaggerItem>
            ))}
          </div>
        </ScrollReveal>

        {/* Features Grid */}
        <StaggerContainer
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          staggerDelay={0.1}
        >
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <HoverAnimation type="glow">
                <div
                  className={`p-6 rounded-2xl ${feature.bgColor} border-2 min-h-[280px] flex flex-col group cursor-pointer transition-all duration-300 hover:shadow-xl glass card-hover`}
                >
                  <div
                    className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0 interactive`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed text-sm flex-grow line-clamp-4">
                    {feature.description}
                  </p>

                  <div className="mt-4 flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {t("whyChooseUs.verifiedExcellence")}
                    </span>
                  </div>
                </div>
              </HoverAnimation>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom CTA */}
        <ScrollReveal direction="up" delay={0.4} className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 text-primary-foreground">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              {t("whyChooseUs.cta.title")}
            </h3>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              {t("whyChooseUs.cta.description")}
            </p>
            <button className="bg-background text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-muted transition-colors duration-300 shadow-lg interactive">
              {t("whyChooseUs.cta.button")}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
