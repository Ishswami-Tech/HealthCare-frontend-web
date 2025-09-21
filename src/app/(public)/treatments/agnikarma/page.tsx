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
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { getIconColorScheme } from "@/lib/color-palette";

export default function AgnikarmaPage() {
  const { t } = useTranslation();

  const processSteps = [
    {
      step: 1,
      title: t("agnikarma.processSteps.steps.1.title"),
      description: t("agnikarma.processSteps.steps.1.description"),
      icon: Target,
      colorScheme: getIconColorScheme("Target"),
    },
    {
      step: 2,
      title: t("agnikarma.processSteps.steps.2.title"),
      description: t("agnikarma.processSteps.steps.2.description"),
      icon: Flame,
      colorScheme: getIconColorScheme("Flame"),
    },
    {
      step: 3,
      title: t("agnikarma.processSteps.steps.3.title"),
      description: t("agnikarma.processSteps.steps.3.description"),
      icon: Zap,
      colorScheme: getIconColorScheme("Zap"),
    },
    {
      step: 4,
      title: t("agnikarma.processSteps.steps.4.title"),
      description: t("agnikarma.processSteps.steps.4.description"),
      icon: Heart,
      colorScheme: getIconColorScheme("Heart"),
    },
    {
      step: 5,
      title: t("agnikarma.processSteps.steps.5.title"),
      description: t("agnikarma.processSteps.steps.5.description"),
      icon: Shield,
      colorScheme: getIconColorScheme("Shield"),
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
      colorScheme: getIconColorScheme("Zap"),
    },
    {
      title: t("agnikarma.advantages.precisionTargeting.title"),
      description: t("agnikarma.advantages.precisionTargeting.description"),
      icon: Target,
      colorScheme: getIconColorScheme("Target"),
    },
    {
      title: t("agnikarma.advantages.zeroSideEffects.title"),
      description: t("agnikarma.advantages.zeroSideEffects.description"),
      icon: Shield,
      colorScheme: getIconColorScheme("Shield"),
    },
    {
      title: t("agnikarma.advantages.costEffective.title"),
      description: t("agnikarma.advantages.costEffective.description"),
      icon: TrendingUp,
      colorScheme: getIconColorScheme("TrendingUp"),
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
        <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/98 to-muted/30"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-orange-500/5 to-red-500/10"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-orange-400/3 via-transparent to-red-400/5"></div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-8 w-20 h-20 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-32 right-16 w-32 h-32 bg-gradient-to-r from-red-400/15 to-orange-400/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-24 left-1/3 w-24 h-24 bg-gradient-to-r from-orange-300/10 to-red-300/10 rounded-full blur-xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-lg animate-pulse delay-3000"></div>

          {/* Geometric Shapes */}
          <div className="absolute top-16 right-8 w-12 h-12 border border-orange-400/20 rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-32 left-12 w-8 h-8 border border-red-400/20 rotate-12 animate-pulse"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 text-orange-800 dark:text-orange-100 border-orange-200 dark:border-orange-700/60 glass interactive mb-8 px-6 py-3 text-sm font-medium">
                <Flame className="w-4 h-4 mr-2" />
                {t("agnikarma.badge")}
              </Badge>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-foreground mb-8 gradient-text leading-tight">
                {t("agnikarma.title")}
              </h1>

              <p className="text-xl sm:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-4xl mx-auto">
                {t("agnikarma.subtitle")}
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-100 border-green-200 dark:border-green-700/60 glass interactive px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  92% {t("common.success")}{" "}
                  {t("agnikarma.comparison.successRate")}
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700/60 glass interactive px-4 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  {t("agnikarma.advantages.instantResults.title")}
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700/60 glass interactive px-4 py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  {t("agnikarma.advantages.zeroSideEffects.title")}
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 dark:from-orange-600 dark:to-red-700 dark:hover:from-orange-700 dark:hover:to-red-800 text-white text-lg px-10 py-4 interactive shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("agnikarma.cta.bookSession")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary/30 text-primary hover:bg-primary/10 text-lg px-10 py-4 interactive"
                >
                  {t("agnikarma.cta.freeAssessment")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Scientific Foundation */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Award className="w-4 h-4 mr-2" />
                  {t("agnikarma.scientificFoundation.title")}
                </Badge>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("agnikarma.scientificFoundation.title")}
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("agnikarma.scientificFoundation.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <Card className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardContent className="p-6 sm:p-8">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text">
                      {t("agnikarma.scientificFoundation.ancientText.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t(
                        "agnikarma.scientificFoundation.ancientText.description"
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardContent className="p-6 sm:p-8">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text">
                      {t(
                        "agnikarma.scientificFoundation.modernValidation.title"
                      )}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t(
                        "agnikarma.scientificFoundation.modernValidation.description"
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardContent className="p-6 sm:p-8">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text">
                      {t(
                        "agnikarma.scientificFoundation.precisionTechnology.title"
                      )}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t(
                        "agnikarma.scientificFoundation.precisionTechnology.description"
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardContent className="p-6 sm:p-8">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text">
                      {t(
                        "agnikarma.scientificFoundation.zeroSideEffects.title"
                      )}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-muted/30 to-orange-50 dark:to-orange-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Flame className="w-4 h-4 mr-2" />
                  {t("agnikarma.processSteps.title")}
                </Badge>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("agnikarma.processSteps.title")}
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("agnikarma.processSteps.subtitle")}
                </p>
              </div>

              <div className="space-y-8 sm:space-y-10">
                {processSteps.map((step, index) => {
                  const IconComponent = step.icon;

                  return (
                    <Card
                      key={index}
                      className="bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group hover:shadow-3xl transition-all duration-500"
                    >
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-4">
                          <div
                            className={`bg-gradient-to-br ${step.colorScheme.gradient} text-white p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden shadow-lg`}
                          >
                            <div className="absolute top-4 right-4 w-32 h-32 border border-white/30 rounded-full"></div>
                            <div className="absolute bottom-4 left-4 w-24 h-24 border border-white/30 rounded-full"></div>

                            <div className="text-center lg:text-left relative z-10">
                              <div className="text-4xl sm:text-5xl font-bold mb-3 text-white drop-shadow-lg bg-black/20 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto lg:mx-0">
                                {step.step}
                              </div>
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-lg">
                                <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-center">
                            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 gradient-text">
                              {step.title}
                            </h3>
                            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
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
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-muted/30 to-primary/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <Badge className="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 glass interactive mb-6 px-4 py-2">
                  <Heart className="w-4 h-4 mr-2" />
                  {t("agnikarma.conditions.title")}
                </Badge>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("agnikarma.conditions.title")}
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("agnikarma.conditions.subtitle")}
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid gap-4 sm:gap-6">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 gap-4 p-4 sm:p-6 bg-gradient-to-r from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700 text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg">
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
                        className="hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg border border-border/50 glass card-hover"
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className="grid grid-cols-5 gap-4 items-center text-sm sm:text-base">
                            <div className="font-semibold text-foreground">
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
                            <div className="text-center text-muted-foreground">
                              {item.avgSessions}
                            </div>
                            <div className="text-center text-muted-foreground">
                              {item.recoveryTime}
                            </div>
                            <div className="text-center">
                              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800/30">
                                <div className="flex items-center justify-center mb-1">
                                  <Heart className="w-3 h-3 text-blue-600 mr-1" />
                                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                    Success Story
                                  </span>
                                </div>
                                <p className="text-xs text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                                  {item.patientStory}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {conditionsData.map((item, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg border border-border/50 glass card-hover"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Condition Title */}
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-foreground mb-2">
                            {item.condition}
                          </h3>
                        </div>

                        {/* Success Rate */}
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            <Progress
                              value={Number(item.successRate)}
                              className="w-20 h-3"
                            />
                            <span className="font-bold text-green-600 text-lg">
                              {item.successRate}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("agnikarma.comparison.successRate")}
                          </p>
                        </div>

                        {/* Sessions and Recovery Time */}
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="font-semibold text-foreground">
                              {item.avgSessions}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t("agnikarma.comparison.avgSessions")}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {item.recoveryTime}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t("agnikarma.comparison.recoveryTime")}
                            </p>
                          </div>
                        </div>

                        {/* Patient Story */}
                        <div className="text-center pt-3">
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
                            <div className="flex items-center justify-center mb-2">
                              <Heart className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                Patient Success Story
                              </span>
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                              {item.patientStory}
                            </p>
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

        {/* Patient Success Stories */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Heart className="w-4 h-4 mr-2" />
                  Patient Success Stories
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  Real Results, Real Stories
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  Discover how Agnikarma has transformed lives and brought
                  relief to patients suffering from various conditions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {conditionsData.map((item, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-lg border border-border/50 overflow-hidden glass card-hover group"
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Heart className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-3">
                          {item.condition}
                        </h3>
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30">
                          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium leading-relaxed mb-3">
                            &ldquo;{item.patientStory}&rdquo;
                          </p>
                          <div className="flex items-center justify-center space-x-4 text-xs text-blue-600">
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              {item.successRate}% Success
                            </span>
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                              {item.avgSessions}
                            </span>
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

        {/* Why Agnikarma is Superior */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <Badge className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Star className="w-4 h-4 mr-2" />
                  {t("agnikarma.advantages.title")}
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("agnikarma.advantages.title")}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {t("agnikarma.advantages.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
                {advantages.map((advantage, index) => {
                  const IconComponent = advantage.icon;

                  return (
                    <Card
                      key={index}
                      className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group"
                    >
                      <CardContent className="p-8 sm:p-10">
                        <div className="relative">
                          <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                          <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>

                          <div
                            className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r ${advantage.colorScheme.gradient} rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 relative z-10`}
                          >
                            <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                          </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 gradient-text">
                          {advantage.title}
                        </h3>
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                          {advantage.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Comparison Table */}
              <div className="mt-16 sm:mt-20">
                <Card className="bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass">
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl sm:text-3xl font-playfair font-bold text-foreground gradient-text">
                      {t("agnikarma.comparison.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm sm:text-base">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-4 sm:py-6 px-4 sm:px-6 font-semibold text-foreground">
                              {t("agnikarma.comparison.treatmentMethod")}
                            </th>
                            <th className="text-center py-4 sm:py-6 px-4 sm:px-6 font-semibold text-foreground">
                              {t("agnikarma.comparison.duration")}
                            </th>
                            <th className="text-center py-4 sm:py-6 px-4 sm:px-6 font-semibold text-foreground">
                              {t("agnikarma.comparison.successRate")}
                            </th>
                            <th className="text-center py-4 sm:py-6 px-4 sm:px-6 font-semibold text-foreground">
                              {t("agnikarma.comparison.sideEffects")}
                            </th>
                            <th className="text-center py-4 sm:py-6 px-4 sm:px-6 font-semibold text-foreground">
                              {t("agnikarma.comparison.cost")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border bg-orange-50 dark:bg-orange-900/10">
                            <td className="py-4 sm:py-6 px-4 sm:px-6 font-semibold text-orange-600">
                              {t("agnikarma.comparison.agnikarma")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-green-600 font-semibold">
                              3-5 {t("agnikarma.comparison.sessions")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-green-600 font-semibold">
                              92%
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-green-600 font-semibold">
                              {t("agnikarma.advantages.zeroSideEffects.title")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-green-600 font-semibold">
                              {t("agnikarma.advantages.costEffective.title")}
                            </td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-4 sm:py-6 px-4 sm:px-6">
                              {t("agnikarma.comparison.surgery")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-muted-foreground">
                              6-12 {t("agnikarma.comparison.months")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-muted-foreground">
                              70%
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-red-600">
                              {t("agnikarma.comparison.highRisk")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-red-600">
                              {t("agnikarma.comparison.veryHigh")}
                            </td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-4 sm:py-6 px-4 sm:px-6">
                              {t("agnikarma.comparison.medications")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-muted-foreground">
                              {t("agnikarma.comparison.ongoing")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-muted-foreground">
                              60%
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-red-600">
                              {t("agnikarma.comparison.multiple")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-red-600">
                              {t("agnikarma.comparison.highOngoing")}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-4 sm:py-6 px-4 sm:px-6">
                              {t("agnikarma.comparison.physiotherapy")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-muted-foreground">
                              6-18 {t("agnikarma.comparison.months")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-muted-foreground">
                              50%
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-yellow-600">
                              {t("agnikarma.comparison.minimal")}
                            </td>
                            <td className="text-center py-4 sm:py-6 px-4 sm:px-6 text-yellow-600">
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
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-r from-orange-600 to-red-700 dark:from-orange-700 dark:to-red-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold mb-6 sm:mb-8">
                {t("agnikarma.cta.title")}
              </h2>
              <p className="text-xl sm:text-2xl text-orange-100 dark:text-orange-200 mb-8 sm:mb-10 px-4">
                {t("agnikarma.cta.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-orange-600 hover:bg-orange-50 dark:bg-white/90 dark:text-orange-600 dark:hover:bg-white text-lg px-10 py-4 interactive shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("agnikarma.cta.bookSession")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 dark:border-white/80 dark:text-white/90 dark:hover:bg-white/20 text-lg px-10 py-4 interactive"
                >
                  {t("agnikarma.cta.freeAssessment")}
                </Button>
              </div>

              <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-6 sm:gap-8 text-orange-100 dark:text-orange-200 text-base sm:text-lg">
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
    </PageTransition>
  );
}
