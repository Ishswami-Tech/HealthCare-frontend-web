"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Users,
  Heart,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Leaf,
  Brain,
  Target,
} from "lucide-react";
import { LanguageProvider } from "@/lib/i18n/context";
import { ClinicInfo } from "@/components/clinic/clinic-info";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function AboutPage() {
  const t = useTranslations();

  const milestones = [
    {
      year: "2003",
      event: t("about.milestones.2003.event"),
      description: t("about.milestones.2003.description"),
    },
    {
      year: "2008",
      event: t("about.milestones.2008.event"),
      description: t("about.milestones.2008.description"),
    },
    {
      year: "2012",
      event: t("about.milestones.2012.event"),
      description: t("about.milestones.2012.description"),
    },
    {
      year: "2015",
      event: t("about.milestones.2015.event"),
      description: t("about.milestones.2015.description"),
    },
    {
      year: "2018",
      event: t("about.milestones.2018.event"),
      description: t("about.milestones.2018.description"),
    },
    {
      year: "2020",
      event: t("about.milestones.2020.event"),
      description: t("about.milestones.2020.description"),
    },
    {
      year: "2023",
      event: t("about.milestones.2023.event"),
      description: t("about.milestones.2023.description"),
    },
  ];

  const values = [
    {
      icon: Heart,
      title: t("about.coreValues.compassionateCare.title"),
      description: t("about.coreValues.compassionateCare.description"),
      color: "from-red-500 to-pink-600",
    },
    {
      icon: Leaf,
      title: t("about.coreValues.authenticAyurveda.title"),
      description: t("about.coreValues.authenticAyurveda.description"),
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Brain,
      title: t("about.coreValues.scientificApproach.title"),
      description: t("about.coreValues.scientificApproach.description"),
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Target,
      title: t("about.coreValues.holisticHealing.title"),
      description: t("about.coreValues.holisticHealing.description"),
      color: "from-purple-500 to-violet-600",
    },
  ];

  const achievements = [
    { number: "5000+", label: "Lives Transformed", icon: Users },
    { number: "20+", label: "Years of Excellence", icon: Clock },
    { number: "95%", label: "Success Rate", icon: Star },
    { number: "4.9★", label: "Patient Rating", icon: Award },
  ];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800 mb-6">
              <Heart className="w-4 h-4 mr-2" />
              About Shri Vishwamurthi Ayurvedalay
            </Badge>

            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 dark:text-white mb-6">
              20+ Years of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400">
                Authentic Healing
              </span>
            </h1>

            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
              Where ancient Ayurvedic wisdom meets modern healthcare excellence.
              Our journey of transformation, one life at a time.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                Government Certified
              </Badge>
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                <Shield className="w-4 h-4 mr-2" />
                ISO 9001:2015
              </Badge>
              <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800">
                <Award className="w-4 h-4 mr-2" />
                Teaching Hospital
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <div className="space-y-6 text-gray-700 leading-relaxed">
                  <p>
                    Founded in 2003 with a sacred mission to preserve and
                    practice authentic Ayurveda, Shri Vishwamurthi Ayurvedalay
                    has been a beacon of hope for thousands seeking natural
                    healing and complete wellness.
                  </p>
                  <p>
                    Our founder, Dr. Vishwamurthi, envisioned a place where the
                    timeless wisdom of Ayurveda could be practiced in its purest
                    form while embracing the benefits of modern healthcare
                    infrastructure and scientific validation.
                  </p>
                  <p>
                    Over two decades, we have grown from a small clinic to a
                    renowned Ayurvedic hospital, treating complex chronic
                    conditions that conventional medicine often struggles to
                    address. Our success lies in treating the root cause, not
                    just symptoms.
                  </p>
                  <p>
                    Today, we stand proud as a government-certified,
                    ISO-accredited institution that has transformed over 5000
                    lives through authentic Panchakarma, Agnikarma, Viddha
                    Karma, and comprehensive Ayurvedic treatments.
                  </p>
                </div>
              </div>

              <div className="relative">
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-xl">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🕉️</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Our Mission
                      </h3>
                      <p className="text-gray-700 mb-6">
                        To make authentic Ayurvedic healing accessible to
                        everyone, combining ancient wisdom with modern
                        excellence for complete wellness transformation.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        {achievements.map((achievement, index) => {
                          const IconComponent = achievement.icon;
                          return (
                            <div key={index} className="text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <IconComponent className="w-4 h-4 text-orange-600" />
                                <span className="font-bold text-lg text-orange-600">
                                  {achievement.number}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600">
                                {achievement.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Our Core Values
              </h2>
              <p className="text-lg text-gray-600">
                The principles that guide every aspect of our healing practice
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon;

                return (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-shadow duration-300 border-0 bg-white"
                  >
                    <CardContent className="p-8">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-full flex items-center justify-center mx-auto mb-6`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Our Journey of Excellence
              </h2>
              <p className="text-lg text-gray-600">
                Two decades of milestones in authentic Ayurvedic healthcare
              </p>
            </div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {milestone.year}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {milestone.event}
                        </h3>
                        <p className="text-gray-700">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              Be Part of Our Healing Legacy
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Join thousands who have experienced authentic Ayurvedic
              transformation. Your journey to complete wellness begins with a
              single step.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8"
              >
                Book Consultation
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                Take Health Assessment
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-orange-100">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Government Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>ISO 9001:2015</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Teaching Hospital</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Information Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <ClinicInfo
            variant="full"
            showDoctor={true}
            showTimings={true}
            showContact={true}
          />
        </div>
      </section>
    </div>
  );
}
