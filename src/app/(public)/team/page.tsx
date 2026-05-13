"use client";

import { Suspense } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Award,
  Users,
  Star,
  CheckCircle,
  Globe,
  Heart,
  Brain,
  Shield,
  Crown,
  Flame,
  Stethoscope,
  BookOpen,
} from "lucide-react";

import { YouTubeVideoGrid } from "@/components/media/youtube-video";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { LazySection } from "@/components/ui/lazy-section";
import { SectionSkeleton } from "@/lib/dynamic-imports";
import { getIconColorScheme } from "@/lib/config/color-palette";

export default function TeamPage() {
  const { t } = useTranslation();

  const sampleVideos = [
    {
      id: "1",
      videoId: "dQw4w9WgXcQ",
      title: t("team.videos.panchakarma.title"),
      description: t("team.videos.panchakarma.description"),
    },
    {
      id: "2",
      videoId: "dQw4w9WgXcQ",
      title: t("team.videos.viddhakarma.title"),
      description: t("team.videos.viddhakarma.description"),
    },
    {
      id: "3",
      videoId: "dQw4w9WgXcQ",
      title: t("team.videos.agnikarma.title"),
      description: t("team.videos.agnikarma.description"),
    },
  ];

  const chiefMedicalOfficers = [
    {
      name: t("team.teamMembers.drDeshmukh.name"),
      title: t("team.teamMembers.drDeshmukh.title"),
      specialization: t("team.teamMembers.drDeshmukh.specialization"),
      experience: t("team.teamMembers.drDeshmukh.experience"),
      credentials: t("team.teamMembers.drDeshmukh.credentials"),
      achievements: t("team.teamMembers.drDeshmukh.achievements"),
      colorScheme: getIconColorScheme("Brain"),
      icon: Brain,
    },
    {
      name: t("team.teamMembers.vaidyaKrishnamurthy.name"),
      title: t("team.teamMembers.vaidyaKrishnamurthy.title"),
      specialization: t("team.teamMembers.vaidyaKrishnamurthy.specialization"),
      experience: t("team.teamMembers.vaidyaKrishnamurthy.experience"),
      credentials: t("team.teamMembers.vaidyaKrishnamurthy.credentials"),
      achievements: t("team.teamMembers.vaidyaKrishnamurthy.achievements"),
      colorScheme: getIconColorScheme("Flame"),
      icon: Flame,
    },
    {
      name: t("team.teamMembers.drPriyaSharma.name"),
      title: t("team.teamMembers.drPriyaSharma.title"),
      specialization: t("team.teamMembers.drPriyaSharma.specialization"),
      experience: t("team.teamMembers.drPriyaSharma.experience"),
      credentials: t("team.teamMembers.drPriyaSharma.credentials"),
      achievements: t("team.teamMembers.drPriyaSharma.achievements"),
      colorScheme: getIconColorScheme("Heart"),
      icon: Heart,
    },
    {
      name: "Dr. Sunita Patel",
      title: "Women's Health & Fertility Expert",
      specialization: "Reproductive Health Specialist",
      experience: "15+ years",
      credentials: ["BAMS", "Fertility Specialist", "Hormonal Balance Expert"],
      achievements: [
        "500+ successful pregnancies",
        "PCOD treatment expert",
        "Women wellness advocate",
      ],
      colorScheme: getIconColorScheme("Stethoscope"),
      icon: Stethoscope,
    },
  ];

  const advisoryBoard = [
    {
      name: t("team.advisoryBoard.drAshokKumar.name"),
      title: t("team.advisoryBoard.drAshokKumar.title"),
      role: t("team.advisoryBoard.drAshokKumar.role"),
      expertise: t("team.advisoryBoard.drAshokKumar.expertise"),
    },
    {
      name: t("team.advisoryBoard.drMeeraJoshi.name"),
      title: t("team.advisoryBoard.drMeeraJoshi.title"),
      role: t("team.advisoryBoard.drMeeraJoshi.role"),
      expertise: t("team.advisoryBoard.drMeeraJoshi.expertise"),
    },
    {
      name: t("team.advisoryBoard.drJamesWilson.name"),
      title: t("team.advisoryBoard.drJamesWilson.title"),
      role: t("team.advisoryBoard.drJamesWilson.role"),
      expertise: t("team.advisoryBoard.drJamesWilson.expertise"),
    },
    {
      name: t("team.advisoryBoard.drRaviGupta.name"),
      title: t("team.advisoryBoard.drRaviGupta.title"),
      role: t("team.advisoryBoard.drRaviGupta.role"),
      expertise: t("team.advisoryBoard.drRaviGupta.expertise"),
    },
  ];

  const teamStats = [
    {
      number: t("team.teamStats.experience.value"),
      label: t("team.teamStats.experience.label"),
      icon: Crown,
      colorScheme: getIconColorScheme("Crown"),
      description: "Decades of combined expertise",
    },
    {
      number: t("team.teamStats.patients.value"),
      label: t("team.teamStats.patients.label"),
      icon: Users,
      colorScheme: getIconColorScheme("Users"),
      description: "Lives transformed through healing",
    },
    {
      number: t("team.teamStats.publications.value"),
      label: t("team.teamStats.publications.label"),
      icon: BookOpen,
      colorScheme: getIconColorScheme("BookOpen"),
      description: "Research contributions to Ayurveda",
    },
    {
      number: t("team.teamStats.conferences.value"),
      label: t("team.teamStats.conferences.label"),
      icon: Globe,
      colorScheme: getIconColorScheme("Globe"),
      description: "International recognition",
    },
  ];

  const renderList = (value: string | string[]) =>
    Array.isArray(value) ? value.join(" | ") : value;

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
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-none">
                  <Users className="mr-2 h-4 w-4" />
                  {t("team.badge")}
                </Badge>
                <h1 className="max-w-5xl font-playfair text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {t("team.title")}
                </h1>
                <p className="mt-6 max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-xl">
                  {t("team.description")}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <Shield className="mr-2 h-4 w-4 text-primary" />
                    Government Certified
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <BookOpen className="mr-2 h-4 w-4 text-primary" />
                    Published Researchers
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <Award className="mr-2 h-4 w-4 text-primary" />
                    Certified Teachers
                  </div>
                </div>
              </div>

              <Card className="border-border/70 bg-card/96 shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
                <CardContent className="p-6 sm:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    Clinical leadership
                  </p>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    Senior practitioners, focused specialists, and advisory
                    voices working together across patient care, education,
                    and treatment quality.
                  </p>
                  <div className="mt-6 grid gap-3">
                    {teamStats.slice(0, 3).map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/35 px-4 py-3"
                      >
                        <span className="text-sm text-muted-foreground">
                          {stat.label}
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {stat.number}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    Team strength
                  </p>
                  <h2 className="mt-4 font-playfair text-3xl font-bold sm:text-4xl">
                    Our Excellence in Numbers
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                    Quantifying the depth of experience behind the care model.
                  </p>
                </div>

                <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {teamStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card
                        key={stat.label}
                        className="border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <CardContent className="p-6">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.colorScheme.gradient}`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="mt-5 text-3xl font-bold text-foreground">
                            {stat.number}
                          </div>
                          <div className="mt-1 text-sm font-medium text-foreground">
                            {stat.label}
                          </div>
                          <p className="mt-3 text-sm leading-7 text-muted-foreground">
                            {stat.description}
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
          <section className="border-y border-border/70 bg-muted/25 py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    Medical leadership
                  </p>
                  <h2 className="mt-4 font-playfair text-3xl font-bold sm:text-4xl">
                    Chief Medical Officers
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                    Leading experts in their respective specializations,
                    bringing decades of combined experience.
                  </p>
                </div>

                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  {chiefMedicalOfficers.map((doctor) => {
                    const Icon = doctor.icon;
                    return (
                      <Card
                        key={doctor.name}
                        className="overflow-hidden border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <CardContent className="grid gap-0 p-0 md:grid-cols-[180px_1fr]">
                          <div className="flex flex-col items-center justify-center border-b border-border/70 bg-muted/35 p-6 md:border-b-0 md:border-r">
                            <div
                              className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${doctor.colorScheme.gradient}`}
                            >
                              <Icon className="h-9 w-9 text-white" />
                            </div>
                            <div className="mt-5 text-center">
                              <div className="text-lg font-bold text-foreground">
                                {doctor.experience}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Experience
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="font-playfair text-2xl font-bold text-foreground">
                              {doctor.name}
                            </h3>
                            <p className="mt-2 text-base font-medium text-muted-foreground">
                              {doctor.title}
                            </p>
                            <Badge className="mt-4 border-primary/20 bg-primary/10 text-primary shadow-none">
                              {doctor.specialization}
                            </Badge>
                            <div className="mt-5 grid gap-4">
                              <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                  Credentials
                                </div>
                                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                  {renderList(doctor.credentials)}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                  <Star className="h-4 w-4 text-primary" />
                                  Key Achievements
                                </div>
                                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                  {renderList(doctor.achievements)}
                                </p>
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

        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    Advisory board
                  </p>
                  <h2 className="mt-4 font-playfair text-3xl font-bold sm:text-4xl">
                    {t("team.advisoryBoard.title")}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                    {t("team.advisoryBoard.subtitle")}
                  </p>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-2">
                  {advisoryBoard.map((advisor) => (
                    <Card
                      key={advisor.name}
                      className="border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-foreground">
                              {advisor.name}
                            </CardTitle>
                            <p className="mt-1 text-sm font-medium text-muted-foreground">
                              {advisor.title}
                            </p>
                            <Badge className="mt-3 border-primary/20 bg-primary/10 text-primary shadow-none">
                              {advisor.role}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-sm leading-7 text-muted-foreground">
                          {advisor.expertise}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="border-y border-primary/20 bg-primary/[0.96] py-16 text-primary-foreground sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="font-playfair text-3xl font-bold sm:text-4xl">
                    {t("team.cta.title")}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-primary-foreground/85 sm:text-lg">
                    {t("team.cta.subtitle")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-primary-foreground/75 sm:text-base">
                    {t("team.cta.description")}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    {t("team.cta.bookConsultation")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    {t("team.cta.scheduleMeeting")}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="bg-muted/25 py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    Treatment demonstrations
                  </p>
                  <h2 className="mt-4 font-playfair text-3xl font-bold sm:text-4xl">
                    {t("team.videos.title")}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                    {t("team.videos.subtitle")}
                  </p>
                </div>

                <div className="mt-10">
                  <Suspense fallback={<SectionSkeleton />}>
                    <YouTubeVideoGrid
                      videos={sampleVideos}
                      columns={3}
                      aspectRatio="16:9"
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </section>
        </LazySection>
      </div>
    </PageTransition>
  );
}
