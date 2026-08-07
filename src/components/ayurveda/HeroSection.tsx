"use client";

import { useReducer, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  HoverAnimation,
  CounterAnimation,
  Parallax,
} from "@/components/ui/animated-wrapper";
import {
  Play,
  Star,
  Award,
  Phone,
  MessageCircle,
  CheckCircle,
  TrendingUp,
  Clock,
  Users,
  Shield,
  Sparkles,
  Heart,
  Zap,
  ArrowRight,
  Leaf,
  Quote,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

type HeroState = {
  currentTestimonial: number;
  liveCount: number;
};

type HeroAction = {
  type: "tick";
  testimonialCount: number;
  liveDelta: number;
};

function heroReducer(state: HeroState, action: HeroAction): HeroState {
  switch (action.type) {
    case "tick":
      return {
        currentTestimonial:
          (state.currentTestimonial + 1) % action.testimonialCount,
        liveCount: state.liveCount + action.liveDelta,
      };
    default:
      return state;
  }
}

const HeroSection = () => {
  const { t } = useTranslation();
  const [{ currentTestimonial, liveCount }, dispatch] = useReducer(heroReducer, {
    currentTestimonial: 0,
    liveCount: 147,
  });

  const testimonials = [
    t("hero.testimonials.0"),
    t("hero.testimonials.1"),
    t("hero.testimonials.2"),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({
        type: "tick",
        testimonialCount: testimonials.length,
        liveDelta: Math.floor(Math.random() * 3) - 1,
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden">
      {/* ===================== PREMIUM BACKGROUND ===================== */}
      <div className="absolute inset-0 z-0">
        {/* Base Canvas */}
        <div className="absolute inset-0 bg-background" />

        {/* Ambient radial gradients for depth */}
        <div className="absolute -top-32 -left-32 size-[34rem] rounded-full bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -right-24 size-[38rem] rounded-full bg-gradient-to-tl from-orange-400/15 via-amber-300/10 to-transparent blur-3xl" />
        <div className="absolute top-1/3 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-300/10 to-teal-200/10 blur-3xl" />

        {/* Animated gradient sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/20 dark:from-background dark:via-background/95 dark:to-muted/30" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/4 to-orange-300/8 dark:via-primary/5 dark:to-orange-900/10" />

        {/* Subtle geometric mandala pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23059669%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M30%2030c0-8.284-6.716-15-15-15s-15%206.716-15%2015%206.716%2015%2015%2015%2015-6.716%2015-15zm0%200c0%208.284%206.716%2015%2015%2015s15-6.716%2015-15-6.716-15-15-15-15%206.716-15%2015z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        </div>

        {/* Floating aurora orbs */}
        <div className="absolute top-10 left-6 sm:top-24 sm:left-12 size-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 bg-gradient-to-br from-primary/20 to-emerald-300/25 dark:from-primary/30 dark:to-emerald-500/25 rounded-full blur-3xl animate-floating" />
        <div className="absolute bottom-12 right-4 sm:bottom-24 sm:right-12 size-32 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-gradient-to-tr from-orange-400/20 to-amber-200/25 dark:from-orange-500/25 dark:to-amber-500/20 rounded-full blur-3xl animate-floating [animation-delay:1.2s]" />
        <div className="absolute top-1/2 left-1/6 size-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 bg-gradient-to-br from-teal-300/15 to-emerald-200/20 dark:from-teal-500/20 dark:to-emerald-500/15 rounded-full blur-2xl animate-floating [animation-delay:2s]" />
        <div className="absolute top-1/4 right-1/4 size-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-amber-300/20 to-orange-300/20 dark:from-amber-500/25 dark:to-orange-500/20 rounded-full blur-xl animate-pulse-soft" />
        <div className="absolute bottom-1/3 left-1/3 size-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary/15 to-teal-300/20 dark:from-primary/25 dark:to-teal-500/20 rounded-full blur-2xl animate-pulse-soft [animation-delay:0.8s]" />

        {/* Fine grid overlay */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M0%200h40v1H0zM0%200v40h1V0z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        </div>
      </div>

      <div className="container mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 sm:gap-12 lg:gap-14 items-center">
          {/* ===================== LEFT CONTENT ===================== */}
          <div className="text-center lg:text-left lg:col-span-2 py-10 sm:py-14 lg:py-16">
            {/* Premium eyebrow / trust row */}
            <ScrollReveal direction="up" delay={0.05}>
              <StaggerContainer
                className="flex flex-wrap justify-center lg:justify-start gap-2.5 sm:gap-3 mb-8 sm:mb-10"
                staggerDelay={0.06}
              >
                <StaggerItem>
                  <HoverAnimation type="scale">
                    <Badge className="glass interactive px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium rounded-full border text-green-700 dark:text-green-300 bg-green-50/80 dark:bg-green-900/20 border-green-200/80 dark:border-green-700/70 shadow-sm">
                      <CheckCircle className="size-3 sm:size-3.5 mr-1.5" />
                      <span className="hidden xs:inline">
                        {t("hero.trustIndicators.governmentCertified")}
                      </span>
                      <span className="xs:hidden">{t("hero.govCertified")}</span>
                    </Badge>
                  </HoverAnimation>
                </StaggerItem>
                <StaggerItem>
                  <HoverAnimation type="scale">
                    <Badge className="glass interactive px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium rounded-full border text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/80 dark:border-blue-700/70 shadow-sm">
                      <Award className="size-3 sm:size-3.5 mr-1.5" />
                      <span className="hidden xs:inline">
                        {t("hero.trustIndicators.iso9001")}
                      </span>
                      <span className="xs:hidden">{t("hero.iso9001Short")}</span>
                    </Badge>
                  </HoverAnimation>
                </StaggerItem>
                <StaggerItem>
                  <HoverAnimation type="scale">
                    <Badge className="glass interactive px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium rounded-full border text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/80 dark:border-amber-700/70 shadow-sm">
                      <Star className="size-3 sm:size-3.5 mr-1.5 fill-amber-500 text-amber-500" />
                      <span className="hidden xs:inline">
                        {t("hero.trustIndicators.rating")}
                      </span>
                      <span className="xs:hidden">{t("hero.ratingShort")}</span>
                    </Badge>
                  </HoverAnimation>
                </StaggerItem>
              </StaggerContainer>
            </ScrollReveal>

            {/* Main Headline */}
            <ScrollReveal direction="up" delay={0.1}>
              <div className="mb-8 sm:mb-10">
                <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold leading-[1.05] tracking-tight">
                  <div className="block text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">
                    {t("hero.title1")}
                  </div>
                  <div className="block gradient-text-warning mb-2 sm:mb-3">
                    {t("hero.title2")}
                  </div>
                  <div className="block text-slate-800 dark:text-slate-200">
                    {t("hero.title")}
                  </div>
                </h1>

                {/* Refined subtitle */}
                <div className="mt-6 sm:mt-8">
                  <p className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl text-foreground font-semibold leading-snug">
                    {t("hero.transformHealth")}{" "}
                    <span className="gradient-text-success font-bold">
                      {t("hero.ancientWisdom")}
                    </span>
                  </p>
                </div>

                {/* Decorative divider */}
                <div className="flex items-center justify-center lg:justify-start gap-x-4 sm:gap-x-5 mt-7 sm:mt-9">
                  <div className="h-1 sm:h-1.5 w-12 sm:w-16 lg:w-20 bg-gradient-to-r from-primary to-emerald-500 rounded-full" />
                  <span className="relative flex items-center justify-center">
                    <Sparkles className="size-5 sm:size-6 lg:size-7 text-amber-500 animate-pulse" />
                    <span className="absolute size-8 sm:size-9 lg:size-10 rounded-full bg-amber-400/10 animate-ping" />
                  </span>
                  <div className="h-1 sm:h-1.5 w-12 sm:w-16 lg:w-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                </div>
              </div>
            </ScrollReveal>

            {/* Subheadline */}
            <ScrollReveal direction="up" delay={0.2}>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-600 dark:text-slate-300 mb-8 sm:mb-10 lg:mb-12 leading-relaxed max-w-3xl mx-auto lg:mx-0 text-center lg:text-left font-medium">
                {t("hero.description")}
              </p>
            </ScrollReveal>

            {/* Key Benefits */}
            <ScrollReveal direction="up" delay={0.3}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto lg:mx-0 justify-center lg:justify-start">
                <div className="glass card-hover group flex items-center gap-x-3.5 p-4 sm:p-5 rounded-2xl border border-border/50">
                  <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                    <Clock className="size-5 sm:size-6 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">
                    {t("hero.benefits.yearsExperience")}
                  </span>
                </div>
                <div className="glass card-hover group flex items-center gap-x-3.5 p-4 sm:p-5 rounded-2xl border border-border/50">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/15 group-hover:scale-110 transition-all duration-300">
                    <Users className="size-5 sm:size-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">
                    {t("hero.benefits.patientsHealed")}
                  </span>
                </div>
                <div className="glass card-hover group flex items-center gap-x-3.5 p-4 sm:p-5 rounded-2xl border border-border/50 sm:col-span-2 lg:col-span-1">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 group-hover:bg-teal-500/15 group-hover:scale-110 transition-all duration-300">
                    <Shield className="size-5 sm:size-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">
                    {t("hero.benefits.governmentCertified")}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Live Social Proof */}
            <ScrollReveal direction="up" delay={0.4}>
              <HoverAnimation type="lift">
                <div className="glass-dark card-hover rounded-2xl p-7 sm:p-9 lg:p-10 mb-10 sm:mb-12 lg:mb-14 shadow-minimal-lg border border-border/40">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-x-3">
                      <div className="relative">
                        <div className="size-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 size-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-75" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-base">
                        {t("hero.trustIndicators.liveActivity")}
                      </span>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 px-3 py-1">
                      <TrendingUp className="size-4 mr-2" />
                      {t("hero.trustIndicators.highDemand")}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Quote className="absolute -top-1 -left-1 size-5 text-primary/20" />
                    <div
                      className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4 font-medium pl-6"
                      key={currentTestimonial}
                    >
                      &ldquo;{testimonials[currentTestimonial]}&rdquo;
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      <CounterAnimation
                        from={100}
                        to={liveCount}
                        suffix={` ${t("hero.peopleViewingText")}`}
                      />
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {t("hero.bookingsIncreasedText")}
                    </span>
                  </div>
                </div>
              </HoverAnimation>
            </ScrollReveal>

            {/* Primary & Secondary CTA */}
            <StaggerContainer
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 lg:gap-6 justify-center lg:justify-start"
              staggerDelay={0.15}
            >
              <StaggerItem>
                <HoverAnimation type="glow">
                  <div className="relative group">
                    <Button
                      size="lg"
                      className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-primary to-teal-600 hover:from-emerald-700 hover:via-primary hover:to-teal-700 text-white font-bold text-lg sm:text-xl lg:text-2xl px-8 sm:px-10 lg:px-12 py-5 sm:py-6 lg:py-7 rounded-2xl shadow-glow-medium hover:shadow-glow-strong transition-all duration-300 border-0 w-full sm:w-auto"
                      onClick={() => (window.location.href = "/drdeshmukh")}
                    >
                      {/* Animated gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-primary to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                      <div className="relative z-10 flex items-center justify-center gap-x-2.5 sm:gap-x-3">
                        <div className="text-lg sm:text-xl animate-pulse">🔥</div>
                        <span className="font-semibold">
                          {t("hero.primaryCta")}
                        </span>
                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Button>
                  </div>
                </HoverAnimation>
              </StaggerItem>

              <StaggerItem>
                <HoverAnimation type="scale">
                  <div className="relative group">
                    <Button
                      variant="outline"
                      size="lg"
                      className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-primary/30 dark:border-primary/40 text-primary hover:bg-primary/5 dark:hover:bg-primary/15 hover:border-primary font-semibold text-lg sm:text-xl lg:text-2xl px-8 sm:px-10 lg:px-12 py-5 sm:py-6 lg:py-7 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                    >
                      <div className="flex items-center justify-center gap-x-2.5 sm:gap-x-3">
                        <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                          <Phone className="size-4 sm:size-5 text-primary" />
                        </div>
                        <span className="font-medium">
                          {t("hero.secondaryCta")}
                        </span>
                      </div>
                    </Button>
                  </div>
                </HoverAnimation>
              </StaggerItem>
            </StaggerContainer>

            {/* Secondary Actions */}
            <StaggerContainer
              className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 lg:gap-5 mt-7 sm:mt-9"
              staggerDelay={0.08}
            >
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Button
                    variant="ghost"
                    className="group relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-blue-900 dark:text-blue-50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 px-5 py-3.5 sm:py-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-x-2">
                      <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-300">
                        <Play className="size-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm sm:text-base font-semibold">
                        {t("hero.watchJourneysText")}
                      </span>
                    </div>
                  </Button>
                </HoverAnimation>
              </StaggerItem>
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Button
                    variant="ghost"
                    className="group relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-amber-900 dark:text-amber-50 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-300 px-5 py-3.5 sm:py-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-x-2">
                      <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/30 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-sm">🏥</span>
                      </div>
                      <span className="text-sm sm:text-base font-semibold">
                        {t("hero.virtualTourText")}
                      </span>
                    </div>
                  </Button>
                </HoverAnimation>
              </StaggerItem>
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Button
                    variant="ghost"
                    className="group relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-green-900 dark:text-green-50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-300 px-5 py-3.5 sm:py-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-x-2">
                      <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-sm">📋</span>
                      </div>
                      <span className="text-sm sm:text-base font-semibold">
                        {t("hero.healthAssessmentText")}
                      </span>
                    </div>
                  </Button>
                </HoverAnimation>
              </StaggerItem>
            </StaggerContainer>
          </div>

          {/* ===================== RIGHT VISUAL ===================== */}
          <div className="relative lg:col-span-1 pt-2 sm:pt-4 lg:pt-8">
            {/* Quick benefits pills */}
            <ScrollReveal direction="right" delay={0.2}>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2.5 sm:gap-3 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
                <div className="glass interactive flex items-center gap-x-2 px-3 py-2 rounded-full text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/70 shadow-sm">
                  <div className="status-dot online" />
                  <span className="text-xs font-medium">
                    {t("hero.natural")}
                  </span>
                </div>
                <div className="glass interactive flex items-center gap-x-2 px-3 py-2 rounded-full text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/70 shadow-sm">
                  <div className="status-dot online" />
                  <span className="text-xs font-medium">
                    {t("hero.noSideEffects")}
                  </span>
                </div>
                <div className="glass interactive flex items-center gap-x-2 px-3 py-2 rounded-full text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/70 shadow-sm">
                  <div className="status-dot online" />
                  <span className="text-xs font-medium">
                    {t("hero.provenResults")}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Main Visual Card */}
            <ScrollReveal direction="right" delay={0.3}>
              <Card className="glass-dark card-hover shadow-minimal-lg overflow-hidden border border-border/40">
                <CardContent className="p-0">
                  {/* Hero Visual */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-50 via-amber-50 to-orange-50 dark:from-emerald-900/30 dark:via-amber-900/30 dark:to-orange-900/30 flex items-center justify-center overflow-hidden">
                    {/* Mandala pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23059669%22%20fill-opacity%3D%220.3%22%3E%3Cpath%20d%3D%22M20%2020c0-5.5-4.5-10-10-10s-10%204.5-10%2010%204.5%2010%2010%2010%2010-4.5%2010-10zm0%200c0%205.5%204.5%2010%2010%2010s10-4.5%2010-10-4.5-10-10-10-10%204.5-10%2010z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

                    {/* Rotating aura ring */}
                    <div className="absolute size-40 sm:size-44 lg:size-48 rounded-full border border-emerald-400/20 dark:border-emerald-500/20 animate-spin [animation-duration:18s]">
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <div className="absolute size-28 sm:size-32 lg:size-36 rounded-full border-2 border-dashed border-amber-400/30 dark:border-amber-500/30" />

                    {/* Center emblem */}
                    <div className="text-center relative z-10 p-3">
                      <Parallax offset={12}>
                        <div className="relative group">
                          <div className="absolute inset-0 size-16 sm:size-20 rounded-full bg-gradient-to-br from-emerald-500/30 to-amber-500/30 blur-xl" />
                          <div className="relative size-16 sm:size-20 bg-gradient-to-br from-emerald-200 to-amber-200 dark:from-emerald-800 dark:to-amber-800 rounded-full flex items-center justify-center mb-3 mx-auto shadow-xl hover:scale-110 transition-transform duration-500">
                            <span className="text-3xl sm:text-4xl">🕉️</span>
                          </div>
                        </div>
                      </Parallax>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {t("hero.ayurvedicWisdomText")}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 px-1 text-xs leading-relaxed">
                        {t("hero.discoverAncient")}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 p-3.5 sm:p-4">
                    <div className="glass card-hover group text-center p-2.5 sm:p-3 rounded-xl medical-green border border-green-200/60 dark:border-green-700/40">
                      <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                        5000+
                      </div>
                      <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        {t("stats.livesTransformed")}
                      </div>
                    </div>
                    <div className="glass card-hover group text-center p-2.5 sm:p-3 rounded-xl medical-blue border border-blue-200/60 dark:border-blue-700/40">
                      <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                        20+
                      </div>
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {t("stats.yearsLegacy")}
                      </div>
                    </div>
                    <div className="glass card-hover group text-center p-2.5 sm:p-3 rounded-xl medical-yellow border border-yellow-200/60 dark:border-yellow-700/40">
                      <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 mb-0.5">
                        95%
                      </div>
                      <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Success Rate
                      </div>
                    </div>
                    <div className="glass card-hover group text-center p-2.5 sm:p-3 rounded-xl medical-blue border border-blue-200/60 dark:border-blue-700/40">
                      <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                        4.9<span className="text-amber-500">★</span>
                      </div>
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Patient Rating
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Floating decorative badges */}
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white p-2 sm:p-2.5 rounded-full shadow-lg animate-bounce-subtle hover:scale-110 transition-transform duration-300">
              <MessageCircle className="size-3 sm:size-4" />
            </div>
            <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-2 sm:p-2.5 rounded-full shadow-lg animate-bounce-subtle [animation-delay:0.4s] hover:scale-110 transition-transform duration-300">
              <Award className="size-3 sm:size-4" />
            </div>
            <div className="absolute top-1/4 -left-1 sm:-left-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 sm:p-2.5 rounded-full shadow-lg animate-bounce-subtle [animation-delay:0.8s] hover:scale-110 transition-transform duration-300">
              <Heart className="size-3 sm:size-4" />
            </div>
            <div className="absolute bottom-1/4 -right-1 sm:-right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-2 sm:p-2.5 rounded-full shadow-lg animate-bounce-subtle [animation-delay:1.2s] hover:scale-110 transition-transform duration-300">
              <Zap className="size-3 sm:size-4" />
            </div>
            <div className="absolute top-1/2 -right-2 sm:-right-3 hidden sm:flex bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 p-2 rounded-full shadow-lg border border-emerald-200 dark:border-emerald-700/50 animate-floating">
              <Leaf className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
