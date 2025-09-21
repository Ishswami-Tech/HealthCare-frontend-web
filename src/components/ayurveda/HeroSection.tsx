"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  HoverAnimation,
  CounterAnimation,
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
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

const HeroSection = () => {
  const { t } = useTranslation();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [liveCount, setLiveCount] = useState(147);

  const testimonials = [
    t("hero.testimonials.0"),
    t("hero.testimonials.1"),
    t("hero.testimonials.2"),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setLiveCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden">
      {/* Attractive Background with Elegant Gradients and Patterns */}
      <div className="absolute inset-0 z-0">
        {/* Base Background */}
        <div className="absolute inset-0 bg-background" />

        {/* Elegant Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/20 dark:from-background dark:via-background/95 dark:to-muted/30" />

        {/* Secondary Gradient for Depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/3 to-secondary/8 dark:via-primary/5 dark:to-secondary/12" />

        {/* Subtle Geometric Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M30%2030c0-8.284-6.716-15-15-15s-15%206.716-15%2015%206.716%2015%2015%2015%2015-6.716%2015-15zm0%200c0%208.284%206.716%2015%2015%2015s15-6.716%2015-15-6.716-15-15-15-15%206.716-15%2015z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        </div>

        {/* Floating Orbs with Attractive Colors */}
        <div className="absolute top-10 left-4 sm:top-20 sm:left-10 w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gradient-to-r from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 rounded-full blur-2xl animate-pulse-soft" />
        <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-10 w-24 h-24 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-gradient-to-r from-secondary/15 to-secondary/25 dark:from-secondary/25 dark:to-secondary/35 rounded-full blur-2xl animate-pulse-soft" />
        <div className="absolute top-1/2 left-1/6 sm:left-1/4 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 rounded-full blur-xl animate-pulse-soft" />

        {/* Additional Floating Elements for Richness */}
        <div className="absolute top-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-primary/15 to-secondary/20 dark:from-primary/25 dark:to-secondary/30 rounded-full blur-lg animate-pulse-soft" />
        <div className="absolute bottom-1/3 left-1/3 w-14 h-14 sm:w-18 sm:h-18 lg:w-24 lg:h-24 bg-gradient-to-r from-accent/12 to-primary/18 dark:from-accent/22 dark:to-primary/28 rounded-full blur-lg animate-pulse-soft" />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02]">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M0%200h40v1H0zM0%200v40h1V0z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        </div>
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10 ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-16 items-center">
          {/* Left Content - Takes up 2/3 of the space */}
          <div className="text-center lg:text-left lg:col-span-2 pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 lg:pb-16">
            {/* Compact Trust Indicators - Moved to right side */}

            {/* Enhanced Main Headline with Responsive Typography */}
            <ScrollReveal direction="up">
              <div className="space-y-4 mt-8 sm:space-y-5 lg:space-y-6 mb-8 sm:mb-10 lg:mb-12 text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                  <div className="block text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">
                    {t("hero.title1")}
                  </div>
                  <div className="block bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 dark:from-orange-400 dark:via-amber-400 dark:to-yellow-400 bg-clip-text text-transparent mb-2 sm:mb-3">
                    {t("hero.title2")}
                  </div>
                  <div className="block text-slate-800 dark:text-slate-200">
                    {t("hero.title")}
                  </div>
                </h1>

                {/* Enhanced Subtitle */}
                <div className="mt-6 sm:mt-8 lg:mt-10">
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground font-semibold leading-relaxed">
                    {t("hero.transformHealth")}{" "}
                    <span className="gradient-text-success font-bold">
                      {t("hero.ancientWisdom")}
                    </span>
                  </p>
                </div>

                {/* Responsive Decorative Elements */}
                <div className="flex items-center justify-center lg:justify-start space-x-4 sm:space-x-5 lg:space-x-8 mt-6 sm:mt-8 lg:mt-10">
                  <div className="h-1 sm:h-1.5 w-12 sm:w-16 lg:w-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-amber-500 animate-pulse" />
                  <div className="h-1 sm:h-1.5 w-12 sm:w-16 lg:w-20 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" />
                </div>
              </div>
            </ScrollReveal>

            {/* Enhanced Subheadline - Responsive */}
            <ScrollReveal direction="up" delay={0.3}>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-600 dark:text-slate-300 mb-8 sm:mb-10 lg:mb-12 leading-relaxed max-w-3xl mx-auto lg:mx-0 text-center lg:text-left font-medium">
                {t("hero.description")}
              </p>
            </ScrollReveal>

            {/* Compact Key Benefits */}
            <ScrollReveal direction="up" delay={0.4}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto lg:mx-0 justify-center lg:justify-start">
                <div className="glass card-hover group flex items-center space-x-4 p-4 sm:p-5 lg:p-6 rounded-xl border border-border/50">
                  <div className="p-2 rounded-md bg-muted/50 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    {t("hero.benefits.yearsExperience")}
                  </span>
                </div>
                <div className="glass card-hover group flex items-center space-x-4 p-4 sm:p-5 lg:p-6 rounded-xl border border-border/50">
                  <div className="p-2 rounded-md bg-muted/50 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    {t("hero.benefits.patientsHealed")}
                  </span>
                </div>
                <div className="glass card-hover group flex items-center space-x-4 p-4 sm:p-5 lg:p-6 rounded-xl sm:col-span-2 lg:col-span-1 border border-border/50">
                  <div className="p-2 rounded-md bg-muted/50 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    {t("hero.benefits.governmentCertified")}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Enhanced Live Social Proof */}
            <ScrollReveal direction="up" delay={0.5}>
              <HoverAnimation type="lift">
                <div className="glass-dark card-hover rounded-2xl p-8 sm:p-10 lg:p-12 mb-10 sm:mb-12 lg:mb-16 shadow-minimal-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-75" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-base">
                        {t("hero.trustIndicators.liveActivity")}
                      </span>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 px-3 py-1">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {t("hero.trustIndicators.highDemand")}
                    </Badge>
                  </div>
                  <div
                    className="text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium"
                    key={currentTestimonial}
                  >
                    &ldquo;{testimonials[currentTestimonial]}&rdquo;
                  </div>
                  <div className="flex items-center justify-between text-sm">
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

            {/* Enhanced Action Buttons */}
            <StaggerContainer
              className="flex flex-col sm:flex-row gap-6 sm:gap-8 lg:gap-10 justify-center lg:justify-start"
              staggerDelay={0.2}
            >
              <StaggerItem>
                <HoverAnimation type="glow">
                  <div className="relative group">
                    <Button
                      size="lg"
                      className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-bold text-lg sm:text-xl lg:text-2xl px-10 sm:px-12 lg:px-16 py-5 sm:py-6 lg:py-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                    >
                      {/* Animated Background Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                      <div className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
                        <div className="text-lg sm:text-xl animate-pulse">
                          🔥
                        </div>
                        <span className="font-semibold">
                          {t("hero.primaryCta")}
                        </span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
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
                      className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 font-semibold text-lg sm:text-xl lg:text-2xl px-10 sm:px-12 lg:px-16 py-5 sm:py-6 lg:py-8 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 group-hover:scale-110 transition-transform duration-300">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
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

            {/* Enhanced Secondary Actions */}
            <StaggerContainer
              className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-5 lg:gap-8 mt-8 sm:mt-10 lg:mt-12"
              staggerDelay={0.1}
            >
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Button
                    variant="ghost"
                    className="group relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 px-6 py-4 sm:py-5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-base font-semibold">
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
                    className="group relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-300 px-6 py-4 sm:py-5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/30 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-sm">🏥</span>
                      </div>
                      <span className="text-base font-semibold">
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
                    className="group relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-300 px-6 py-4 sm:py-5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-sm">📋</span>
                      </div>
                      <span className="text-base font-semibold">
                        {t("hero.healthAssessmentText")}
                      </span>
                    </div>
                  </Button>
                </HoverAnimation>
              </StaggerItem>
            </StaggerContainer>
          </div>

          {/* Enhanced Right Content - Visual - Takes up 1/3 of the space */}
          <div className="relative lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8 pt-4 sm:pt-6 lg:pt-8">
            {/* Trust Indicators - Moved from left */}
            <StaggerContainer className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 lg:gap-4">
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Badge className="glass interactive px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium rounded-full border text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    <span className="hidden xs:inline">
                      {t("hero.trustIndicators.governmentCertified")}
                    </span>
                    <span className="xs:hidden">{t("hero.govCertified")}</span>
                  </Badge>
                </HoverAnimation>
              </StaggerItem>
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Badge className="glass interactive px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium rounded-full border text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    <span className="hidden xs:inline">
                      {t("hero.trustIndicators.iso9001")}
                    </span>
                    <span className="xs:hidden">{t("hero.iso9001Short")}</span>
                  </Badge>
                </HoverAnimation>
              </StaggerItem>
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Badge className="glass interactive px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium rounded-full border text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    <span className="hidden xs:inline">
                      {t("hero.trustIndicators.rating")}
                    </span>
                    <span className="xs:hidden">{t("hero.ratingShort")}</span>
                  </Badge>
                </HoverAnimation>
              </StaggerItem>
            </StaggerContainer>

            {/* Quick Benefits List - Moved from left */}
            <ScrollReveal direction="up" delay={0.35}>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 lg:gap-5 max-w-2xl mx-auto lg:mx-0">
                <div className="glass interactive flex items-center space-x-2 px-3 py-2 rounded-full text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                  <div className="status-dot online" />
                  <span className="text-xs font-medium">
                    {t("hero.natural")}
                  </span>
                </div>
                <div className="glass interactive flex items-center space-x-2 px-3 py-2 rounded-full text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                  <div className="status-dot online" />
                  <span className="text-xs font-medium">
                    {t("hero.noSideEffects")}
                  </span>
                </div>
                <div className="glass interactive flex items-center space-x-2 px-3 py-2 rounded-full text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                  <div className="status-dot online" />
                  <span className="text-xs font-medium">
                    {t("hero.provenResults")}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Main Visual Card */}
            <Card className="glass-dark card-hover shadow-minimal-lg overflow-hidden">
              <CardContent className="p-0">
                {/* Hero Visual Section */}
                <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-yellow-900/30 flex items-center justify-center relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23f97316%22%20fill-opacity%3D%220.3%22%3E%3Cpath%20d%3D%22M20%2020c0-5.5-4.5-10-10-10s-10%204.5-10%2010%204.5%2010%2010%2010%2010-4.5%2010-10zm0%200c0%205.5%204.5%2010%2010%2010s10-4.5%2010-10-4.5-10-10-10-10%204.5-10%2010z%22/%3E%3C/g%3E%3C/svg%3E')]" />

                  <div className="text-center relative z-10 p-3">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 rounded-full flex items-center justify-center mb-3 mx-auto shadow-xl hover:scale-110 transition-transform duration-500">
                      <span className="text-2xl sm:text-3xl">🕉️</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {t("hero.ayurvedicWisdomText")}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 px-1 text-xs leading-relaxed">
                      {t("hero.discoverAncient")}
                    </p>
                  </div>
                </div>

                {/* Enhanced Stats Grid - More Compact */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-3 sm:p-4">
                  <div className="glass card-hover group text-center p-2 sm:p-3 rounded-lg medical-green">
                    <div className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent mb-0.5">
                      5000+
                    </div>
                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {t("stats.livesTransformed")}
                    </div>
                  </div>
                  <div className="glass card-hover group text-center p-2 sm:p-3 rounded-lg medical-blue">
                    <div className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-0.5">
                      20+
                    </div>
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {t("stats.yearsLegacy")}
                    </div>
                  </div>
                  <div className="glass card-hover group text-center p-2 sm:p-3 rounded-lg medical-yellow">
                    <div className="text-base sm:text-lg font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent mb-0.5">
                      95%
                    </div>
                    <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Success Rate
                    </div>
                  </div>
                  <div className="glass card-hover group text-center p-2 sm:p-3 rounded-lg medical-red">
                    <div className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-0.5">
                      4.9★
                    </div>
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                      Patient Rating
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Floating Elements - More Compact */}
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white p-1.5 sm:p-2 rounded-full shadow-lg animate-bounce hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>

            <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-1.5 sm:p-2 rounded-full shadow-lg animate-bounce delay-1000 hover:scale-110 transition-transform duration-300">
              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>

            {/* Additional Floating Elements - More Compact */}
            <div className="absolute top-1/4 -left-1 sm:-left-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-1.5 sm:p-2 rounded-full shadow-lg animate-pulse hover:scale-110 transition-transform duration-300">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>

            <div className="absolute bottom-1/4 -right-1 sm:-right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-1.5 sm:p-2 rounded-full shadow-lg animate-pulse delay-500 hover:scale-110 transition-transform duration-300">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
