"use client";

import { useTranslation } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  HoverAnimation,
} from "@/components/ui/animated-wrapper";
import {
  Users,
  Award,
  Heart,
  CheckCircle,
  TrendingUp,
  Shield,
} from "lucide-react";

const StatsSection = () => {
  const { t } = useTranslation();

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
    <section className="relative z-0 overflow-hidden bg-gradient-to-b from-background via-muted/25 to-background py-14 sm:py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-36 bottom-20 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="container mx-auto px-4">
        {/* Certifications — hero above already showcases headline stats */}
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
