"use client";


import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  CheckCircle,
  Star,
  Target,
  Brain,
  Heart,
  Shield,
  Award,
  Activity,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { getIconColorScheme } from "@/lib/config/color-palette";

export default function ViddhaKarmaPage() {
  const { t } = useTranslation();

  // Helper function to get translated treatments
  const getTranslatedTreatments = (key: string): string[] => {
    const treatments = t(key);
    // If the translation returns a string, split it by comma
    if (typeof treatments === "string") {
      return treatments.split(",").map((t) => t.trim());
    }
    // If it's already an array, return it
    return treatments as string[];
  };
  const processSteps = [
    {
      step: 1,
      title: t("viddhakarma.processSteps.steps.1.title"),
      description: t("viddhakarma.processSteps.steps.1.description"),
      icon: Target,
      colorScheme: getIconColorScheme("Target"),
    },
    {
      step: 2,
      title: t("viddhakarma.processSteps.steps.2.title"),
      description: t("viddhakarma.processSteps.steps.2.description"),
      icon: Zap,
      colorScheme: getIconColorScheme("Zap"),
    },
    {
      step: 3,
      title: t("viddhakarma.processSteps.steps.3.title"),
      description: t("viddhakarma.processSteps.steps.3.description"),
      icon: Activity,
      colorScheme: getIconColorScheme("Activity"),
    },
    {
      step: 4,
      title: t("viddhakarma.processSteps.steps.4.title"),
      description: t("viddhakarma.processSteps.steps.4.description"),
      icon: Heart,
      colorScheme: getIconColorScheme("Heart"),
    },
    {
      step: 5,
      title: t("viddhakarma.processSteps.steps.5.title"),
      description: t("viddhakarma.processSteps.steps.5.description"),
      icon: Shield,
      colorScheme: getIconColorScheme("Shield"),
    },
  ];

  const specializedApplications = [
    {
      category: t("viddhakarma.specializedApplications.autism.title"),
      treatments: getTranslatedTreatments(
        "viddhakarma.specializedApplications.autism.treatments"
      ),
      benefits: t("viddhakarma.specializedApplications.autism.description"),
      successRate: 89,
      colorScheme: getIconColorScheme("Brain"),
    },
    {
      category: t("viddhakarma.specializedApplications.cerebralPalsy.title"),
      treatments: getTranslatedTreatments(
        "viddhakarma.specializedApplications.cerebralPalsy.treatments"
      ),
      benefits: t(
        "viddhakarma.specializedApplications.cerebralPalsy.description"
      ),
      successRate: 92,
      colorScheme: getIconColorScheme("Activity"),
    },
    {
      category: t("viddhakarma.specializedApplications.stroke.title"),
      treatments: getTranslatedTreatments(
        "viddhakarma.specializedApplications.stroke.treatments"
      ),
      benefits: t("viddhakarma.specializedApplications.stroke.description"),
      successRate: 85,
      colorScheme: getIconColorScheme("Heart"),
    },
    {
      category: t("viddhakarma.specializedApplications.parkinsons.title"),
      treatments: getTranslatedTreatments(
        "viddhakarma.specializedApplications.parkinsons.treatments"
      ),
      benefits: t("viddhakarma.specializedApplications.parkinsons.description"),
      successRate: 87,
      colorScheme: getIconColorScheme("Zap"),
    },
    {
      category: t(
        "viddhakarma.specializedApplications.stressMentalHealth.title"
      ),
      treatments: getTranslatedTreatments(
        "viddhakarma.specializedApplications.stressMentalHealth.treatments"
      ),
      benefits: t(
        "viddhakarma.specializedApplications.stressMentalHealth.description"
      ),
      successRate: 83,
      colorScheme: getIconColorScheme("Shield"),
    },
    {
      category: t("viddhakarma.specializedApplications.womensHealth.title"),
      treatments: getTranslatedTreatments(
        "viddhakarma.specializedApplications.womensHealth.treatments"
      ),
      benefits: t(
        "viddhakarma.specializedApplications.womensHealth.description"
      ),
      successRate: 88,
      colorScheme: getIconColorScheme("Heart"),
    },
  ];

  const advancedTechniques = [
    {
      name: t("viddhakarma.advancedTechniques.marmaTherapy.title"),
      description: t("viddhakarma.advancedTechniques.marmaTherapy.description"),
      icon: Target,
      colorScheme: getIconColorScheme("Target"),
    },
    {
      name: t("viddhakarma.advancedTechniques.pranayama.title"),
      description: t("viddhakarma.advancedTechniques.pranayama.description"),
      icon: Zap,
      colorScheme: getIconColorScheme("Zap"),
    },
    {
      name: t("viddhakarma.advancedTechniques.meditation.title"),
      description: t("viddhakarma.advancedTechniques.meditation.description"),
      icon: Heart,
      colorScheme: getIconColorScheme("Heart"),
    },
    {
      name: t("viddhakarma.advancedTechniques.herbalSupport.title"),
      description: t(
        "viddhakarma.advancedTechniques.herbalSupport.description"
      ),
      icon: Activity,
      colorScheme: getIconColorScheme("Activity"),
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Language Switcher and Theme Switcher */}
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex gap-2">
          <LanguageSwitcher variant="compact" />
          <CompactThemeSwitcher />
        </div>

        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/98 to-muted/30"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/5 to-indigo-500/10"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-400/3 via-transparent to-indigo-400/5"></div>
          <div className="absolute top-20 left-8 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-32 right-16 w-32 h-32 bg-gradient-to-r from-indigo-400/15 to-purple-400/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-24 left-1/3 w-24 h-24 bg-gradient-to-r from-purple-300/10 to-indigo-300/10 rounded-full blur-xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full blur-lg animate-pulse delay-3000"></div>
          <div className="absolute top-16 right-8 w-12 h-12 border border-purple-400/20 rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-32 left-12 w-8 h-8 border border-indigo-400/20 rotate-12 animate-pulse"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700/60 glass interactive mb-8 px-6 py-3 text-sm font-medium">
                <Zap className="w-4 h-4 mr-2" />
                {t("viddhakarma.badge")}
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-foreground mb-8 gradient-text leading-tight">
                {t("viddhakarma.title")}
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-4xl mx-auto">
                {t("viddhakarma.subtitle")}
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-100 border-green-200 dark:border-green-700/60 glass interactive px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  89% {t("common.success")}{" "}
                  {t("agnikarma.comparison.successRate")}
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700/60 glass interactive px-4 py-2">
                  <Target className="w-4 h-4 mr-2" />
                  107 Marma Points
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700/60 glass interactive px-4 py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  {t("common.scientificallyValidated")}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 dark:from-purple-600 dark:to-indigo-700 dark:hover:from-purple-700 dark:hover:to-indigo-800 text-white text-lg px-10 py-4 interactive shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("viddhakarma.cta.bookConsultation")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary/30 text-primary hover:bg-primary/10 text-lg px-10 py-4 interactive"
                >
                  {t("viddhakarma.cta.freeAssessment")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Understanding Viddha Karma */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Brain className="w-4 h-4 mr-2" />
                  Advanced Techniques
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("viddhakarma.advancedTechniques.title")}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {t("viddhakarma.advancedTechniques.subtitle")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardContent className="p-6">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
                      {t("viddhakarma.advancedTechniques.marmaTherapy.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t(
                        "viddhakarma.advancedTechniques.marmaTherapy.description"
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardContent className="p-6">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
                      {t("viddhakarma.advancedTechniques.pranayama.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t(
                        "viddhakarma.advancedTechniques.pranayama.description"
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardContent className="p-6">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
                      {t("viddhakarma.advancedTechniques.meditation.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t(
                        "viddhakarma.advancedTechniques.meditation.description"
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardContent className="p-6">
                    <div className="relative">
                      <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10">
                        <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
                      {t("viddhakarma.advancedTechniques.herbalSupport.title")}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {t(
                        "viddhakarma.advancedTechniques.herbalSupport.description"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Treatment Process */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-muted/30 to-purple-50 dark:to-purple-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Activity className="w-4 h-4 mr-2" />
                  Treatment Process
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("viddhakarma.processSteps.title")}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {t("viddhakarma.processSteps.subtitle")}
                </p>
              </div>

              <div className="space-y-8">
                {processSteps.map((step, index) => {
                  const IconComponent = step.icon;

                  return (
                    <Card
                      key={index}
                      className="bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group hover:shadow-3xl transition-all duration-500"
                    >
                      <CardContent className="p-0">
                        <div className="grid lg:grid-cols-4">
                          <div
                            className={`bg-gradient-to-br ${step.colorScheme.gradient} text-white p-8 flex flex-col justify-center relative overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-white/10"></div>
                            <div className="absolute top-4 right-4 w-20 h-20 border border-white/20 rounded-full"></div>
                            <div className="absolute bottom-4 left-4 w-16 h-16 border border-white/20 rounded-full"></div>
                            <div className="text-center lg:text-left relative z-10">
                              <div className="text-4xl sm:text-5xl font-bold mb-3 text-white drop-shadow-lg bg-black/20 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto lg:mx-0">
                                {step.step}
                              </div>
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-lg">
                                <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-3 p-8 flex flex-col justify-center">
                            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                              {step.title}
                            </h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">
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

        {/* Specialized Applications */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-muted/30 to-primary/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <Badge className="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 glass interactive mb-6 px-4 py-2">
                  <Target className="w-4 h-4 mr-2" />
                  Specialized Care
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("viddhakarma.specializedApplications.title")}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {t("viddhakarma.specializedApplications.subtitle")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {specializedApplications.map((application, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group"
                  >
                    <CardHeader>
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${application.colorScheme.gradient} rounded-full flex items-center justify-center mb-4`}
                      >
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl text-foreground mb-2">
                        {application.category}
                      </CardTitle>
                      <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800/30 w-fit">
                        {application.successRate}% Success Rate
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">
                            {t(
                              "viddhakarma.specializedApplications.specificTreatments"
                            )}
                          </h4>
                          <ul className="space-y-1">
                            {application.treatments.map(
                              (treatment, treatmentIndex) => (
                                <li
                                  key={treatmentIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-muted-foreground">
                                    {treatment}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2">
                            {t(
                              "viddhakarma.specializedApplications.uniqueBenefits"
                            )}
                          </h4>
                          <p className="text-muted-foreground">
                            {application.benefits}
                          </p>
                        </div>

                        <div className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              {t(
                                "viddhakarma.specializedApplications.successRate"
                              )}
                            </span>
                            <span className="text-sm font-bold text-green-600">
                              {application.successRate}%
                            </span>
                          </div>
                          <Progress
                            value={application.successRate}
                            className="h-2"
                          />
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
                  {t("viddhakarma.patientSuccessStories.title")}
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("viddhakarma.patientSuccessStories.subtitle")}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {t("viddhakarma.patientSuccessStories.description")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {specializedApplications.map((application, index) => (
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
                          {application.category}
                        </h3>
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30">
                          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium leading-relaxed mb-3">
                            &ldquo;{application.benefits}&rdquo;
                          </p>
                          <div className="flex items-center justify-center space-x-4 text-xs text-blue-600">
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              {application.successRate}% Success
                            </span>
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                              {application.treatments.length} Treatments
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

        {/* Advanced Techniques */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Award className="w-4 h-4 mr-2" />
                  Advanced Techniques
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("viddhakarma.advancedTechniques.title")}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {t("viddhakarma.advancedTechniques.subtitle")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {advancedTechniques.map((technique, index) => {
                  const IconComponent = technique.icon;

                  return (
                    <Card
                      key={index}
                      className="text-center hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group"
                    >
                      <CardContent className="p-8">
                        <div className="relative">
                          <div className="absolute top-4 right-4 w-20 h-20 border border-primary/20 rounded-full"></div>
                          <div className="absolute bottom-4 left-4 w-16 h-16 border border-secondary/20 rounded-full"></div>
                          <div
                            className={`w-16 h-16 bg-gradient-to-r ${technique.colorScheme.gradient} rounded-full flex items-center justify-center mx-auto mb-6 relative z-10`}
                          >
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-4">
                          {technique.name}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {technique.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Treatment Packages */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <Badge className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800/50 glass interactive mb-6 px-6 py-3 text-sm font-medium shadow-md">
                  <Star className="w-4 h-4 mr-2" />
                  Treatment Packages
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                  {t("viddhakarma.treatmentPackages.title")}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {t("viddhakarma.treatmentPackages.subtitle")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg text-foreground">
                      {t("viddhakarma.treatmentPackages.essential.title")}
                    </CardTitle>
                    <div className="text-2xl font-bold text-purple-600">
                      {t("viddhakarma.treatmentPackages.essential.sessions")}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {t("viddhakarma.treatmentPackages.essential.description")}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("viddhakarma.treatmentPackages.successRate")}
                      </span>
                      <span className="font-bold text-green-600">
                        {t(
                          "viddhakarma.treatmentPackages.essential.successRate"
                        )}
                      </span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 dark:from-purple-600 dark:to-indigo-700 dark:hover:from-purple-700 dark:hover:to-indigo-800 text-white">
                      {t("viddhakarma.treatmentPackages.choosePackage")}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group relative">
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white">
                    {t("viddhakarma.treatmentPackages.comprehensive.badge")}
                  </Badge>
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg text-foreground">
                      {t("viddhakarma.treatmentPackages.comprehensive.title")}
                    </CardTitle>
                    <div className="text-2xl font-bold text-purple-600">
                      {t(
                        "viddhakarma.treatmentPackages.comprehensive.sessions"
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {t(
                        "viddhakarma.treatmentPackages.comprehensive.description"
                      )}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("viddhakarma.treatmentPackages.successRate")}
                      </span>
                      <span className="font-bold text-green-600">
                        {t(
                          "viddhakarma.treatmentPackages.comprehensive.successRate"
                        )}
                      </span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 dark:from-orange-600 dark:to-red-700 dark:hover:from-orange-700 dark:hover:to-red-800 text-white">
                      {t("viddhakarma.treatmentPackages.choosePackage")}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 overflow-hidden glass card-hover group">
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg text-foreground">
                      {t("viddhakarma.treatmentPackages.advanced.title")}
                    </CardTitle>
                    <div className="text-2xl font-bold text-purple-600">
                      {t("viddhakarma.treatmentPackages.advanced.sessions")}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {t("viddhakarma.treatmentPackages.advanced.description")}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("viddhakarma.treatmentPackages.successRate")}
                      </span>
                      <span className="font-bold text-green-600">
                        {t(
                          "viddhakarma.treatmentPackages.advanced.successRate"
                        )}
                      </span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 dark:from-purple-600 dark:to-indigo-700 dark:hover:from-purple-700 dark:hover:to-indigo-800 text-white">
                      {t("viddhakarma.treatmentPackages.choosePackage")}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 shadow-2xl border border-border/50 overflow-hidden glass card-hover group relative">
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white">
                    {t("viddhakarma.treatmentPackages.holistic.badge")}
                  </Badge>
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg text-foreground">
                      {t("viddhakarma.treatmentPackages.holistic.title")}
                    </CardTitle>
                    <div className="text-2xl font-bold text-purple-600">
                      {t("viddhakarma.treatmentPackages.holistic.sessions")}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {t("viddhakarma.treatmentPackages.holistic.description")}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("viddhakarma.treatmentPackages.successRate")}
                      </span>
                      <span className="font-bold text-green-600">
                        {t(
                          "viddhakarma.treatmentPackages.holistic.successRate"
                        )}
                      </span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 dark:from-yellow-600 dark:to-orange-700 dark:hover:from-yellow-700 dark:hover:to-orange-800 text-white">
                      {t("viddhakarma.treatmentPackages.choosePackage")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold mb-6">
                {t("viddhakarma.cta.title")}
              </h2>
              <p className="text-xl text-purple-100 dark:text-purple-200 mb-8 leading-relaxed">
                {t("viddhakarma.cta.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-purple-50 dark:bg-white/90 dark:text-purple-600 dark:hover:bg-white text-lg px-10 py-4"
                >
                  {t("viddhakarma.cta.bookConsultation")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 dark:border-white/80 dark:text-white/90 dark:hover:bg-white/20 text-lg px-10 py-4"
                >
                  {t("viddhakarma.cta.freeAssessment")}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-purple-100 dark:text-purple-200">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>107 Marma Points</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Safe & Natural</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>89% Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
