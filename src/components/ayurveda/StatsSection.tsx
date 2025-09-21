"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  HoverAnimation,
  CounterAnimation,
} from "@/components/ui/animated-wrapper";
import {
  Users,
  Award,
  Star,
  Clock,
  Heart,
  CheckCircle,
  TrendingUp,
  Shield,
} from "lucide-react";

const StatsSection = () => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Users,
      number: "5000+",
      label: t("stats.livesTransformed"),
      description: t("stats.patientsSuccessfullyTreated"),
      color: "from-blue-600 to-indigo-700",
    },
    {
      icon: Clock,
      number: "20+",
      label: t("stats.yearsLegacy"),
      description: t("stats.authenticAyurvedicPractice"),
      color: "from-emerald-500 to-green-700",
    },
    {
      icon: Star,
      number: "4.9★",
      label: t("stats.patientRating"),
      description: t("stats.basedOnReviews"),
      color: "from-amber-400 to-yellow-600",
    },
    {
      icon: Award,
      number: "95%",
      label: t("stats.successRate"),
      description: t("stats.chronicConditions"),
      color: "from-purple-600 to-violet-800",
    },
  ];

  const certifications = [
    {
      icon: Shield,
      title: t("stats.certifications.governmentCertified.title"),
      description: t("stats.certifications.governmentCertified.description"),
    },
    {
      icon: Award,
      title: t("stats.certifications.iso9001.title"),
      description: t("stats.certifications.iso9001.description"),
    },
    {
      icon: CheckCircle,
      title: t("stats.certifications.nabhAccredited.title"),
      description: t("stats.certifications.nabhAccredited.description"),
    },
    {
      icon: TrendingUp,
      title: t("stats.certifications.teachingHospital.title"),
      description: t("stats.certifications.teachingHospital.description"),
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 glass animate-fade-in-down">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t("stats.provenResultsExcellence")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4 gradient-text">
            {t("stats.transformingLives")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("stats.twoDecadesExcellence")}
          </p>
        </div>
        {/* Main Stats */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;

            return (
              <StaggerItem key={index}>
                <HoverAnimation type="lift">
                  <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-card glass card-hover">
                    <CardContent className="p-6">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4 interactive`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-foreground mb-2 gradient-text">
                        {stat.number.includes("+") ? (
                          <>
                            <CounterAnimation
                              from={0}
                              to={parseInt(stat.number.replace(/[^\d]/g, ""))}
                              suffix="+"
                            />
                          </>
                        ) : stat.number.includes("★") ? (
                          <>
                            <CounterAnimation
                              from={0}
                              to={parseFloat(stat.number.replace("★", ""))}
                              suffix="★"
                            />
                          </>
                        ) : (
                          stat.number
                        )}
                      </div>
                      <div className="font-semibold text-foreground mb-1">
                        {stat.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.description}
                      </div>
                    </CardContent>
                  </Card>
                </HoverAnimation>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Certifications */}
        <ScrollReveal direction="up">
          <div className="text-center mb-12">
            <HoverAnimation type="scale">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 glass interactive">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("stats.trustedCertified")}
              </Badge>
            </HoverAnimation>
            <h3 className="text-2xl font-playfair font-bold text-foreground mb-8 gradient-text">
              {t("stats.recognizedExcellence")}
            </h3>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {certifications.map((cert, index) => {
            const IconComponent = cert.icon;

            return (
              <StaggerItem key={index}>
                <HoverAnimation type="lift">
                  <div className="text-center p-6 rounded-lg bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all duration-300 glass card-hover">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${
                        index === 0
                          ? "from-cyan-500 to-teal-700"
                          : index === 1
                          ? "from-rose-500 to-pink-700"
                          : index === 2
                          ? "from-orange-500 to-red-700"
                          : "from-slate-600 to-gray-800"
                      } rounded-full flex items-center justify-center mx-auto mb-4 interactive`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">
                      {cert.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {cert.description}
                    </p>
                  </div>
                </HoverAnimation>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20 glass">
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span>{t("stats.currentlyTreating")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>{t("stats.bookingIncrease")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-primary" />
                <span>{t("stats.featuredChannels")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary" />
                <span>{t("stats.peopleViewing")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
