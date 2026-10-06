"use client";

import { Suspense, type ComponentType } from "react";
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
import { SectionSkeleton } from "@/lib/dynamic-imports-skeletons";
import { getIconColorScheme } from "@/lib/config/color-palette";

type AchievementItem = {
  number: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  colorScheme: { text: string };
};

function AchievementCard({ achievement }: { achievement: AchievementItem }) {
  const IconComponent = achievement.icon;

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
      <div className="relative text-center glass p-4 rounded-xl card-hover bg-gradient-to-br from-background/60 to-muted/40 dark:from-background/70 dark:to-muted/50 border border-border/30 dark:border-border/40 shadow-lg hover:shadow-xl">
        <div className="flex items-center justify-center gap-x-3 mb-3">
          <IconComponent
            className={`size-6 ${achievement.colorScheme.text} hover-child group-hover:scale-105`}
          />
          <span
            className={`font-bold text-2xl ${achievement.colorScheme.text} gradient-text`}
          >
            {achievement.number}
          </span>
        </div>
        <span className="text-sm text-muted-foreground font-semibold">
          {achievement.label}
        </span>
      </div>
    </div>
  );
}

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
      number: "4.9★",
      label: t("about.achievements.patientRating"),
      icon: Award,
      colorScheme: getIconColorScheme("Award"),
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/30 relative overflow-hidden">
        {/* Advanced Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Floating Orbs */}
          <div className="absolute -top-40 -right-40 size-96 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 size-96 bg-gradient-to-r from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 size-[32rem] bg-gradient-to-r from-accent/5 to-accent/3 dark:from-accent/10 dark:to-accent/8 rounded-full blur-3xl animate-pulse delay-500"></div>

          {/* Geometric Patterns */}
          <div className="absolute top-20 left-20 size-32 border border-primary/10 dark:border-primary/20 rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-20 right-20 size-24 border border-secondary/10 dark:border-secondary/20 rotate-12 animate-spin-slow-reverse"></div>
          <div className="absolute top-1/3 right-1/3 size-16 bg-gradient-to-r from-accent/20 to-accent/10 dark:from-accent/30 dark:to-accent/20 rounded-full animate-pulse"></div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]"></div>
        </div>

        {/* Language Switcher & Theme Switcher */}
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex gap-2">
          <LanguageSwitcher variant="compact" />
          <CompactThemeSwitcher />
        </div>

        {/* Hero Section */}
        <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden">
          {/* Hero Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent dark:from-primary/20"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto text-center">
              {/* Floating Badge */}
              <div className="animate-fade-in-down mb-8">
                <div className="inline-block relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse"></div>
                  <Badge className="relative bg-gradient-to-r from-primary/20 to-primary/15 dark:from-primary/30 dark:to-primary/20 text-primary dark:text-primary-foreground border-primary/40 dark:border-primary/50 glass shadow-lg hover:shadow-xl interactive px-6 py-3 text-sm font-semibold">
                    <Heart className="size-5 mr-3 animate-pulse" />
                    {t("about.hero.badge")}
                  </Badge>
                </div>
              </div>

              {/* Main Title with Glow Effect */}
              <div className="animate-fade-in-up delay-200 mb-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-2xl animate-pulse"></div>
                  <h1 className="relative text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-playfair font-semibold text-foreground gradient-text leading-tight">
                    {t("about.hero.title")}
                  </h1>
                </div>
              </div>

              {/* Subtitle with Enhanced Typography */}
              <div className="animate-fade-in-up delay-400 mb-16">
                <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto font-light">
                  {t("about.hero.subtitle")}
                </p>
              </div>

              {/* Enhanced Certification Badges */}
              <div className="animate-fade-in-up delay-600">
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-emerald-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    <Badge className="relative bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/40 text-emerald-800 dark:text-emerald-100 border-emerald-300 dark:border-emerald-600/60 glass card-hover px-6 py-3 shadow-lg hover:shadow-xl dark:shadow-emerald-900/30 text-sm font-semibold">
                      <CheckCircle className="size-5 mr-3 hover-child group-hover:scale-105" />
                      {t("about.hero.certifications.governmentCertified")}
                    </Badge>
                  </div>
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400/20 to-sky-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    <Badge className="relative bg-gradient-to-r from-sky-100 to-sky-50 dark:from-sky-900/50 dark:to-sky-800/40 text-sky-800 dark:text-sky-100 border-sky-300 dark:border-sky-600/60 glass card-hover px-6 py-3 shadow-lg hover:shadow-xl dark:shadow-sky-900/30 text-sm font-semibold">
                      <Shield className="size-5 mr-3 hover-child group-hover:scale-105" />
                      {t("about.hero.certifications.iso9001")}
                    </Badge>
                  </div>
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-violet-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    <Badge className="relative bg-gradient-to-r from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/40 text-violet-800 dark:text-violet-100 border-violet-300 dark:border-violet-600/60 glass card-hover px-6 py-3 shadow-lg hover:shadow-xl dark:shadow-violet-900/30 text-sm font-semibold">
                      <Award className="size-5 mr-3 hover-child group-hover:scale-105" />
                      {t("about.hero.certifications.teachingHospital")}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-8 sm:py-12 md:py-16 bg-gradient-to-br from-muted/30 via-background to-primary/5 dark:from-muted/40 dark:via-background dark:to-primary/10 overflow-hidden">
            {/* Section Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent dark:from-primary/10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent dark:from-secondary/10"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-8xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
                  {/* Story Content */}
                  <div className="flex flex-col gap-y-6 sm:gap-y-8">
                    <div className="animate-fade-in-left">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                        <h2 className="relative text-3xl sm:text-4xl md:text-4xl lg:text-4xl font-playfair font-semibold text-foreground mb-4 gradient-text">
                          {t("about.story.title")}
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-col gap-y-4 sm:gap-y-5 text-muted-foreground leading-relaxed animate-fade-in-left delay-200">
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card/60 to-muted/40 dark:from-card/70 dark:to-muted/50 border border-border/30 dark:border-border/40 glass hover:shadow-lg dark:hover:shadow-xl card-hover">
                          <div className="flex items-start gap-x-4">
                            <div className="size-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                              <span className="text-2xl">🌱</span>
                            </div>
                            <p className="text-base font-light leading-relaxed">
                              {t("about.story.paragraphs.p1")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card/60 to-muted/40 dark:from-card/70 dark:to-muted/50 border border-border/30 dark:border-border/40 glass hover:shadow-lg dark:hover:shadow-xl card-hover">
                          <div className="flex items-start gap-x-4">
                            <div className="size-12 bg-gradient-to-r from-secondary to-secondary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                              <span className="text-2xl">🏥</span>
                            </div>
                            <p className="text-base font-light leading-relaxed">
                              {t("about.story.paragraphs.p2")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card/60 to-muted/40 dark:from-card/70 dark:to-muted/50 border border-border/30 dark:border-border/40 glass hover:shadow-lg dark:hover:shadow-xl card-hover">
                          <div className="flex items-start gap-x-4">
                            <div className="size-12 bg-gradient-to-r from-accent to-accent/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                              <span className="text-2xl">💎</span>
                            </div>
                            <p className="text-base font-light leading-relaxed">
                              {t("about.story.paragraphs.p3")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card/60 to-muted/40 dark:from-card/70 dark:to-muted/50 border border-border/30 dark:border-border/40 glass hover:shadow-lg dark:hover:shadow-xl card-hover">
                          <div className="flex items-start gap-x-4">
                            <div className="size-12 bg-gradient-to-r from-primary via-secondary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                              <span className="text-2xl">🏆</span>
                            </div>
                            <p className="text-base font-light leading-relaxed">
                              {t("about.story.paragraphs.p4")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mission & Achievements Card */}
                  <div className="relative animate-fade-in-right">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-secondary/15 dark:from-primary/25 dark:to-secondary/25 rounded-2xl blur-2xl"></div>
                    <Card className="relative bg-gradient-to-br from-card/90 to-muted/30 dark:from-card/95 dark:to-muted/40 border-primary/30 dark:border-primary/40 shadow-lg dark:shadow-xl glass backdrop-blur-sm hover:shadow-xl dark:hover:shadow-2xl card-hover">
                      <CardContent className="p-6 lg:p-8">
                        <div className="text-center">
                          {/* Enhanced Mission Icon */}
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-2xl animate-pulse"></div>
                            <div className="relative size-32 bg-gradient-to-r from-primary via-primary/90 to-secondary rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse border-4 border-background/50">
                              <span className="text-4xl">🕉️</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl"></div>
                          </div>

                          {/* Mission Title */}
                          <h3 className="text-2xl font-semibold text-foreground mb-4 gradient-text">
                            {t("about.mission.title")}
                          </h3>

                          {/* Mission Description */}
                          <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-light">
                            {t("about.mission.description")}
                          </p>

                          {/* Enhanced Achievements Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            {achievements.map((achievement) => {
                              return <AchievementCard key={achievement.number} achievement={achievement} />;
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
        </LazySection>

        {/* Our Values Section */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-8 sm:py-12 md:py-16 bg-gradient-to-br from-background via-muted/20 to-secondary/5 dark:from-background dark:via-muted/30 dark:to-secondary/10 overflow-hidden">
            {/* Section Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent dark:from-primary/10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent dark:from-secondary/10"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-8xl mx-auto">
                <div className="text-center mb-12 animate-fade-in-up">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                    <h2 className="relative text-3xl sm:text-4xl font-playfair font-semibold text-foreground mb-4 gradient-text">
                      {t("about.coreValues.title")}
                    </h2>
                  </div>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                    {t("about.coreValues.subtitle")}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {values.map((value, index) => {
                    const IconComponent = value.icon;

                    return (
                      <div
                        key={value.title}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <Card className="group text-center hover:shadow-xl dark:hover:shadow-2xl card-hover border-0 bg-gradient-to-br from-card/90 to-muted/30 dark:from-card/95 dark:to-muted/40 glass backdrop-blur-sm relative overflow-hidden">
                          {/* Card Background Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          <CardContent className="relative p-6 lg:p-8">
                            <div className="relative mb-6">
                              {/* Icon Glow Effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                              <div
                                className={`relative size-20 bg-gradient-to-r ${value.colorScheme.gradient} rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl hover-child group-hover:scale-105 group-hover:rotate-6`}
                              >
                                <IconComponent className="size-10 text-white hover-child group-hover:scale-105" />
                              </div>
                            </div>

                            <h3 className="text-xl font-semibold text-foreground mb-4 gradient-text hover-child group-hover:scale-105">
                              {value.title}
                            </h3>

                            <p className="text-muted-foreground leading-relaxed text-base font-light group-hover:text-foreground/80 transition-colors duration-300">
                              {value.description}
                            </p>

                            {/* Decorative Element */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Journey Timeline Section */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-8 sm:py-12 md:py-16 bg-gradient-to-br from-muted/20 via-background to-primary/5 dark:from-muted/30 dark:via-background dark:to-primary/10 overflow-hidden">
            {/* Section Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent dark:from-primary/10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent dark:from-secondary/10"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 animate-fade-in-up">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                    <h2 className="relative text-3xl sm:text-4xl font-playfair font-semibold text-foreground mb-4 gradient-text">
                      {t("about.milestones.title")}
                    </h2>
                  </div>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                    {t("about.milestones.subtitle")}
                  </p>
                </div>

                <div className="relative">
                  {/* Enhanced Timeline Line */}
                  <div className="absolute left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-accent opacity-40 dark:opacity-60 rounded-full"></div>
                  <div className="absolute left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-secondary/20 to-accent/20 blur-sm"></div>

                  <div className="flex flex-col gap-y-8 sm:gap-y-10">
                    {milestones.map((milestone, index) => (
                      <div
                        key={milestone.year}
                        className="relative flex items-start gap-x-12 animate-fade-in-up"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        {/* Enhanced Timeline Node */}
                        <div className="flex-shrink-0 relative z-10">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-xl animate-pulse"></div>
                          <div className="relative size-16 bg-gradient-to-r from-primary via-primary/90 to-secondary rounded-full flex items-center justify-center shadow-lg interactive border-4 border-background/50 group">
                            <span className="text-white font-bold text-sm hover-child group-hover:scale-105">
                              {milestone.year}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-lg"></div>
                        </div>

                        {/* Enhanced Timeline Card */}
                        <div className="flex-1 min-w-0">
                          <Card className="group bg-gradient-to-br from-card/90 to-muted/30 dark:from-card/95 dark:to-muted/40 border-primary/30 dark:border-primary/40 glass backdrop-blur-sm hover:shadow-xl dark:hover:shadow-2xl card-hover relative overflow-hidden">
                            {/* Card Background Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <CardContent className="relative p-6">
                              <div className="flex items-center gap-x-4 mb-6">
                                <div className="size-3 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
                                <h3 className="text-2xl font-semibold text-foreground gradient-text hover-child group-hover:scale-105">
                                  {milestone.event}
                                </h3>
                              </div>
                              <p className="text-muted-foreground leading-relaxed text-lg font-light group-hover:text-foreground/80 transition-colors duration-300">
                                {milestone.description}
                              </p>

                              {/* Decorative Element */}
                              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Call to Action Section */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-amber-500 via-amber-400 to-amber-300 dark:from-amber-600 dark:via-amber-500 dark:to-amber-400 overflow-hidden">
            {/* Advanced Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-amber-300/20 dark:from-amber-500/30 dark:to-amber-400/30"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent"></div>
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white/8 to-transparent"></div>
            </div>
            {/* Subtle Floating Elements */}
            <div className="absolute top-20 left-20 size-40 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 size-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 size-24 bg-white/3 rounded-full blur-xl animate-pulse delay-500"></div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-7xl mx-auto text-center text-white">
                <div className="animate-fade-in-up">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-semibold mb-6 text-white drop-shadow-lg">
                    {t("about.legacy.title")}
                  </h2>
                </div>

                <div className="animate-fade-in-up delay-200">
                  <p className="text-lg sm:text-xl text-white/90 mb-12 leading-relaxed max-w-4xl mx-auto font-light">
                    {t("about.legacy.description")}
                  </p>
                </div>

                <div className="animate-fade-in-up delay-400">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12">
                    <Button
                      size="lg"
                      className="bg-amber-600 text-white hover:bg-amber-700 text-base px-8 py-3 rounded-xl shadow-lg hover:shadow-xl interactive font-semibold"
                    >
                      {t("navigation.bookConsultation")}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-amber-600 text-base px-8 py-3 rounded-xl shadow-lg hover:shadow-xl interactive font-semibold"
                    >
                      Free Health Assessment
                    </Button>
                  </div>
                </div>

                <div className="animate-fade-in-up delay-600">
                  <div className="flex flex-wrap justify-center gap-4 text-white/90">
                    <div className="flex items-center gap-x-3 bg-emerald-400 dark:bg-emerald-500 rounded-full px-6 py-3 shadow-md hover:shadow-lg interactive">
                      <CheckCircle className="size-6 text-emerald-700 dark:text-emerald-800" />
                      <span className="font-semibold text-white text-base">
                        Government Certified
                      </span>
                    </div>
                    <div className="flex items-center gap-x-3 bg-sky-400 dark:bg-sky-500 rounded-full px-6 py-3 shadow-md hover:shadow-lg interactive">
                      <Shield className="size-6 text-sky-700 dark:text-sky-800" />
                      <span className="font-semibold text-white text-base">
                        ISO 9001:2015
                      </span>
                    </div>
                    <div className="flex items-center gap-x-3 bg-rose-400 dark:bg-rose-500 rounded-full px-6 py-3 shadow-md hover:shadow-lg interactive">
                      <Award className="size-6 text-rose-700 dark:text-rose-800" />
                      <span className="font-semibold text-white text-base">
                        Teaching Hospital
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Clinic Information Section */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-8 sm:py-12 md:py-16 bg-gradient-to-br from-background via-muted/10 to-primary/5 dark:from-background dark:via-muted/20 dark:to-primary/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="animate-fade-in-up">
                <Suspense fallback={<SectionSkeleton />}>
                  <ClinicInfo
                    variant="full"
                    showDoctor={true}
                    showTimings={false}
                    showContact={false}
                  />
                </Suspense>
              </div>
            </div>
          </section>
        </LazySection>
      </div>
    </PageTransition>
  );
}

