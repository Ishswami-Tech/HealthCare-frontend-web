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
      bgColor: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
    },
    {
      icon: Heart,
      title: t("whyChooseUs.features.authenticAyurveda.title"),
      description: t("whyChooseUs.features.authenticAyurveda.description"),
      color: "from-red-500 to-pink-600",
      bgColor: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
    },
    {
      icon: Users,
      title: t("whyChooseUs.features.personalizedCare.title"),
      description: t("whyChooseUs.features.personalizedCare.description"),
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    },
    {
      icon: Leaf,
      title: t("whyChooseUs.features.naturalTreatment.title"),
      description: t("whyChooseUs.features.naturalTreatment.description"),
      color: "from-orange-500 to-red-600",
      bgColor: "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
    },
    {
      icon: Award,
      title: t("whyChooseUs.features.provenResults.title"),
      description: t("whyChooseUs.features.provenResults.description"),
      color: "from-purple-500 to-indigo-600",
      bgColor: "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
    },
    {
      icon: CheckCircle,
      title: t("whyChooseUs.features.expertTeam.title"),
      description: t("whyChooseUs.features.expertTeam.description"),
      color: "from-teal-500 to-cyan-600",
      bgColor: "from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20",
    },
  ];

  const stats = [
    { number: "5000+", label: t("whyChooseUs.stats.livesTransformed"), icon: Users },
    { number: "20+", label: t("whyChooseUs.stats.yearsLegacy"), icon: Clock },
    { number: "95%", label: t("whyChooseUs.stats.successRate"), icon: Star },
    { number: "4.9/5", label: t("whyChooseUs.stats.patientRating"), icon: Star },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900/10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal direction="up" className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-4"
          >
            <Award className="w-4 h-4" />
            {t("whyChooseUs.title")}
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t("whyChooseUs.title")}
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t("whyChooseUs.description")}
          </p>
        </ScrollReveal>

        {/* Stats Row */}
        <ScrollReveal direction="up" delay={0.2} className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <HoverAnimation type="scale">
                  <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
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
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          staggerDelay={0.1}
        >
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <HoverAnimation type="glow">
                <div className={`p-8 rounded-2xl ${feature.bgColor} border-2 h-full group cursor-pointer`}>
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-4 flex items-center text-orange-600 dark:text-orange-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("whyChooseUs.verifiedExcellence")}
                  </div>
                </div>
              </HoverAnimation>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom CTA */}
        <ScrollReveal direction="up" delay={0.4} className="text-center mt-16">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              {t("whyChooseUs.cta.title")}
            </h3>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              {t("whyChooseUs.cta.description")}
            </p>
            <button className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg">
              {t("whyChooseUs.cta.button")}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
