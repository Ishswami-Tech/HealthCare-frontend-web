"use client";

import { Suspense } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import { ClinicInfo } from "@/components/clinic/clinic-info";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { LazySection } from "@/components/ui/lazy-section";
import { SectionSkeleton } from "@/lib/dynamic-imports";
import { getIconColorScheme } from "@/lib/config/color-palette";

export default function AboutPage() {
  const { t } = useTranslation();

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
      colorScheme: getIconColorScheme("Heart"),
    },
    {
      icon: Leaf,
      title: t("about.coreValues.authenticAyurveda.title"),
      description: t("about.coreValues.authenticAyurveda.description"),
      colorScheme: getIconColorScheme("Leaf"),
    },
    {
      icon: Brain,
      title: t("about.coreValues.scientificApproach.title"),
      description: t("about.coreValues.scientificApproach.description"),
      colorScheme: getIconColorScheme("Brain"),
    },
    {
      icon: Target,
      title: t("about.coreValues.holisticHealing.title"),
      description: t("about.coreValues.holisticHealing.description"),
      colorScheme: getIconColorScheme("Target"),
    },
  ];

  const achievements = [
    {
      number: "5000+",
      label: t("about.achievements.livesTransformed"),
      icon: Users,
      colorScheme: getIconColorScheme("Users"),
    },
    {
      number: "20+",
      label: t("about.achievements.yearsOfExcellence"),
      icon: Clock,
      colorScheme: getIconColorScheme("Clock"),
    },
    {
      number: "95%",
      label: t("about.achievements.successRate"),
      icon: Star,
      colorScheme: getIconColorScheme("Star"),
    },
    {
      number: "4.9",
      label: t("about.achievements.patientRating"),
      icon: Award,
      colorScheme: getIconColorScheme("Award"),
    },
  ];

  const storyParagraphs = [
    t("about.story.paragraphs.p1"),
    t("about.story.paragraphs.p2"),
    t("about.story.paragraphs.p3"),
    t("about.story.paragraphs.p4"),
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground">
        <div className="fixed right-3 top-3 z-50 flex gap-2 sm:right-4 sm:top-4">
          <LanguageSwitcher variant="compact" />
          <CompactThemeSwitcher />
        </div>

        <section className="relative overflow-hidden border-b border-border/70 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.34)_100%)] py-16 sm:py-20 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.08),transparent_32%)]" />
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
              <div className="max-w-4xl">
                <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-none">
                  <Heart className="mr-2 h-4 w-4" />
                  {t("about.hero.badge")}
                </Badge>
                <h1 className="max-w-5xl font-playfair text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  {t("about.hero.title")}
                </h1>
                <p className="mt-6 max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-xl">
                  {t("about.hero.subtitle")}
                </p>
              </div>

              <Card className="border-border/70 bg-card/96 shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
                <CardContent className="p-6 sm:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("about.mission.title")}
                  </p>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {t("about.mission.description")}
                  </p>
                  <div className="mt-6 grid gap-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm font-medium">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      {t("about.hero.certifications.governmentCertified")}
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm font-medium">
                      <Shield className="h-4 w-4 text-primary" />
                      {t("about.hero.certifications.iso9001")}
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm font-medium">
                      <Award className="h-4 w-4 text-primary" />
                      {t("about.hero.certifications.teachingHospital")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                      {t("about.story.title")}
                    </p>
                    <h2 className="mt-4 font-playfair text-3xl font-bold leading-tight sm:text-4xl">
                      {t("about.story.title")}
                    </h2>
                  </div>
                  <div className="mt-8 grid gap-4">
                    {storyParagraphs.map((paragraph, index) => (
                      <Card
                        key={`${paragraph}-${index}`}
                        className="border-border/70 bg-card shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
                      >
                        <CardContent className="flex gap-4 p-5 sm:p-6">
                          <div className="mt-1 h-9 w-9 shrink-0 rounded-full border border-primary/20 bg-primary/10 text-center text-sm font-semibold leading-9 text-primary">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                            {paragraph}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {achievements.map((achievement) => {
                    const Icon = achievement.icon;

                    return (
                      <Card
                        key={achievement.label}
                        className="border-border/70 bg-card shadow-sm"
                      >
                        <CardContent className="flex items-center gap-4 p-5">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${achievement.colorScheme.gradient}`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-foreground">
                              {achievement.number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {achievement.label}
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

        <LazySection fallback={<SectionSkeleton />}>
          <section className="border-y border-border/70 bg-muted/25 py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("about.coreValues.title")}
                  </p>
                  <h2 className="mt-4 font-playfair text-3xl font-bold sm:text-4xl">
                    {t("about.coreValues.title")}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                    {t("about.coreValues.subtitle")}
                  </p>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {values.map((value) => {
                    const Icon = value.icon;

                    return (
                      <Card
                        key={value.title}
                        className="h-full border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <CardContent className="p-6">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${value.colorScheme.gradient}`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="mt-5 text-lg font-semibold text-foreground">
                            {value.title}
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-muted-foreground">
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
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("about.milestones.title")}
                  </p>
                  <h2 className="mt-4 font-playfair text-3xl font-bold sm:text-4xl">
                    {t("about.milestones.title")}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                    {t("about.milestones.subtitle")}
                  </p>
                </div>

                <div className="mt-10 grid gap-4 lg:grid-cols-2">
                  {milestones.map((milestone) => (
                    <Card
                      key={milestone.year}
                      className="border-border/70 bg-card shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="min-w-16 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-center text-sm font-bold text-primary">
                            {milestone.year}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {milestone.event}
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="border-y border-border/70 bg-primary/[0.96] py-16 text-primary-foreground sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="font-playfair text-3xl font-bold sm:text-4xl">
                    {t("about.legacy.title")}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-primary-foreground/85 sm:text-lg">
                    {t("about.legacy.description")}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90"
                  >
                    {t("navigation.bookConsultation")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Free Health Assessment
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="bg-muted/20 py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <Suspense fallback={<SectionSkeleton />}>
                <ClinicInfo
                  variant="full"
                  showDoctor={true}
                  showTimings={true}
                  showContact={true}
                />
              </Suspense>
            </div>
          </section>
        </LazySection>
      </div>
    </PageTransition>
  );
}
