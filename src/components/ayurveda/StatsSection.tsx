"use client";


import { useTranslation } from "@/lib/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  HoverAnimation,
  CounterAnimation,
} from "@/components/ui/animated-wrapper";
import {
  Users,
  Award,
  Star,
  Clock,
  Heart,
  CheckCircle,
  TrendingUp,
  Shield,
} from "lucide-react";

const StatsSection = () => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Users,
      number: "5000+",
      label: t("stats.livesTransformed"),
      description: t("stats.patientsSuccessfullyTreated"),
      color: "from-primary to-teal-500",
    },
    {
      icon: Clock,
      number: "20+",
      label: t("stats.yearsLegacy"),
      description: t("stats.authenticAyurvedicPractice"),
      color: "from-emerald-500 to-green-600",
    },
    {
      icon: Star,
      number: "4.9",
      label: t("stats.patientRating"),
      description: t("stats.basedOnReviews"),
      color: "from-amber-400 to-orange-500",
    },
    {
      icon: Award,
      number: "95%",
      label: t("stats.successRate"),
      description: t("stats.chronicConditions"),
      color: "from-sky-500 to-cyan-600",
    },
  ];

  const certifications = [
    {
      icon: Shield,
      title: t("stats.certifications.governmentCertified.title"),
      description: t("stats.certifications.governmentCertified.description"),
    },
    {
      icon: Award,
      title: t("stats.certifications.iso9001.title"),
      description: t("stats.certifications.iso9001.description"),
    },
    {
      icon: CheckCircle,
      title: t("stats.certifications.nabhAccredited.title"),
      description: t("stats.certifications.nabhAccredited.description"),
    },
    {
      icon: TrendingUp,
      title: t("stats.certifications.teachingHospital.title"),
      description: t("stats.certifications.teachingHospital.description"),
    },
  ];

  return (
    <section className="relative z-0 overflow-hidden bg-gradient-to-b from-background via-muted/25 to-background py-16 sm:py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-36 bottom-20 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="container mx-auto px-4">
        <div className="relative mx-auto mb-12 max-w-3xl text-center sm:mb-14">
          <Badge className="mb-4 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-primary shadow-sm animate-fade-in-down">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t("stats.provenResultsExcellence")}
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            {t("stats.transformingLives")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("stats.twoDecadesExcellence")}
          </p>
        </div>
        {/* Main Stats */}
        <StaggerContainer className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-14 sm:mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;

            return (
              <StaggerItem key={index}>
                <HoverAnimation type="lift">
                  <Card className="group h-full overflow-hidden rounded-2xl border border-border/80 bg-card/85 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/10">
                    <CardContent className="relative flex h-full flex-col items-center p-6 text-center">
                      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div
                        className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-105`}
                      >
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl lg:text-4xl font-black tracking-tight text-foreground mb-2">
                        {stat.number.includes("+") ? (
                          <>
                            <CounterAnimation
                              from={0}
                              to={parseInt(stat.number.replace(/[^\d]/g, ""))}
                              suffix="+"
                            />
                          </>
                        ) : stat.number.includes(".") ? (
                          <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                            {stat.number}
                          </span>
                        ) : stat.number.includes("%") ? (
                          <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                            <CounterAnimation
                              from={0}
                              to={parseInt(stat.number.replace(/[^\d]/g, ""))}
                              suffix="%"
                            />
                          </span>
                        ) : (
                          <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                            {stat.number}
                          </span>
                        )}
                      </div>
                      {stat.label === t("stats.patientRating") && (
                        <div
                          className="mb-3 flex items-center justify-center gap-1"
                          aria-label="4.9 out of 5 star patient rating"
                        >
                          <div className="flex items-center gap-1">
                            {[...Array(4)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-primary fill-primary drop-shadow-sm" />
                            ))}
                            <div className="relative">
                              <Star className="w-4 h-4 text-primary/20" />
                              <div className="absolute inset-0 overflow-hidden w-[90%]">
                                <Star className="w-4 h-4 text-primary fill-primary" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="font-bold text-foreground mb-2">
                        {stat.label}
                      </div>
                      <div className="text-sm leading-relaxed text-muted-foreground">
                        {stat.description}
                      </div>
                    </CardContent>
                  </Card>
                </HoverAnimation>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Certifications */}
        <ScrollReveal direction="up">
          <div className="text-center mb-10">
            <HoverAnimation type="scale">
              <Badge className="mb-4 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-primary shadow-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("stats.trustedCertified")}
              </Badge>
            </HoverAnimation>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("stats.recognizedExcellence")}
            </h3>
          </div>
        </ScrollReveal>

        <StaggerContainer className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {certifications.map((cert, index) => {
            const IconComponent = cert.icon;

            return (
              <StaggerItem key={index}>
                <HoverAnimation type="lift">
                  <div className="group h-full rounded-2xl border border-border/80 bg-card/80 p-6 text-center shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/10">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${
                        index === 0
                          ? "from-primary to-teal-500"
                          : index === 1
                          ? "from-emerald-500 to-green-600"
                          : index === 2
                          ? "from-amber-400 to-orange-500"
                          : "from-sky-500 to-cyan-600"
                      } rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-primary/10 transition-transform duration-300 group-hover:scale-105`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-foreground mb-2">
                      {cert.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {cert.description}
                    </p>
                  </div>
                </HoverAnimation>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Trust Indicators */}
        <div className="relative mt-12 sm:mt-16 text-center">
          <div className="rounded-2xl border border-primary/20 bg-primary/8 p-5 shadow-sm backdrop-blur sm:p-6">
            <div className="grid gap-4 text-sm font-medium text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-center gap-2 rounded-full bg-card/70 px-3 py-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span>{t("stats.currentlyTreating")}</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-full bg-card/70 px-3 py-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>{t("stats.bookingIncrease")}</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-full bg-card/70 px-3 py-2">
                <Heart className="w-4 h-4 text-primary" />
                <span>{t("stats.featuredChannels")}</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-full bg-card/70 px-3 py-2">
                <Users className="w-4 h-4 text-primary" />
                <span>{t("stats.peopleViewing")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
