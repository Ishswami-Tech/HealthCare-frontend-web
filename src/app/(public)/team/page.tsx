"use client";

import { Suspense, useState } from "react";
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
  Sparkles,
  Zap,
  Crown,
  Diamond,
  Flame,
  Stethoscope,
  Microscope,
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
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Sample videos for demonstration
  const sampleVideos = [
    {
      id: "1",
      videoId: "dQw4w9WgXcQ", // Sample YouTube video ID
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
      image: "/api/placeholder/150/150",
      credentials: t("team.teamMembers.drDeshmukh.credentials"),
      achievements: t("team.teamMembers.drDeshmukh.achievements"),
      colorScheme: getIconColorScheme("Brain"),
      icon: Brain,
      gradient: "from-purple-500 to-indigo-600",
      accent: "purple",
    },
    {
      name: t("team.teamMembers.vaidyaKrishnamurthy.name"),
      title: t("team.teamMembers.vaidyaKrishnamurthy.title"),
      specialization: t("team.teamMembers.vaidyaKrishnamurthy.specialization"),
      experience: t("team.teamMembers.vaidyaKrishnamurthy.experience"),
      image: "/api/placeholder/150/150",
      credentials: t("team.teamMembers.vaidyaKrishnamurthy.credentials"),
      achievements: t("team.teamMembers.vaidyaKrishnamurthy.achievements"),
      colorScheme: getIconColorScheme("Flame"),
      icon: Flame,
      gradient: "from-orange-500 to-red-600",
      accent: "orange",
    },
    {
      name: t("team.teamMembers.drPriyaSharma.name"),
      title: t("team.teamMembers.drPriyaSharma.title"),
      specialization: t("team.teamMembers.drPriyaSharma.specialization"),
      experience: t("team.teamMembers.drPriyaSharma.experience"),
      image: "/api/placeholder/150/150",
      credentials: t("team.teamMembers.drPriyaSharma.credentials"),
      achievements: t("team.teamMembers.drPriyaSharma.achievements"),
      colorScheme: getIconColorScheme("Heart"),
      icon: Heart,
      gradient: "from-pink-500 to-rose-600",
      accent: "pink",
    },
    {
      name: "Dr. Sunita Patel",
      title: "Women's Health & Fertility Expert",
      specialization: "Reproductive Health Specialist",
      experience: "15+ years",
      image: "/api/placeholder/150/150",
      credentials: ["BAMS", "Fertility Specialist", "Hormonal Balance Expert"],
      achievements: [
        "500+ successful pregnancies",
        "PCOD treatment expert",
        "Women wellness advocate",
      ],
      colorScheme: getIconColorScheme("Stethoscope"),
      icon: Stethoscope,
      gradient: "from-emerald-500 to-teal-600",
      accent: "emerald",
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
      gradient: "from-yellow-500 to-orange-500",
      description: "Decades of combined expertise",
    },
    {
      number: t("team.teamStats.patients.value"),
      label: t("team.teamStats.patients.label"),
      icon: Users,
      colorScheme: getIconColorScheme("Users"),
      gradient: "from-blue-500 to-cyan-500",
      description: "Lives transformed through healing",
    },
    {
      number: t("team.teamStats.publications.value"),
      label: t("team.teamStats.publications.label"),
      icon: BookOpen,
      colorScheme: getIconColorScheme("BookOpen"),
      gradient: "from-green-500 to-emerald-500",
      description: "Research contributions to Ayurveda",
    },
    {
      number: t("team.teamStats.conferences.value"),
      label: t("team.teamStats.conferences.label"),
      icon: Globe,
      colorScheme: getIconColorScheme("Globe"),
      gradient: "from-purple-500 to-violet-500",
      description: "International recognition",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen overflow-hidden">
        {/* Ultra-Advanced Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/* Dynamic floating orbs with enhanced effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-400/30 to-red-400/30 rounded-full blur-3xl animate-pulse shadow-2xl shadow-orange-500/20"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse shadow-2xl shadow-blue-500/20 animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-green-400/30 to-teal-400/30 rounded-full blur-3xl animate-pulse shadow-2xl shadow-green-500/20 animation-delay-4000"></div>
          <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-gradient-to-r from-pink-400/25 to-rose-400/25 rounded-full blur-3xl animate-pulse shadow-2xl shadow-pink-500/20 animation-delay-6000"></div>

          {/* Enhanced geometric patterns */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 border-2 border-orange-400/40 rotate-45 animate-spin shadow-lg shadow-orange-500/30 animation-duration-20s"></div>
            <div className="absolute top-40 right-32 w-24 h-24 border-2 border-blue-400/40 rotate-12 animate-spin shadow-lg shadow-blue-500/30 animation-duration-15s animation-reverse"></div>
            <div className="absolute bottom-32 left-1/3 w-40 h-40 border-2 border-green-400/40 rotate-45 animate-spin shadow-lg shadow-green-500/30 animation-duration-25s"></div>
            <div className="absolute top-1/2 right-1/4 w-28 h-28 border-2 border-purple-400/40 rotate-12 animate-spin shadow-lg shadow-purple-500/30 animation-duration-18s animation-reverse"></div>
          </div>

          {/* Animated grid overlay with enhanced effects */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-pulse"></div>

          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-60 animate-bounce"
                style={{
                  left: `${20 + i * 4}%`,
                  top: `${10 + i * 3}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Language & Theme Switchers */}
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex gap-2">
          <LanguageSwitcher variant="compact" />
          <CompactThemeSwitcher />
        </div>

        {/* Ultra-Enhanced Hero Section */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-br from-background via-background/95 to-muted/30 overflow-hidden">
            {/* Hero background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-orange-400/10 to-red-400/10 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-6xl mx-auto text-center">
                <div className="mb-8 animate-fade-in-down">
                  <Badge className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 text-orange-800 dark:text-orange-100 border-orange-200 dark:border-orange-700/60 px-6 py-3 text-sm font-semibold backdrop-blur-sm glass shadow-md shadow-orange-500/20">
                    <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
                    {t("team.badge")}
                    <Sparkles className="w-5 h-5 ml-3 animate-pulse" />
                  </Badge>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-6 leading-tight animate-fade-in-up">
                  <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl relative">
                    {t("team.title")}
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-pink-600/20 blur-xl -z-10"></div>
                  </span>
                </h1>

                <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-4xl mx-auto drop-shadow-sm animate-fade-in-up animation-delay-200">
                  {t("team.description")}
                </p>

                <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in-up animation-delay-400">
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-100 border-green-200 dark:border-green-700/60 px-4 py-2 text-sm font-semibold shadow-md shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105">
                    <Shield className="w-5 h-5 mr-3" />
                    Government Certified
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700/60 px-4 py-2 text-sm font-semibold shadow-md shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                    <Microscope className="w-5 h-5 mr-3" />
                    Published Researchers
                  </Badge>
                  <Badge className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 text-orange-800 dark:text-orange-100 border-orange-200 dark:border-orange-700/60 px-4 py-2 text-sm font-semibold shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105">
                    <Crown className="w-5 h-5 mr-3" />
                    Certified Teachers
                  </Badge>
                </div>

                {/* Floating action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up animation-delay-600">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-base px-6 py-3 rounded-lg font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Zap className="w-5 h-5 mr-3" />
                    Meet Our Team
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 text-base px-6 py-3 rounded-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Users className="w-5 h-5 mr-3" />
                    View Expertise
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Ultra-Enhanced Team Stats */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-muted/30 via-background to-muted/20 relative overflow-hidden">
            {/* Section background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/3 via-transparent to-red-500/3"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/5 to-purple-400/5 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 lg:mb-16">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-foreground mb-4 gradient-text">
                    Our Excellence in Numbers
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                    Quantifying our impact and expertise in Ayurvedic healing
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {teamStats.map((stat, index) => {
                    const IconComponent = stat.icon;

                    return (
                      <Card
                        key={index}
                        className="group text-center hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card/90 to-muted/30 dark:from-card/95 dark:to-muted/40 glass backdrop-blur-sm hover:scale-110 hover:-translate-y-4 relative overflow-hidden"
                        onMouseEnter={() => setHoveredCard(index)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {/* Glowing border effect */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl blur-sm`}
                        ></div>

                        <CardContent className="p-4 lg:p-6 relative z-10">
                          <div
                            className={`w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r ${stat.gradient} rounded-3xl flex items-center justify-center mx-auto mb-4 interactive transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-md shadow-blue-500/30 group-hover:shadow-blue-500/50`}
                          >
                            <IconComponent className="w-8 h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
                          </div>
                          <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2 gradient-text group-hover:scale-110 transition-transform duration-300">
                            {stat.number}
                          </div>
                          <div className="text-xs lg:text-sm text-muted-foreground font-semibold mb-2">
                            {stat.label}
                          </div>
                          <div className="text-xs text-muted-foreground/70 leading-relaxed">
                            {stat.description}
                          </div>

                          {/* Animated progress bar */}
                          <div className="mt-3 w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${
                                stat.gradient
                              } rounded-full transition-all duration-1000 ease-out ${
                                hoveredCard === index ? "w-full" : "w-0"
                              }`}
                            ></div>
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

        {/* Ultra-Enhanced Chief Medical Officers */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
            {/* Section background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/3 via-transparent to-red-500/3"></div>
            <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/5 to-pink-400/5 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-8xl mx-auto">
                <div className="text-center mb-16 lg:mb-20">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                    Chief Medical Officers
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                    Leading experts in their respective specializations,
                    bringing decades of combined experience
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  {chiefMedicalOfficers.map((doctor, index) => {
                    const IconComponent = doctor.icon;

                    return (
                      <Card
                        key={index}
                        className="group hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card/90 to-muted/30 dark:from-card/95 dark:to-muted/40 glass backdrop-blur-sm hover:scale-105 relative overflow-hidden"
                        onMouseEnter={() => setHoveredCard(index + 10)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {/* Glowing border effect */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${doctor.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl blur-sm`}
                        ></div>

                        <CardContent className="p-0 relative z-10">
                          <div className="grid md:grid-cols-3">
                            <div
                              className={`bg-gradient-to-br ${doctor.gradient} text-white p-8 lg:p-10 flex flex-col justify-center items-center relative overflow-hidden`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                              <div className="absolute top-4 right-4">
                                <Diamond className="w-6 h-6 text-white/30 animate-pulse" />
                              </div>

                              <div className="w-28 h-28 lg:w-32 lg:h-32 bg-white/20 rounded-3xl flex items-center justify-center mb-8 interactive backdrop-blur-sm border border-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-white/20">
                                <IconComponent className="w-16 h-16 lg:w-18 lg:h-18 text-white drop-shadow-lg" />
                              </div>

                              <div className="text-center relative z-10">
                                <div className="text-xl lg:text-2xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                                  {doctor.experience}
                                </div>
                                <div className="text-sm lg:text-base opacity-90 font-medium">
                                  Experience
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-2 p-8 lg:p-10">
                              <div className="mb-6">
                                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 gradient-text group-hover:scale-105 transition-transform duration-300">
                                  {doctor.name}
                                </h3>
                                <p className="text-muted-foreground mb-4 font-semibold text-lg">
                                  {doctor.title}
                                </p>
                                <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-600 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/50 backdrop-blur-sm px-4 py-2 text-sm font-semibold">
                                  {doctor.specialization}
                                </Badge>
                              </div>

                              <div className="space-y-6">
                                <div className="group/credential">
                                  <h4 className="font-bold text-foreground mb-4 flex items-center text-lg">
                                    <CheckCircle className="w-5 h-5 mr-3 text-green-500 group-hover/credential:scale-110 transition-transform duration-300" />
                                    Credentials:
                                  </h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl backdrop-blur-sm border border-muted/50">
                                    {doctor.credentials}
                                  </p>
                                </div>

                                <div className="group/achievement">
                                  <h4 className="font-bold text-foreground mb-4 flex items-center text-lg">
                                    <Star className="w-5 h-5 mr-3 text-yellow-500 group-hover/achievement:scale-110 transition-transform duration-300" />
                                    Key Achievements:
                                  </h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl backdrop-blur-sm border border-muted/50">
                                    {doctor.achievements}
                                  </p>
                                </div>
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

        {/* Ultra-Enhanced Medical Advisory Board */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-muted/30 via-background to-muted/20 relative overflow-hidden">
            {/* Section background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3"></div>
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-400/5 to-purple-400/5 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-8xl mx-auto">
                <div className="text-center mb-16 lg:mb-20">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-6 gradient-text">
                    {t("team.advisoryBoard.title")}
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                    {t("team.advisoryBoard.subtitle")}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
                  {advisoryBoard.map((advisor, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card/90 to-muted/30 dark:from-card/95 dark:to-muted/40 glass backdrop-blur-sm hover:scale-105 relative overflow-hidden"
                      onMouseEnter={() => setHoveredCard(index + 20)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      {/* Glowing border effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl blur-sm"></div>

                      <CardHeader className="pb-4 relative z-10">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center interactive group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-md shadow-blue-500/30 group-hover:shadow-blue-500/50">
                            <User className="w-8 h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg lg:text-xl text-foreground mb-2 group-hover:scale-105 transition-transform duration-300">
                              {advisor.name}
                            </CardTitle>
                            <p className="text-muted-foreground mb-2 font-semibold text-base">
                              {advisor.title}
                            </p>
                            <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm px-3 py-1 text-xs font-semibold">
                              {advisor.role}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 relative z-10">
                        <div className="bg-muted/30 p-4 rounded-xl backdrop-blur-sm border border-muted/50 group-hover:bg-muted/40 transition-colors duration-300">
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {advisor.expertise}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Ultra-Enhanced Call to Action */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/95 via-red-600/95 to-pink-600/95"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-15"></div>

            {/* Enhanced background effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-white/8 to-white/3 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>

            {/* Floating particles */}
            <div className="absolute inset-0">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-white/20 rounded-full animate-bounce"
                  style={{
                    left: `${15 + i * 5}%`,
                    top: `${20 + i * 4}%`,
                  }}
                />
              ))}
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-6xl mx-auto text-center text-white">
                <div className="mb-8">
                  <Badge className="bg-white/20 text-white border-white/30 px-6 py-3 text-base font-semibold backdrop-blur-sm mb-6">
                    <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
                    Ready to Transform Your Health?
                    <Sparkles className="w-5 h-5 ml-3 animate-pulse" />
                  </Badge>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold mb-6 drop-shadow-2xl leading-tight">
                  {t("team.cta.title")}
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl text-white/95 mb-6 leading-relaxed drop-shadow-lg max-w-4xl mx-auto">
                  {t("team.cta.subtitle")}
                </p>
                <p className="text-base md:text-lg text-white/85 mb-12 max-w-4xl mx-auto leading-relaxed">
                  {t("team.cta.description")}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center mb-12">
                  <Button
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white/20"
                  >
                    <Zap className="w-6 h-6 mr-4" />
                    {t("team.cta.bookConsultation")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-3 border-white text-white hover:bg-white/15 text-lg px-8 py-4 rounded-xl font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105 bg-white/5"
                  >
                    <Users className="w-6 h-6 mr-4" />
                    {t("team.cta.scheduleMeeting")}
                  </Button>
                </div>

                <div className="flex flex-wrap justify-center gap-6 lg:gap-8 text-white/95">
                  <div className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-base">
                      {t("team.cta.features.experience")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-base">
                      {t("team.cta.features.research")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Globe className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-base">
                      {t("team.cta.features.recognition")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Ultra-Enhanced Treatment Demonstration Videos */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
            {/* Section background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/3 via-transparent to-teal-500/3"></div>
            <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-gradient-to-r from-emerald-400/5 to-teal-400/5 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-8xl mx-auto">
                <div className="text-center mb-16 lg:mb-20">
                  <Badge className="bg-gradient-to-r from-green-500/20 to-teal-500/20 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-800/50 px-4 py-2 text-sm font-semibold backdrop-blur-sm mb-6">
                    <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
                    Treatment Demonstrations
                    <Sparkles className="w-5 h-5 ml-3 animate-pulse" />
                  </Badge>

                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-foreground mb-4 gradient-text">
                    {t("team.videos.title")}
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                    {t("team.videos.subtitle")}
                  </p>
                </div>

                <Suspense fallback={<SectionSkeleton />}>
                  <div className="relative">
                    <YouTubeVideoGrid
                      videos={sampleVideos}
                      columns={3}
                      aspectRatio="16:9"
                    />
                  </div>
                </Suspense>
              </div>
            </div>
          </section>
        </LazySection>
      </div>
    </PageTransition>
  );
}
