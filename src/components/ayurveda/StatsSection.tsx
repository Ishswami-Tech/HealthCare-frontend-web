"use client";

import React from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();

  const stats = [
    {
      icon: Users,
      number: "5000+",
      label: t("stats.livesTransformed"),
      description: t("stats.patientsSuccessfullyTreated"),
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: Clock,
      number: "20+",
      label: t("stats.yearsLegacy"),
      description: t("stats.authenticAyurvedicPractice"),
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Star,
      number: "4.9★",
      label: t("stats.patientRating"),
      description: t("stats.basedOnReviews"),
      color: "from-yellow-500 to-orange-600",
    },
    {
      icon: Award,
      number: "95%",
      label: t("stats.successRate"),
      description: t("stats.chronicConditions"),
      color: "from-purple-500 to-indigo-600",
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
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700 mb-4">
            <TrendingUp className="w-4 h-4 mr-2" />
            Proven Results & Excellence
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
            Transforming Lives Through Authentic Ayurveda
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Two decades of healing excellence with measurable results and
            international recognition
          </p>
        </div>
        {/* Main Stats */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;

            return (
              <StaggerItem key={index}>
                <HoverAnimation type="lift">
                  <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800">
                    <CardContent className="p-6">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
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
                      <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        {stat.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
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
              <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700 mb-4">
                <CheckCircle className="w-4 h-4 mr-2" />
                Trusted & Certified
              </Badge>
            </HoverAnimation>
            <h3 className="text-2xl font-playfair font-bold text-gray-900 dark:text-white mb-8">
              Recognized Excellence in Ayurvedic Healthcare
            </h3>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {certifications.map((cert, index) => {
            const IconComponent = cert.icon;

            return (
              <StaggerItem key={index}>
                <HoverAnimation type="lift">
                  <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-600 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {cert.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>Currently treating 8 patients</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span>400% increase in bookings this month</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Featured on leading health channels</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>147 people viewing treatments today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
