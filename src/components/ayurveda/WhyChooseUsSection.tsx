"use client";


import {
  Shield,
  Heart,
  Users,
  Leaf,
  Clock,
  Star,
  CheckCircle,
  Award,
} from "lucide-react";
import {
  ScrollReveal,
  HoverAnimation,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animated-wrapper";
import { useTranslation } from "@/lib/i18n/context";

const WhyChooseUsSection = () => {
  const { t } = useTranslation();
  const features = [
    {
      icon: Shield,
      title: t("whyChooseUs.features.governmentCertified.title"),
      description: t("whyChooseUs.features.governmentCertified.description"),
      color: "from-primary to-primary/80",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: Heart,
      title: t("whyChooseUs.features.authenticAyurveda.title"),
      description: t("whyChooseUs.features.authenticAyurveda.description"),
      color: "from-primary/90 to-emerald-700",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: Users,
      title: t("whyChooseUs.features.personalizedCare.title"),
      description: t("whyChooseUs.features.personalizedCare.description"),
      color: "from-emerald-700 to-emerald-800",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: Leaf,
      title: t("whyChooseUs.features.naturalTreatment.title"),
      description: t("whyChooseUs.features.naturalTreatment.description"),
      color: "from-amber-500 to-amber-600",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: Award,
      title: t("whyChooseUs.features.provenResults.title"),
      description: t("whyChooseUs.features.provenResults.description"),
      color: "from-slate-600 to-slate-800",
      bgColor: "from-primary/5 to-primary/10",
    },
    {
      icon: CheckCircle,
      title: t("whyChooseUs.features.expertTeam.title"),
      description: t("whyChooseUs.features.expertTeam.description"),
      color: "from-primary to-emerald-700",
      bgColor: "from-primary/5 to-primary/10",
    },
  ];

  const stats = [
    {
      number: "5000+",
      label: t("whyChooseUs.stats.livesTransformed"),
      icon: Users,
    },
    { number: "20+", label: t("whyChooseUs.stats.yearsLegacy"), icon: Clock },
    { number: "95%", label: t("whyChooseUs.stats.successRate"), icon: Star },
    {
      number: "4.9/5",
      label: t("whyChooseUs.stats.patientRating"),
      icon: Star,
    },
  ];

  return (
    <section className="bg-base-200/55 py-16 sm:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal direction="up" className="mb-12 text-center sm:mb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Award className="w-4 h-4" />
            {t("whyChooseUs.title")}
          </div>

          <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("whyChooseUs.title")}
          </h2>

          <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t("whyChooseUs.description")}
          </p>
        </ScrollReveal>

        {/* Stats Row */}
        <ScrollReveal direction="up" delay={0.2} className="mb-12 sm:mb-14">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <HoverAnimation type="scale">
                  <div className="rounded-2xl border border-border/80 bg-card/95 p-5 text-center shadow-sm ring-1 ring-border/25 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <div className={`mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-gradient-to-r ${
                      index === 0 ? 'from-primary to-primary/80' :
                      index === 1 ? 'from-primary/90 to-emerald-700' :
                      index === 2 ? 'from-amber-500 to-amber-600' :
                      'from-slate-600 to-slate-800'
                    }`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="mb-1 text-3xl font-bold tracking-tight text-foreground">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </div>
                </HoverAnimation>
              </StaggerItem>
            ))}
          </div>
        </ScrollReveal>

        {/* Features Grid */}
        <StaggerContainer
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <HoverAnimation type="glow">
                <div className={`group flex min-h-[250px] flex-col rounded-2xl border border-border/80 bg-card/95 p-6 shadow-sm ring-1 ring-border/25 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg ${feature.bgColor}`}>
                  <div className={`mb-4 flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${feature.color} shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed text-sm flex-grow line-clamp-4">
                    {feature.description}
                  </p>

                  <div className="mt-4 flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {t("whyChooseUs.verifiedExcellence")}
                    </span>
                  </div>
                </div>
              </HoverAnimation>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom CTA */}
        <ScrollReveal direction="up" delay={0.4} className="mt-14 text-center">
          <div className="rounded-[1.75rem] border border-primary/25 bg-primary p-6 text-primary-foreground shadow-xl sm:p-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              {t("whyChooseUs.cta.title")}
            </h3>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              {t("whyChooseUs.cta.description")}
            </p>
            <button className="rounded-full bg-background px-8 py-4 text-base font-bold text-primary shadow-lg transition-colors duration-300 hover:bg-muted sm:text-lg">
              {t("whyChooseUs.cta.button")}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
