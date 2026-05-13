"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getIconColorScheme } from "@/lib/config/color-palette";
import {
  Droplets,
  Flame,
  Zap,
  Heart,
  Baby,
  GraduationCap,
  Building,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Award,
} from "lucide-react";

import { ServicesCatalog } from "@/components/services/services-catalog";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { LazySection } from "@/components/ui/lazy-section";
import { SectionSkeleton } from "@/lib/dynamic-imports";

export default function TreatmentsPage() {
  const { t } = useTranslation();

  const mainTreatments = [
    {
      id: "panchakarma",
      title: t("treatments.panchakarma.name"),
      subtitle: t("treatments.panchakarma.subtitle"),
      icon: Droplets,
      iconKey: "droplets",
      bgColor: "from-background to-muted/50",
      description: t("treatments.panchakarma.description"),
      successRate: 95,
      duration: t("treatments.panchakarma.duration"),
      sessions: t("treatments.panchakarma.duration"),
      conditions: [
        t("treatments.panchakarma.conditions.0"),
        t("treatments.panchakarma.conditions.1"),
        t("treatments.panchakarma.conditions.2"),
        t("treatments.panchakarma.conditions.3"),
      ],
      href: "/treatments/panchakarma",
      colorScheme: getIconColorScheme("Droplets"),
    },
    {
      id: "agnikarma",
      title: t("agnikarma.badge"),
      subtitle: t("agnikarma.subtitle"),
      icon: Flame,
      iconKey: "flame",
      bgColor: "from-background to-muted/50",
      description: t("agnikarma.title"),
      successRate: 92,
      duration: t("agnikarma.conditions.chronicKneePain.recoveryTime"),
      sessions: t("agnikarma.conditions.chronicKneePain.avgSessions"),
      conditions: [
        t("agnikarma.conditions.chronicKneePain.condition"),
        t("agnikarma.conditions.sciatica.condition"),
        t("agnikarma.conditions.frozenShoulder.condition"),
        t("agnikarma.conditions.arthritis.condition"),
      ],
      href: "/treatments/agnikarma",
      colorScheme: getIconColorScheme("Flame"),
    },
    {
      id: "viddha-karma",
      title: t("viddhakarma.badge"),
      subtitle: t("viddhakarma.subtitle"),
      icon: Zap,
      iconKey: "zap",
      bgColor: "from-background to-muted/50",
      description: t("viddhakarma.title"),
      successRate: 89,
      duration: t("viddhakarma.conditions.autism.duration"),
      sessions: t("viddhakarma.conditions.autism.duration"),
      conditions: [
        t("viddhakarma.conditions.autism.condition"),
        t("viddhakarma.conditions.cerebralPalsy.condition"),
        t("viddhakarma.conditions.stroke.condition"),
        t("viddhakarma.conditions.developmental.condition"),
      ],
      href: "/treatments/viddha-karma",
      colorScheme: getIconColorScheme("Zap"),
    },
  ];

  const specializedPrograms = [
    {
      title: t("treatments.labels.fertilityHealth"),
      icon: Baby,
      iconKey: "baby",
      description: t("treatments.labels.fertilityDescription"),
      services: [
        t("treatments.labels.maleFertility"),
        t("treatments.labels.femaleFertility"),
        t("treatments.labels.pcodTreatment"),
        t("treatments.labels.ivfSupport"),
      ],
      successRate: 88,
      colorScheme: getIconColorScheme("Baby"),
    },
    {
      title: t("treatments.labels.corporateWellness"),
      icon: Building,
      iconKey: "building",
      description: t("treatments.labels.corporateDescription"),
      services: [
        t("treatments.labels.executiveHealth"),
        t("treatments.labels.workplaceStress"),
        t("treatments.labels.employeeWellness"),
        t("treatments.labels.ergonomicConsultations"),
      ],
      successRate: 92,
      colorScheme: getIconColorScheme("Building"),
    },
    {
      title: t("treatments.labels.ayurvedaEducation"),
      icon: GraduationCap,
      iconKey: "graduationcap",
      description: t("treatments.labels.educationDescription"),
      services: [
        t("treatments.labels.certificateCourses"),
        t("treatments.labels.diplomaPrograms"),
        t("treatments.labels.advancedSpecialization"),
        t("treatments.labels.internationalCertification"),
      ],
      successRate: 96,
      colorScheme: getIconColorScheme("GraduationCap"),
    },
    {
      title: t("treatments.labels.communitySeva"),
      icon: Heart,
      iconKey: "heart",
      description: t("treatments.labels.sevaDescription"),
      services: [
        t("treatments.labels.freeTreatmentDays"),
        t("treatments.labels.ruralHealthMissions"),
        t("treatments.labels.seniorCitizenCare"),
        t("treatments.labels.educationalWorkshops"),
      ],
      successRate: 100,
      colorScheme: getIconColorScheme("Heart"),
    },
  ];

  const treatmentPackages = [
    {
      name: t("treatments.labels.ultimatePainRelief"),
      treatments: t("treatments.labels.agnikarmaViddhaKarma"),
      promise: t("treatments.labels.painFreeLiving"),
      popularity: 90,
      colorScheme: getIconColorScheme("Flame"),
    },
    {
      name: t("treatments.labels.completeWellness"),
      treatments: t("treatments.labels.allTherapiesLifestyle"),
      promise: t("treatments.labels.totalHealthTransformation"),
      popularity: 85,
      colorScheme: getIconColorScheme("Heart"),
    },
    {
      name: t("treatments.labels.familyHealingPlan"),
      treatments: t("treatments.labels.familyTreatmentMultiple"),
      promise: t("treatments.labels.familyWellnessEcosystem"),
      popularity: 75,
      colorScheme: getIconColorScheme("Users"),
    },
    {
      name: t("treatments.labels.executiveHealth"),
      treatments: t("treatments.labels.vipTreatmentAnnual"),
      promise: t("treatments.labels.lifetimeWellnessPartnership"),
      popularity: 80,
      colorScheme: getIconColorScheme("Award"),
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
        <section className="relative overflow-hidden border-b border-border/70 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.34)_100%)] py-16 sm:py-20 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.08),transparent_32%)]" />
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-none">
                  <Heart className="mr-2 h-4 w-4" />
                  {t("treatments.title")}
                </Badge>

                <h1 className="max-w-5xl font-playfair text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  {t("treatments.subtitle")}
                </h1>

                <p className="mt-6 max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-xl">
                  {t("treatments.description")}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    {t("stats.livesTransformed")}
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <Award className="mr-2 h-4 w-4 text-primary" />
                    {t("common.governmentCertified")}
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <Star className="mr-2 h-4 w-4 text-primary" />
                    {t("navigation.rating")}
                  </div>
                </div>
              </div>

              <Card className="border-border/70 bg-card/96 shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
                <CardContent className="p-6 sm:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("treatments.labels.mainTreatments")}
                  </p>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {t("treatments.labels.mainTreatmentsDescription")}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <Button size="lg" className="w-full">
                      {t("common.bookAppointment")}
                    </Button>
                    <Button variant="outline" size="lg" className="w-full">
                      {t("navigation.treatments")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Treatments */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-16 sm:py-20 md:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                  <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-primary shadow-none">
                    <Award className="w-4 h-4 mr-2" />
                    {t("treatments.labels.mainTreatments")}
                  </Badge>
                  <h2 className="mb-6 font-playfair text-3xl font-bold text-foreground md:text-4xl xl:text-5xl">
                    {t("treatments.labels.mainTreatmentsTitle")}
                  </h2>
                  <p className="text-lg text-muted-foreground dark:text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed">
                    {t("treatments.labels.mainTreatmentsDescription")}
                  </p>
                </div>

                <div className="space-y-16">
                  {mainTreatments.map((treatment, index) => {
                    const IconComponent = treatment.icon;
                    const isEven = index % 2 === 0;

                    return (
                      <Card
                        key={treatment.id}
                        className="group overflow-hidden border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <CardContent className="p-0">
                          <div
                            className={`grid lg:grid-cols-2 ${
                              !isEven ? "lg:grid-flow-col-dense" : ""
                            }`}
                          >
                            <div
                              className={`bg-gradient-to-br ${
                                treatment.bgColor
                              } p-6 sm:p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden ${
                                !isEven ? "lg:col-start-2" : ""
                              }`}
                            >
                              {/* Background Pattern */}
                              <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-4 right-4 w-32 h-32 border border-primary/20 rounded-full"></div>
                                <div className="absolute bottom-4 left-4 w-24 h-24 border border-secondary/20 rounded-full"></div>
                              </div>

                              <div
                                className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r ${
                                  treatment.colorScheme.gradient
                                } rounded-full flex items-center justify-center mb-6 sm:mb-8 ${
                                  isEven ? "" : "ml-auto"
                                } interactive hover:${
                                  treatment.colorScheme.hover
                                } transition-all duration-300 shadow-lg group-hover:scale-110`}
                              >
                                <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                              </div>

                              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                                  <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-center sm:p-4">
                                  <div className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                                    {treatment.successRate}%
                                  </div>
                                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                                    {t("treatments.labels.successRate")}
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-center sm:p-4">
                                  <div className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                                    {treatment.sessions}
                                  </div>
                                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                                    {t("treatments.labels.duration")}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-center ${
                                !isEven ? "lg:col-start-1" : ""
                              }`}
                            >
                              <h3 className="mb-3 font-playfair text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                                {treatment.title}
                              </h3>
                              <p className="text-base sm:text-lg text-primary font-playfair font-semibold mb-4">
                                {treatment.subtitle}
                              </p>
                              <p className="text-muted-foreground mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                                {treatment.description}
                              </p>

                              <div className="mb-6 sm:mb-8">
                                <h4 className="text-sm sm:text-base md:text-lg font-playfair font-semibold text-foreground mb-3 sm:mb-4">
                                  {t("treatments.conditions.title")}
                                </h4>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                  {treatment.conditions.map(
                                    (condition, condIndex) => (
                                      <Badge
                                        key={condIndex}
                                        variant="outline"
                                        className="text-muted-foreground border-primary/30 hover:bg-primary/10 transition-colors duration-200 px-3 py-1"
                                      >
                                        {condition}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3 sm:space-y-4">
                                <Link href={treatment.href}>
                                  <Button
                                    size="lg"
                                    className={`w-full bg-gradient-to-r ${treatment.colorScheme.gradient} hover:${treatment.colorScheme.hover} text-white interactive transition-all duration-300 shadow-lg hover:shadow-xl group text-sm sm:text-base py-2 sm:py-3`}
                                  >
                                    {t("treatments.labels.learnMore")}{" "}
                                    {treatment.title}
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="w-full border-2 !mt-2 border-primary/30 text-primary hover:bg-primary/10 interactive transition-all duration-300 text-sm sm:text-base py-2 sm:py-3"
                                >
                                  {t("treatments.labels.bookConsultation")}
                                </Button>
                              </div>
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
        </LazySection>

        {/* Specialized Programs */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="border-y border-border/70 bg-muted/25 py-16 sm:py-20 md:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                  <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-primary shadow-none">
                    <Users className="w-4 h-4 mr-2" />
                    {t("treatments.labels.specializedCare")}
                  </Badge>
                  <h2 className="mb-6 font-playfair text-3xl font-bold text-foreground md:text-4xl xl:text-5xl">
                    {t("treatments.labels.specializedProgramsTitle")}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    {t("treatments.labels.specializedProgramsDescription")}
                  </p>
                </div>

                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {specializedPrograms.map((program, index) => {
                    const IconComponent = program.icon;

                    return (
                      <Card
                        key={index}
                        className="border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <CardHeader>
                          <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                            <div
                              className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r ${program.colorScheme.gradient} rounded-full flex items-center justify-center interactive hover:${program.colorScheme.hover} transition-all duration-300`}
                            >
                              <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="font-playfair text-lg font-bold text-foreground md:text-xl">
                                {program.title}
                              </h3>
                              <Badge className="mt-2 border-primary/20 bg-primary/10 text-primary shadow-none">
                                {program.successRate}%{" "}
                                {t("treatments.labels.successRate")}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-6 leading-relaxed text-muted-foreground">
                            {program.description}
                          </p>

                          <div className="space-y-3 mb-6">
                            {program.services.map((service, serviceIndex) => (
                              <div
                                key={serviceIndex}
                                className="flex items-center space-x-2"
                              >
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <span className="text-muted-foreground">
                                  {service}
                                </span>
                              </div>
                            ))}
                          </div>

                          <Button
                            className={`w-full bg-gradient-to-r ${program.colorScheme.gradient} hover:${program.colorScheme.hover} text-white interactive transition-all duration-300`}
                          >
                            {t("treatments.labels.learnMore")}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Treatment Packages */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-12 sm:py-16 md:py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="mb-16 text-center">
                  <h2 className="mb-4 font-playfair text-2xl font-bold text-foreground md:text-3xl">
                    {t("treatments.labels.combinationPackagesTitle")}
                  </h2>
                  <p className="text-base text-muted-foreground">
                    {t("treatments.labels.combinationPackagesDescription")}
                  </p>
                </div>

                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {treatmentPackages.map((pkg, index) => (
                    <Card
                      key={index}
                      className="border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-playfair text-lg font-bold text-foreground md:text-xl">
                            {pkg.name}
                          </h3>
                          <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none">
                            {pkg.popularity}% {t("common.chooseThis")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-playfair text-base font-semibold text-foreground">
                              {t("treatments.labels.treatmentsIncluded")}
                            </h4>
                            <p className="text-muted-foreground">
                              {pkg.treatments}
                            </p>
                          </div>

                          <div>
                            <h4 className="mb-2 font-playfair text-base font-semibold text-foreground">
                              {t("treatments.labels.transformationPromise")}
                            </h4>
                            <p className="font-medium text-muted-foreground">
                              {pkg.promise}
                            </p>
                          </div>

                          <div className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                {t("treatments.labels.popularity")}
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {pkg.popularity}%
                              </span>
                            </div>
                            <Progress value={pkg.popularity} className="h-2" />
                          </div>

                          <Button
                            className={`w-full bg-gradient-to-r ${pkg.colorScheme.gradient} hover:${pkg.colorScheme.hover} text-white mt-6 interactive`}
                          >
                            {t("treatments.labels.choosePackage")}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Call to Action */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="border-y border-primary/20 bg-primary/[0.96] py-12 sm:py-16 md:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center text-white">
                <h2 className="text-2xl md:text-3xl font-playfair font-bold mb-6 text-white">
                  {t("common.bookAppointment")}
                </h2>
                <p className="text-lg text-white/90 mb-8">
                  {t("treatments.description")}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 interactive w-full sm:w-auto"
                  >
                    {t("common.bookAppointment")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 interactive w-full sm:w-auto"
                  >
                    {t("common.learnMore")}
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/90">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t("common.governmentCertified")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span>{t("navigation.rating")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{t("stats.livesTransformed")}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Comprehensive Services Catalog */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="bg-muted/25 py-12 sm:py-16 md:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <Suspense fallback={<SectionSkeleton />}>
                <ServicesCatalog
                  variant="grid"
                  columns={3}
                  showDetails={true}
                />
              </Suspense>
            </div>
          </section>
        </LazySection>
      </div>
    </PageTransition>
  );
}
