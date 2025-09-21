"use client";

import React from "react";
import { ArrowRight, Play, Star, Users, Award, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface HeroSectionProps {
  className?: string;
  variant?: "default" | "video" | "minimal";
  showStats?: boolean;
  backgroundImage?: string;
}

export function HeroSection({
  className,
  variant = "default",
  showStats = true,
  backgroundImage = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop",
}: HeroSectionProps) {
  const { t } = useTranslation();

  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: "5000+",
      label: t("hero.stats.patientsTreated"),
      color: "text-primary",
    },
    {
      icon: <Award className="w-6 h-6" />,
      value: "15+",
      label: t("hero.stats.yearsExperience"),
      color: "text-primary",
    },
    {
      icon: <Star className="w-6 h-6" />,
      value: "4.9",
      label: t("hero.stats.patientRating"),
      color: "text-primary",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: "24/7",
      label: t("hero.stats.emergencySupport"),
      color: "text-primary",
    },
  ];

  if (variant === "minimal") {
    return (
      <section
        className={cn("py-16 sm:py-20 lg:py-24 bg-background", className)}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-8 sm:mb-10">
              {t("hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground mb-10 sm:mb-12 max-w-3xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-5 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2">
                {t("hero.primaryCta")}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-5 rounded-lg font-semibold text-lg transition-colors">
                {t("hero.secondaryCta")}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "video") {
    return (
      <section
        className={cn("relative min-h-screen flex items-center", className)}
      >
        {/* Background Video/Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 sm:mb-10 leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-xl md:text-2xl mb-6 sm:mb-8 text-primary/80">
              {t("hero.subtitle")}
            </p>
            <p className="text-lg mb-10 sm:mb-12 text-white/80 max-w-2xl mx-auto">
              {t("hero.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 justify-center items-center mb-16 sm:mb-20">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-5 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center gap-2">
                {t("hero.primaryCta")}
                <ArrowRight className="w-5 h-5" />
              </button>

              <button className="flex items-center gap-3 text-white hover:text-primary/80 transition-colors group">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <span className="font-medium">{t("hero.watchDemo")}</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <span>{t("hero.trustIndicators.rating")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{t("hero.trustIndicators.patientsTreated")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>{t("hero.trustIndicators.yearsExperience")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section className={cn("relative overflow-hidden", className)}>
      {/* Background */}
      <div className="absolute inset-0 bg-background" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
          {/* Content */}
          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Award className="w-4 h-4" />
              <span>{t("hero.badge")}</span>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4">
                {t("hero.title")}
              </h1>
              <p className="text-xl md:text-2xl text-primary font-semibold mb-6">
                {t("hero.subtitle")}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("hero.description")}
              </p>
            </div>

            {/* Doctor Info */}
            <div className="bg-card rounded-lg p-6 shadow-md border border-border">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                  डॉ
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {t("doctor.name")}
                  </h3>
                  <p className="text-primary font-medium">
                    {t("doctor.specialization")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("doctor.experience")} • {t("doctor.education")}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-5 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg">
                {t("hero.primaryCta")}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-5 rounded-lg font-semibold text-lg transition-colors">
                {t("hero.secondaryCta")}
              </button>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-6 sm:gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {t("hero.schedule")}
                  </p>
                  <p>{t("hero.emergency")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image/Visual */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={backgroundImage}
                alt={t("hero.imageAlt")}
                className="w-full h-96 lg:h-[500px] object-cover rounded-2xl shadow-2xl"
              />

              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-card rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary fill-current" />
                  <div>
                    <p className="font-bold text-card-foreground">4.9/5</p>
                    <p className="text-xs text-muted-foreground">
                      {t("hero.floatingCards.rating")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-card rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-bold text-card-foreground">5000+</p>
                    <p className="text-xs text-muted-foreground">
                      {t("hero.floatingCards.patientsTreated")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 bg-primary/10 rounded-2xl transform rotate-3 scale-105 -z-10" />
          </div>
        </div>

        {/* Stats Section */}
        {showStats && (
          <div className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div
                  className={cn(
                    "inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md mb-4",
                    stat.color
                  )}
                >
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
