"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  CheckCircle,
  Star,
  Target,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Heart,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function AgnikarmaPage() {
  const { t } = useTranslation();

  const processSteps = [
    {
      step: 1,
      title: t("agnikarma.processSteps.steps.1.title"),
      description: t("agnikarma.processSteps.steps.1.description"),
      icon: Target,
      color: "from-blue-500 to-cyan-600",
    },
    {
      step: 2,
      title: t("agnikarma.processSteps.steps.2.title"),
      description: t("agnikarma.processSteps.steps.2.description"),
      icon: Flame,
      color: "from-orange-500 to-red-600",
    },
    {
      step: 3,
      title: t("agnikarma.processSteps.steps.3.title"),
      description: t("agnikarma.processSteps.steps.3.description"),
      icon: Zap,
      color: "from-yellow-500 to-orange-600",
    },
    {
      step: 4,
      title: t("agnikarma.processSteps.steps.4.title"),
      description: t("agnikarma.processSteps.steps.4.description"),
      icon: Heart,
      color: "from-green-500 to-emerald-600",
    },
    {
      step: 5,
      title: t("agnikarma.processSteps.steps.5.title"),
      description: t("agnikarma.processSteps.steps.5.description"),
      icon: Shield,
      color: "from-purple-500 to-indigo-600",
    },
  ];

  const conditionsData = [
    {
      condition: t("agnikarma.conditions.chronicKneePain.condition"),
      successRate: 95,
      avgSessions: t("agnikarma.conditions.chronicKneePain.avgSessions"),
      recoveryTime: t("agnikarma.conditions.chronicKneePain.recoveryTime"),
      patientStory: t("agnikarma.conditions.chronicKneePain.patientStory"),
    },
    {
      condition: t("agnikarma.conditions.sciatica.condition"),
      successRate: 92,
      avgSessions: t("agnikarma.conditions.sciatica.avgSessions"),
      recoveryTime: t("agnikarma.conditions.sciatica.recoveryTime"),
      patientStory: t("agnikarma.conditions.sciatica.patientStory"),
    },
    {
      condition: t("agnikarma.conditions.frozenShoulder.condition"),
      successRate: 88,
      avgSessions: t("agnikarma.conditions.frozenShoulder.avgSessions"),
      recoveryTime: t("agnikarma.conditions.frozenShoulder.recoveryTime"),
      patientStory: t("agnikarma.conditions.frozenShoulder.patientStory"),
    },
    {
      condition: t("agnikarma.conditions.tennisElbow.condition"),
      successRate: 94,
      avgSessions: t("agnikarma.conditions.tennisElbow.avgSessions"),
      recoveryTime: t("agnikarma.conditions.tennisElbow.recoveryTime"),
      patientStory: t("agnikarma.conditions.tennisElbow.patientStory"),
    },
    {
      condition: t("agnikarma.conditions.plantarFasciitis.condition"),
      successRate: 90,
      avgSessions: t("agnikarma.conditions.plantarFasciitis.avgSessions"),
      recoveryTime: t("agnikarma.conditions.plantarFasciitis.recoveryTime"),
      patientStory: t("agnikarma.conditions.plantarFasciitis.patientStory"),
    },
    {
      condition: t("agnikarma.conditions.cervicalSpondylosis.condition"),
      successRate: 87,
      avgSessions: t("agnikarma.conditions.cervicalSpondylosis.avgSessions"),
      recoveryTime: t("agnikarma.conditions.cervicalSpondylosis.recoveryTime"),
      patientStory: t("agnikarma.conditions.cervicalSpondylosis.patientStory"),
    },
    {
      condition: t("agnikarma.conditions.arthritis.condition"),
      successRate: 89,
      avgSessions: t("agnikarma.conditions.arthritis.avgSessions"),
      recoveryTime: t("agnikarma.conditions.arthritis.recoveryTime"),
      patientStory: t("agnikarma.conditions.arthritis.patientStory"),
    },
  ];

  const advantages = [
    {
      title: t("agnikarma.advantages.instantResults.title"),
      description: t("agnikarma.advantages.instantResults.description"),
      icon: Zap,
      color: "from-yellow-500 to-orange-600",
    },
    {
      title: t("agnikarma.advantages.precisionTargeting.title"),
      description: t("agnikarma.advantages.precisionTargeting.description"),
      icon: Target,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: t("agnikarma.advantages.zeroSideEffects.title"),
      description: t("agnikarma.advantages.zeroSideEffects.description"),
      icon: Shield,
      color: "from-green-500 to-emerald-600",
    },
    {
      title: t("agnikarma.advantages.costEffective.title"),
      description: t("agnikarma.advantages.costEffective.description"),
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-4 sm:mb-6">
              <Flame className="w-4 h-4 mr-2" />
              {t("agnikarma.badge")}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4 sm:mb-6">
              {t("agnikarma.title")}
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8 leading-relaxed px-4">
              {t("agnikarma.subtitle")}
            </p>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                92% {t("common.success")}{" "}
                {t("agnikarma.comparison.successRate")}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs sm:text-sm">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {t("agnikarma.advantages.instantResults.title")}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs sm:text-sm">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {t("agnikarma.advantages.zeroSideEffects.title")}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-base sm:text-lg px-6 sm:px-8"
              >
                {t("agnikarma.cta.bookSession")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 text-base sm:text-lg px-6 sm:px-8"
              >
                {t("agnikarma.cta.freeAssessment")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Foundation */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                {t("agnikarma.scientificFoundation.title")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                {t("agnikarma.scientificFoundation.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                    {t("agnikarma.scientificFoundation.ancientText.title")}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t(
                      "agnikarma.scientificFoundation.ancientText.description"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                    {t("agnikarma.scientificFoundation.modernValidation.title")}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t(
                      "agnikarma.scientificFoundation.modernValidation.description"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                    {t(
                      "agnikarma.scientificFoundation.precisionTechnology.title"
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t(
                      "agnikarma.scientificFoundation.precisionTechnology.description"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                    {t("agnikarma.scientificFoundation.zeroSideEffects.title")}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t(
                      "agnikarma.scientificFoundation.zeroSideEffects.description"
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                {t("agnikarma.processSteps.title")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                {t("agnikarma.processSteps.subtitle")}
              </p>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {processSteps.map((step, index) => {
                const IconComponent = step.icon;

                return (
                  <Card
                    key={index}
                    className="bg-white shadow-lg border-0 overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-4">
                        <div
                          className={`bg-gradient-to-br ${step.color} text-white p-6 sm:p-8 flex flex-col justify-center`}
                        >
                          <div className="text-center lg:text-left">
                            <div className="text-3xl sm:text-4xl font-bold mb-2">
                              {step.step}
                            </div>
                            <IconComponent className="w-8 h-8 sm:w-12 sm:h-12 mx-auto lg:mx-0 mb-3 sm:mb-4" />
                          </div>
                        </div>

                        <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-center">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                            {step.title}
                          </h3>
                          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Conditions & Success Rates */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                {t("agnikarma.conditions.title")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                {t("agnikarma.conditions.subtitle")}
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid gap-3 sm:gap-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold text-xs sm:text-sm">
                    <div>{t("agnikarma.comparison.condition")}</div>
                    <div className="text-center">
                      {t("agnikarma.comparison.successRate")}
                    </div>
                    <div className="text-center">
                      {t("agnikarma.comparison.avgSessions")}
                    </div>
                    <div className="text-center">
                      {t("agnikarma.comparison.recoveryTime")}
                    </div>
                    <div className="text-center">
                      {t("agnikarma.comparison.patientStory")}
                    </div>
                  </div>

                  {/* Table Rows */}
                  {conditionsData.map((item, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow duration-300"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="grid grid-cols-5 gap-3 sm:gap-4 items-center text-xs sm:text-sm">
                          <div className="font-semibold text-gray-900">
                            {item.condition}
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                              <Progress
                                value={Number(item.successRate)}
                                className="w-12 h-2 sm:w-16 sm:h-2"
                              />
                              <span className="font-bold text-green-600">
                                {item.successRate}%
                              </span>
                            </div>
                          </div>
                          <div className="text-center text-gray-700">
                            {item.avgSessions}
                          </div>
                          <div className="text-center text-gray-700">
                            {item.recoveryTime}
                          </div>
                          <div className="text-center">
                            <Button
                              variant="link"
                              className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs sm:text-sm"
                            >
                              {item.patientStory}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Agnikarma is Superior */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                {t("agnikarma.advantages.title")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                {t("agnikarma.advantages.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {advantages.map((advantage, index) => {
                const IconComponent = advantage.icon;

                return (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white"
                  >
                    <CardContent className="p-6 sm:p-8">
                      <div
                        className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${advantage.color} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6`}
                      >
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                        {advantage.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {advantage.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Comparison Table */}
            <div className="mt-12 sm:mt-16">
              <Card className="bg-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl font-playfair font-bold text-center text-gray-900">
                    {t("agnikarma.comparison.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 sm:py-4 px-3 sm:px-4 font-semibold text-gray-900">
                            {t("agnikarma.comparison.treatmentMethod")}
                          </th>
                          <th className="text-center py-3 sm:py-4 px-3 sm:px-4 font-semibold text-gray-900">
                            {t("agnikarma.comparison.duration")}
                          </th>
                          <th className="text-center py-3 sm:py-4 px-3 sm:px-4 font-semibold text-gray-900">
                            {t("agnikarma.comparison.successRate")}
                          </th>
                          <th className="text-center py-3 sm:py-4 px-3 sm:px-4 font-semibold text-gray-900">
                            {t("agnikarma.comparison.sideEffects")}
                          </th>
                          <th className="text-center py-3 sm:py-4 px-3 sm:px-4 font-semibold text-gray-900">
                            {t("agnikarma.comparison.cost")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100 bg-orange-50">
                          <td className="py-3 sm:py-4 px-3 sm:px-4 font-semibold text-orange-600">
                            {t("agnikarma.comparison.agnikarma")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-green-600 font-semibold">
                            3-5 {t("agnikarma.comparison.sessions")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-green-600 font-semibold">
                            92%
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-green-600 font-semibold">
                            {t("agnikarma.advantages.zeroSideEffects.title")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-green-600 font-semibold">
                            {t("agnikarma.advantages.costEffective.title")}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 sm:py-4 px-3 sm:px-4">
                            {t("agnikarma.comparison.surgery")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-gray-600">
                            6-12 {t("agnikarma.comparison.months")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-gray-600">
                            70%
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-red-600">
                            {t("agnikarma.comparison.highRisk")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-red-600">
                            {t("agnikarma.comparison.veryHigh")}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 sm:py-4 px-3 sm:px-4">
                            {t("agnikarma.comparison.medications")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-gray-600">
                            {t("agnikarma.comparison.ongoing")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-gray-600">
                            60%
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-red-600">
                            {t("agnikarma.comparison.multiple")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-red-600">
                            {t("agnikarma.comparison.highOngoing")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 sm:py-4 px-3 sm:px-4">
                            {t("agnikarma.comparison.physiotherapy")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-gray-600">
                            6-18 {t("agnikarma.comparison.months")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-gray-600">
                            50%
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-yellow-600">
                            {t("agnikarma.comparison.minimal")}
                          </td>
                          <td className="text-center py-3 sm:py-4 px-3 sm:px-4 text-yellow-600">
                            {t("agnikarma.comparison.moderate")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-orange-600 to-red-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold mb-4 sm:mb-6">
              {t("agnikarma.cta.title")}
            </h2>
            <p className="text-lg sm:text-xl text-orange-100 mb-6 sm:mb-8 px-4">
              {t("agnikarma.cta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-orange-600 hover:bg-orange-50 text-base sm:text-lg px-6 sm:px-8"
              >
                {t("agnikarma.cta.bookSession")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8"
              >
                {t("agnikarma.cta.freeAssessment")}
              </Button>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-4 sm:gap-6 text-orange-100 text-sm sm:text-base">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>{t("agnikarma.cta.features.instantRelief")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>{t("agnikarma.cta.features.zeroSideEffects")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>{t("agnikarma.cta.features.successRate")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
