"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Droplets,
  Zap,
  Heart,
  ArrowRight,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";

const TreatmentOverview = () => {
  const { t } = useTranslation();

  const treatments = [
    {
      id: "panchakarma",
      title: t("treatments.panchakarma.title"),
      subtitle: t("treatments.panchakarma.subtitle"),
      icon: Droplets,
      color: "from-blue-500 to-cyan-600",
      bgColor:
        "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      description: t("treatments.panchakarma.description"),
      features: [
        t("treatments.panchakarma.features.0"),
        t("treatments.panchakarma.features.1"),
        t("treatments.panchakarma.features.2"),
        t("treatments.panchakarma.features.3"),
      ],
      conditions: [
        t("treatments.panchakarma.conditions.0"),
        t("treatments.panchakarma.conditions.1"),
        t("treatments.panchakarma.conditions.2"),
        t("treatments.panchakarma.conditions.3"),
      ],
      successRate: t("treatments.panchakarma.successRate"),
      duration: t("treatments.panchakarma.duration"),
      href: "/treatments/panchakarma",
    },
    {
      id: "agnikarma",
      title: t("treatments.agnikarma.title"),
      subtitle: t("treatments.agnikarma.subtitle"),
      icon: Flame,
      color: "from-orange-500 to-red-600",
      bgColor:
        "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
      description: t("treatments.agnikarma.description"),
      features: [
        t("treatments.agnikarma.features.0"),
        t("treatments.agnikarma.features.1"),
        t("treatments.agnikarma.features.2"),
        t("treatments.agnikarma.features.3"),
      ],
      conditions: [
        t("treatments.agnikarma.conditions.0"),
        t("treatments.agnikarma.conditions.1"),
        t("treatments.agnikarma.conditions.2"),
        t("treatments.agnikarma.conditions.3"),
      ],
      successRate: t("treatments.agnikarma.successRate"),
      duration: t("treatments.agnikarma.duration"),
      href: "/treatments/agnikarma",
    },
    {
      id: "viddha-karma",
      title: t("treatments.viddhakarma.title"),
      subtitle: t("treatments.viddhakarma.subtitle"),
      icon: Zap,
      color: "from-purple-500 to-indigo-600",
      bgColor:
        "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
      description: t("treatments.viddhakarma.description"),
      features: [
        t("treatments.viddhakarma.features.0"),
        t("treatments.viddhakarma.features.1"),
        t("treatments.viddhakarma.features.2"),
        t("treatments.viddhakarma.features.3"),
      ],
      conditions: [
        t("treatments.viddhakarma.conditions.0"),
        t("treatments.viddhakarma.conditions.1"),
        t("treatments.viddhakarma.conditions.2"),
        t("treatments.viddhakarma.conditions.3"),
      ],
      successRate: t("treatments.viddhakarma.successRate"),
      duration: t("treatments.viddhakarma.duration"),
      href: "/treatments/viddha-karma",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            <Heart className="w-4 h-4 mr-2" />
            {t("treatments.title")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            {t("treatments.subtitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("treatments.description")}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {treatments.map((treatment) => {
            const IconComponent = treatment.icon;

            return (
              <Card
                key={treatment.id}
                className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-card"
              >
                <CardHeader
                  className={`bg-gradient-to-br ${treatment.bgColor} relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <IconComponent className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${treatment.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-playfair font-bold text-card-foreground mb-2">
                      {treatment.title}
                    </CardTitle>
                    <p className="text-muted-foreground font-medium">
                      {treatment.subtitle}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    {treatment.description}
                  </p>

                  {/* Key Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {t("treatments.labels.keyBenefits")}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {treatment.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conditions Treated */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {t("treatments.labels.treats")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {treatment.conditions
                        .slice(0, 2)
                        .map((condition, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {condition}
                          </Badge>
                        ))}
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-500 dark:text-gray-400"
                      >
                        +{treatment.conditions.length - 2}{" "}
                        {t("treatments.labels.more")}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-lg text-gray-900">
                          {treatment.successRate}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {t("treatments.labels.successRate")}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-lg text-gray-900">
                          {treatment.duration}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {t("treatments.labels.duration")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link href={treatment.href}>
                      <Button
                        className={`w-full bg-gradient-to-r ${treatment.color} hover:opacity-90 text-white group-hover:shadow-lg transition-all duration-300`}
                      >
                        {t("treatments.labels.learnMore")}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {t("treatments.labels.bookConsultation")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-playfair font-bold mb-4">
              {t("treatments.cta.title")}
            </h3>
            <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
              {t("treatments.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-orange-600 hover:bg-orange-50"
              >
                {t("treatments.cta.assessmentButton")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                {t("treatments.cta.expertButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TreatmentOverview;
