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
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { getIconColorScheme } from "@/lib/color-palette";

export default function PanchakarmaPage() {
  const { t, tArray } = useTranslation();

  const phases = [
    {
      name: t("panchakarma.phases.purvaKarma.name"),
      subtitle: t("panchakarma.phases.purvaKarma.subtitle"),
      duration: t("panchakarma.phases.purvaKarma.duration"),
      colorScheme: getIconColorScheme("Droplets"),
      activities: tArray("panchakarma.phases.purvaKarma.activities"),
    },
    {
      name: t("panchakarma.phases.pradhanaKarma.name"),
      subtitle: t("panchakarma.phases.pradhanaKarma.subtitle"),
      duration: t("panchakarma.phases.pradhanaKarma.duration"),
      colorScheme: getIconColorScheme("Flame"),
      activities: tArray("panchakarma.phases.pradhanaKarma.activities"),
    },
    {
      name: t("panchakarma.phases.paschatKarma.name"),
      subtitle: t("panchakarma.phases.paschatKarma.subtitle"),
      duration: t("panchakarma.phases.paschatKarma.duration"),
      colorScheme: getIconColorScheme("Leaf"),
      activities: tArray("panchakarma.phases.paschatKarma.activities"),
    },
  ];

  const conditions = [
    {
      category: t("panchakarma.conditions.chronicDiseases.category"),
      items: tArray("panchakarma.conditions.chronicDiseases.items"),
      successRate: 92,
    },
    {
      category: t("panchakarma.conditions.digestiveDisorders.category"),
      items: tArray("panchakarma.conditions.digestiveDisorders.items"),
      successRate: 95,
    },
    {
      category: t("panchakarma.conditions.skinConditions.category"),
      items: tArray("panchakarma.conditions.skinConditions.items"),
      successRate: 88,
    },
    {
      category: t("panchakarma.conditions.mentalHealth.category"),
      items: tArray("panchakarma.conditions.mentalHealth.items"),
      successRate: 90,
    },
    {
      category: t("panchakarma.conditions.respiratoryIssues.category"),
      items: tArray("panchakarma.conditions.respiratoryIssues.items"),
      successRate: 87,
    },
    {
      category: t("panchakarma.conditions.hormonalImbalances.category"),
      items: tArray("panchakarma.conditions.hormonalImbalances.items"),
      successRate: 89,
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Language and Theme Switchers */}
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex gap-2">
          <LanguageSwitcher variant="compact" />
          <CompactThemeSwitcher />
        </div>

        {/* Hero Section */}
        <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/98 to-muted/30"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-cyan-500/10"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-blue-400/3 via-transparent to-cyan-400/5"></div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-8 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-32 right-16 w-32 h-32 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-24 left-1/3 w-24 h-24 bg-gradient-to-r from-blue-300/10 to-cyan-300/10 rounded-full blur-xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-lg animate-pulse delay-3000"></div>

          {/* Geometric Shapes */}
          <div className="absolute top-16 right-8 w-12 h-12 border border-blue-400/20 rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-32 left-12 w-8 h-8 border border-cyan-400/20 rotate-12 animate-pulse"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/30 glass interactive mb-8 px-6 py-3 text-sm font-medium">
                <Droplets className="w-4 h-4 mr-2" />
                {t("panchakarma.badge")}
              </Badge>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-4 gradient-text leading-tight">
                {t("panchakarma.title")}
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed max-w-4xl mx-auto">
                {t("panchakarma.subtitle")}
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800/30 glass interactive px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  95% {t("common.successRate")}
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800/30 glass interactive px-4 py-2">
                  <Users className="w-4 h-4 mr-2" />
                  2000+ {t("common.patients")} {t("common.treated")}
                </Badge>
                <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800/30 glass interactive px-4 py-2">
                  <Award className="w-4 h-4 mr-2" />
                  {t("common.scientificallyValidated")}
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 dark:from-blue-600 dark:to-cyan-700 dark:hover:from-blue-700 dark:hover:to-cyan-800 text-white text-lg px-10 py-4 interactive shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("panchakarma.cta.bookProgram")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary/30 text-primary hover:bg-primary/10 text-lg px-10 py-4 interactive"
                >
                  {t("panchakarma.cta.freeConsultation")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* What is Panchakarma */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/50 glass interactive mb-4 px-4 py-2 text-sm font-medium shadow-md">
                  <Droplets className="w-4 h-4 mr-2" />
                  {t("panchakarma.whatIs.title")}
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 gradient-text">
                  {t("panchakarma.whatIs.title")}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("panchakarma.whatIs.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg border border-border/30 overflow-hidden glass card-hover group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text">
                      {t("panchakarma.whatIs.ancientScience.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t("panchakarma.whatIs.ancientScience.description")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg border border-border/30 overflow-hidden glass card-hover group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text">
                      {t("panchakarma.whatIs.fiveProcedures.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t("panchakarma.whatIs.fiveProcedures.description")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg border border-border/30 overflow-hidden glass card-hover group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text">
                      {t("panchakarma.whatIs.holisticApproach.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t("panchakarma.whatIs.holisticApproach.description")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg border border-border/30 overflow-hidden glass card-hover group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text">
                      {t("panchakarma.whatIs.modernApplication.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t("panchakarma.whatIs.modernApplication.description")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transformation Card */}
              <div className="mt-16 sm:mt-20">
                <Card className="bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass">
                  <CardContent className="p-8 sm:p-12">
                    <div className="text-center">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                        <Droplets className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6 gradient-text">
                        {t("panchakarma.whatIs.completeTransformation")}
                      </h3>
                      <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                        {t("panchakarma.whatIs.completeTransformationDesc")}
                      </p>
                      <div className="grid grid-cols-2 gap-6 sm:gap-8 max-w-md mx-auto">
                        <div className="text-center">
                          <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            21
                          </div>
                          <div className="text-sm sm:text-base text-muted-foreground">
                            {t("panchakarma.whatIs.daysProgram")}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            95%
                          </div>
                          <div className="text-sm sm:text-base text-muted-foreground">
                            {t("common.successRate")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Heart className="w-4 h-4 mr-2" />
                  {t("panchakarma.benefits.title")}
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 gradient-text">
                  {t("panchakarma.benefits.title")}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("panchakarma.benefits.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12">
                <div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 sm:p-8">
                      <div className="aspect-video bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800/30 dark:to-cyan-800/30 rounded-xl flex items-center justify-center mb-4">
                        <div className="text-center">
                          <Droplets className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Panchakarma Treatment Process
                          </p>
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 gradient-text">
                        {t("panchakarma.benefits.detoxification.title")}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {t("panchakarma.benefits.detoxification.description")}
                      </p>
                      <ul className="space-y-2">
                        {[
                          t("panchakarma.benefits.detoxification.benefit1"),
                          t("panchakarma.benefits.detoxification.benefit2"),
                          t("panchakarma.benefits.detoxification.benefit3"),
                        ].map((benefit, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-2 gradient-text">
                        {t("panchakarma.benefits.immunity.title")}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t("panchakarma.benefits.immunity.description")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-2 gradient-text">
                        {t("panchakarma.benefits.stressRelief.title")}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t("panchakarma.benefits.stressRelief.description")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-2 gradient-text">
                        {t("panchakarma.benefits.digestiveHealth.title")}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t("panchakarma.benefits.digestiveHealth.description")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    icon: Leaf,
                    title: t("panchakarma.benefits.naturalHealing.title"),
                    description: t(
                      "panchakarma.benefits.naturalHealing.description"
                    ),
                    color: "from-green-500 to-emerald-600",
                  },
                  {
                    icon: Star,
                    title: t("panchakarma.benefits.longTermResults.title"),
                    description: t(
                      "panchakarma.benefits.longTermResults.description"
                    ),
                    color: "from-yellow-500 to-orange-600",
                  },
                  {
                    icon: Award,
                    title: t("panchakarma.benefits.provenEfficacy.title"),
                    description: t(
                      "panchakarma.benefits.provenEfficacy.description"
                    ),
                    color: "from-blue-500 to-cyan-600",
                  },
                ].map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <Card
                      key={index}
                      className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="relative">
                          <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                          <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>
                          <div
                            className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${benefit.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 relative z-10`}
                          >
                            <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          </div>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 sm:mb-3 gradient-text">
                          {benefit.title}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Process Timeline */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-muted/30 to-blue-50 dark:to-blue-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Clock className="w-4 h-4 mr-2" />
                  {t("panchakarma.phases.title")}
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 gradient-text">
                  {t("panchakarma.phases.title")}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("panchakarma.phases.subtitle")}
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {phases.map((phase, index) => (
                  <Card
                    key={index}
                    className="bg-card/80 backdrop-blur-sm shadow-lg border border-border/30 overflow-hidden glass card-hover group hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-4">
                        <div
                          className={`bg-gradient-to-br ${phase.colorScheme.gradient} text-white p-4 sm:p-6 flex flex-col justify-center relative overflow-hidden shadow-md`}
                        >
                          <div className="absolute top-4 right-4 w-32 h-32 border border-white/30 rounded-full"></div>
                          <div className="absolute bottom-4 left-4 w-24 h-24 border border-white/30 rounded-full"></div>

                          <div className="text-center lg:text-left relative z-10">
                            <div className="text-4xl sm:text-5xl font-bold mb-3 text-white drop-shadow-lg bg-black/20 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto lg:mx-0">
                              {index + 1}
                            </div>
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-lg">
                              <Droplets className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-playfair font-bold mb-2">
                              {phase.name}
                            </h3>
                            <p className="text-base sm:text-lg opacity-90 mb-3 sm:mb-4">
                              {phase.subtitle}
                            </p>
                            <Badge className="bg-background/20 text-white border-white/30 text-xs sm:text-sm">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              {phase.duration}
                            </Badge>
                          </div>
                        </div>

                        <div className="lg:col-span-3 p-4 sm:p-6 flex flex-col justify-center">
                          <h4 className="text-xl sm:text-2xl font-bold text-foreground mb-3 gradient-text">
                            {t("panchakarma.phases.keyActivities")}:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            {phase.activities.map((activity, actIndex) => (
                              <div
                                key={actIndex}
                                className="flex items-start space-x-2 sm:space-x-3"
                              >
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground dark:text-muted-foreground/90 text-sm sm:text-base">
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

        {/* Process Gallery */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-muted/30 to-blue-50 dark:to-blue-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Droplets className="w-4 h-4 mr-2" />
                  {t("panchakarma.processGallery.title")}
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 gradient-text">
                  {t("panchakarma.processGallery.title")}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("panchakarma.processGallery.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    title: t("panchakarma.processGallery.abhyanga.title"),
                    description: t(
                      "panchakarma.processGallery.abhyanga.description"
                    ),
                    image: "Abhyanga Oil Massage",
                  },
                  {
                    title: t("panchakarma.processGallery.swedana.title"),
                    description: t(
                      "panchakarma.processGallery.swedana.description"
                    ),
                    image: "Swedana Steam Therapy",
                  },
                  {
                    title: t("panchakarma.processGallery.vamana.title"),
                    description: t(
                      "panchakarma.processGallery.vamana.description"
                    ),
                    image: "Vamana Treatment",
                  },
                  {
                    title: t("panchakarma.processGallery.virechana.title"),
                    description: t(
                      "panchakarma.processGallery.virechana.description"
                    ),
                    image: "Virechana Therapy",
                  },
                  {
                    title: t("panchakarma.processGallery.basti.title"),
                    description: t(
                      "panchakarma.processGallery.basti.description"
                    ),
                    image: "Basti Treatment",
                  },
                  {
                    title: t("panchakarma.processGallery.nasya.title"),
                    description: t(
                      "panchakarma.processGallery.nasya.description"
                    ),
                    image: "Nasya Therapy",
                  },
                ].map((process, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg border border-border/30 glass card-hover group"
                  >
                    <div className="aspect-video bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800/30 dark:to-cyan-800/30 flex items-center justify-center">
                      <div className="text-center">
                        <Droplets className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {process.image}
                        </p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-base font-bold text-foreground mb-2 gradient-text">
                        {process.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {process.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Conditions Treated */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-muted/30 to-primary/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 glass interactive mb-6 px-4 py-2">
                  <Heart className="w-4 h-4 mr-2" />
                  {t("panchakarma.conditions.title")}
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 gradient-text">
                  {t("panchakarma.conditions.title")}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("panchakarma.conditions.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {conditions.map((condition, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg border border-border/30 overflow-hidden glass card-hover group"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base sm:text-lg text-foreground flex items-center justify-between">
                        <span className="gradient-text">
                          {condition.category}
                        </span>
                        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800/30 text-xs sm:text-sm">
                          {condition.successRate}% {t("common.success")}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {condition.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex items-center space-x-3"
                          >
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                            <span className="text-muted-foreground dark:text-muted-foreground/90 text-sm sm:text-base">
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

        {/* FAQ Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-muted/30 to-primary/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Award className="w-4 h-4 mr-2" />
                  {t("panchakarma.faq.title")}
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 gradient-text">
                  {t("panchakarma.faq.title")}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("panchakarma.faq.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    question: t("panchakarma.faq.question1.question"),
                    answer: t("panchakarma.faq.question1.answer"),
                  },
                  {
                    question: t("panchakarma.faq.question2.question"),
                    answer: t("panchakarma.faq.question2.answer"),
                  },
                  {
                    question: t("panchakarma.faq.question3.question"),
                    answer: t("panchakarma.faq.question3.answer"),
                  },
                  {
                    question: t("panchakarma.faq.question4.question"),
                    answer: t("panchakarma.faq.question4.answer"),
                  },
                  {
                    question: t("panchakarma.faq.question5.question"),
                    answer: t("panchakarma.faq.question5.answer"),
                  },
                ].map((faq, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-md border border-border/20 glass"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 gradient-text">
                        {faq.question}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-r from-blue-600 to-cyan-700 dark:from-blue-700 dark:to-cyan-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold mb-4 sm:mb-6">
                {t("panchakarma.cta.title")}
              </h2>
              <p className="text-lg sm:text-xl text-blue-100 dark:text-blue-200 mb-6 sm:mb-8 px-4">
                {t("panchakarma.cta.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-white/90 dark:text-blue-600 dark:hover:bg-white text-lg px-10 py-4 interactive shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("panchakarma.cta.bookProgram")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 dark:border-white/80 dark:text-white/90 dark:hover:bg-white/20 text-lg px-10 py-4 interactive"
                >
                  {t("panchakarma.cta.freeConsultation")}
                </Button>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-4 sm:gap-6 text-blue-100 dark:text-blue-200 text-sm sm:text-base">
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
                  <span>
                    {t("panchakarma.cta.features.governmentCertified")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
