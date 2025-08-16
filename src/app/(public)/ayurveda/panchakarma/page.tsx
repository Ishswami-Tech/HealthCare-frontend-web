"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Droplets,
  CheckCircle,
  Clock,
  Star,
  Heart,
  Leaf,
  Shield,
  Target,
  Users,
  Award,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function PanchakarmaPage() {
  const { t } = useTranslation();

  const phases = [
    {
      name: t("panchakarma.phases.purvaKarma.name"),
      subtitle: t("panchakarma.phases.purvaKarma.subtitle"),
      duration: t("panchakarma.phases.purvaKarma.duration"),
      color: "from-blue-500 to-cyan-600",
      activities: [
        "Internal oleation (Snehana)",
        "External oleation (Abhyanga)",
        "Steam therapy (Swedana)",
        "Diet modifications",
      ],
    },
    {
      name: t("panchakarma.phases.pradhanaKarma.name"),
      subtitle: t("panchakarma.phases.pradhanaKarma.subtitle"),
      duration: t("panchakarma.phases.pradhanaKarma.duration"),
      color: "from-orange-500 to-red-600",
      activities: [
        "Vamana (Therapeutic vomiting)",
        "Virechana (Purgation)",
        "Basti (Medicated enema)",
        "Nasya (Nasal administration)",
      ],
    },
    {
      name: t("panchakarma.phases.paschatKarma.name"),
      subtitle: t("panchakarma.phases.paschatKarma.subtitle"),
      duration: t("panchakarma.phases.paschatKarma.duration"),
      color: "from-green-500 to-emerald-600",
      activities: [
        "Gradual diet reintroduction",
        "Lifestyle counseling",
        "Herbal supplements",
        "Follow-up care",
      ],
    },
  ];

  const conditions = [
    {
      category: t("panchakarma.conditions.chronicDiseases.category"),
      items: ["Diabetes", "Hypertension", "Arthritis", "Autoimmune disorders"],
      successRate: 92,
    },
    {
      category: t("panchakarma.conditions.digestiveDisorders.category"),
      items: ["IBS", "Chronic constipation", "Liver diseases", "Acidity"],
      successRate: 95,
    },
    {
      category: t("panchakarma.conditions.skinConditions.category"),
      items: ["Eczema", "Psoriasis", "Chronic allergies", "Dermatitis"],
      successRate: 88,
    },
    {
      category: t("panchakarma.conditions.mentalHealth.category"),
      items: ["Stress", "Anxiety", "Depression", "Insomnia"],
      successRate: 90,
    },
    {
      category: t("panchakarma.conditions.respiratoryIssues.category"),
      items: ["Asthma", "Bronchitis", "Chronic cough", "Allergies"],
      successRate: 87,
    },
    {
      category: t("panchakarma.conditions.hormonalImbalances.category"),
      items: ["PCOD", "Thyroid disorders", "Fertility issues"],
      successRate: 89,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4 sm:mb-6">
              <Droplets className="w-4 h-4 mr-2" />
              {t("panchakarma.badge")}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4 sm:mb-6">
              {t("panchakarma.title")}
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8 leading-relaxed px-4">
              {t("panchakarma.subtitle")}
            </p>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                95% {t("common.success")}{" "}
                {t("agnikarma.comparison.successRate")}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs sm:text-sm">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                2000+ {t("common.patients")} {t("common.treated")}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs sm:text-sm">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {t("common.scientificallyValidated")}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-base sm:text-lg px-6 sm:px-8"
              >
                {t("panchakarma.cta.bookProgram")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 text-base sm:text-lg px-6 sm:px-8"
              >
                {t("panchakarma.cta.freeConsultation")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is Panchakarma */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-gray-900 mb-4 sm:mb-6">
                  {t("panchakarma.whatIs.title")}
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                        {t("panchakarma.whatIs.ancientScience.title")}
                      </h3>
                      <p className="text-gray-700 text-sm sm:text-base">
                        {t("panchakarma.whatIs.ancientScience.description")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                        {t("panchakarma.whatIs.fiveProcedures.title")}
                      </h3>
                      <p className="text-gray-700 text-sm sm:text-base">
                        {t("panchakarma.whatIs.fiveProcedures.description")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                        {t("panchakarma.whatIs.holisticApproach.title")}
                      </h3>
                      <p className="text-gray-700 text-sm sm:text-base">
                        {t("panchakarma.whatIs.holisticApproach.description")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                        {t("panchakarma.whatIs.modernApplication.title")}
                      </h3>
                      <p className="text-gray-700 text-sm sm:text-base">
                        {t("panchakarma.whatIs.modernApplication.description")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl">
                  <CardContent className="p-6 sm:p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Droplets className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                        {t("panchakarma.whatIs.completeTransformation")}
                      </h3>
                      <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
                        {t("panchakarma.whatIs.completeTransformationDesc")}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">
                            21
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {t("panchakarma.whatIs.daysProgram")}
                          </div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">
                            95%
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {t("agnikarma.comparison.successRate")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                {t("panchakarma.phases.title")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                {t("panchakarma.phases.subtitle")}
              </p>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {phases.map((phase, index) => (
                <Card
                  key={index}
                  className="bg-white shadow-lg border-0 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                      <div
                        className={`bg-gradient-to-br ${phase.color} text-white p-6 sm:p-8 flex flex-col justify-center`}
                      >
                        <div className="text-center lg:text-left">
                          <div className="text-2xl sm:text-3xl font-bold mb-2">
                            {index + 1}
                          </div>
                          <h3 className="text-xl sm:text-2xl font-playfair font-bold mb-2">
                            {phase.name}
                          </h3>
                          <p className="text-base sm:text-lg opacity-90 mb-3 sm:mb-4">
                            {phase.subtitle}
                          </p>
                          <Badge className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            {phase.duration}
                          </Badge>
                        </div>
                      </div>

                      <div className="lg:col-span-2 p-6 sm:p-8">
                        <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                          {t("panchakarma.phases.keyActivities")}:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {phase.activities.map((activity, actIndex) => (
                            <div
                              key={actIndex}
                              className="flex items-start space-x-2 sm:space-x-3"
                            >
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 text-sm sm:text-base">
                                {activity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Conditions Treated */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                {t("panchakarma.conditions.title")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                {t("panchakarma.conditions.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {conditions.map((condition, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow duration-300 border border-gray-100"
                >
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg text-gray-900 flex items-center justify-between">
                      {condition.category}
                      <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
                        {condition.successRate}% {t("common.success")}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {condition.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                          <span className="text-gray-700 text-sm sm:text-base">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-600 to-cyan-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold mb-4 sm:mb-6">
              {t("panchakarma.cta.title")}
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 px-4">
              {t("panchakarma.cta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50 text-base sm:text-lg px-6 sm:px-8"
              >
                {t("panchakarma.cta.bookProgram")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8"
              >
                {t("panchakarma.cta.freeConsultation")}
              </Button>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-4 sm:gap-6 text-blue-100 text-sm sm:text-base">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>{t("panchakarma.cta.features.successRate")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{t("panchakarma.cta.features.patientsTreated")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>{t("panchakarma.cta.features.governmentCertified")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
