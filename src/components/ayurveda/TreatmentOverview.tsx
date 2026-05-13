"use client";

import { useTranslation } from "@/lib/i18n/context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Droplets,
  Zap,
  Heart,
  ArrowRight,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";

const TreatmentOverview = () => {
  const { t } = useTranslation();

  const treatments = [
    {
      id: "panchakarma",
      title: t("treatments.panchakarma.title"),
      subtitle: t("treatments.panchakarma.subtitle"),
      icon: Droplets,
      color: "from-primary to-primary/80",
      bgColor:
        "from-primary/[0.06] to-primary/[0.10]",
      description: t("treatments.panchakarma.description"),
      features: [
        t("treatments.panchakarma.features.0"),
        t("treatments.panchakarma.features.1"),
        t("treatments.panchakarma.features.2"),
        t("treatments.panchakarma.features.3"),
      ],
      conditions: [
        t("treatments.panchakarma.conditions.0"),
        t("treatments.panchakarma.conditions.1"),
        t("treatments.panchakarma.conditions.2"),
        t("treatments.panchakarma.conditions.3"),
      ],
      successRate: t("treatments.panchakarma.successRate"),
      duration: t("treatments.panchakarma.duration"),
      href: "/treatments/panchakarma",
    },
    {
      id: "agnikarma",
      title: t("treatments.agnikarma.title"),
      subtitle: t("treatments.agnikarma.subtitle"),
      icon: Flame,
      color: "from-primary/90 to-emerald-700",
      bgColor:
        "from-emerald-500/[0.06] to-emerald-500/[0.10]",
      description: t("treatments.agnikarma.description"),
      features: [
        t("treatments.agnikarma.features.0"),
        t("treatments.agnikarma.features.1"),
        t("treatments.agnikarma.features.2"),
        t("treatments.agnikarma.features.3"),
      ],
      conditions: [
        t("treatments.agnikarma.conditions.0"),
        t("treatments.agnikarma.conditions.1"),
        t("treatments.agnikarma.conditions.2"),
        t("treatments.agnikarma.conditions.3"),
      ],
      successRate: t("treatments.agnikarma.successRate"),
      duration: t("treatments.agnikarma.duration"),
      href: "/treatments/agnikarma",
    },
    {
      id: "viddha-karma",
      title: t("treatments.viddhakarma.title"),
      subtitle: t("treatments.viddhakarma.subtitle"),
      icon: Zap,
      color: "from-slate-600 to-slate-800",
      bgColor:
        "from-slate-500/[0.06] to-slate-500/[0.10]",
      description: t("treatments.viddhakarma.description"),
      features: [
        t("treatments.viddhakarma.features.0"),
        t("treatments.viddhakarma.features.1"),
        t("treatments.viddhakarma.features.2"),
        t("treatments.viddhakarma.features.3"),
      ],
      conditions: [
        t("treatments.viddhakarma.conditions.0"),
        t("treatments.viddhakarma.conditions.1"),
        t("treatments.viddhakarma.conditions.2"),
        t("treatments.viddhakarma.conditions.3"),
      ],
      successRate: t("treatments.viddhakarma.successRate"),
      duration: t("treatments.viddhakarma.duration"),
      href: "/treatments/viddha-karma",
    },
  ];

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center sm:mb-14">
          <Badge className="mb-4 border-primary/20 bg-primary/10 px-4 py-1.5 text-primary">
            <Heart className="w-4 h-4 mr-2" />
            {t("treatments.title")}
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("treatments.subtitle")}
          </h2>
          <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t("treatments.description")}
          </p>
        </div>

        <div className="mb-14 grid gap-5 lg:grid-cols-3">
          {treatments.map((treatment) => {
            const IconComponent = treatment.icon;

            return (
              <Card
                key={treatment.id}
                className="group overflow-hidden border-border/80 bg-card/95 shadow-sm ring-1 ring-border/25 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl"
              >
                <CardHeader
                  className={`bg-gradient-to-br ${treatment.bgColor} relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <IconComponent className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${treatment.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-playfair font-bold text-card-foreground mb-2">
                      {treatment.title}
                    </CardTitle>
                    <p className="text-muted-foreground font-medium">
                      {treatment.subtitle}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <p className="mb-6 leading-7 text-muted-foreground">
                    {treatment.description}
                  </p>

                  {/* Key Features */}
                  <div className="mb-6">
                    <h4 className="mb-3 font-semibold text-foreground">
                      {t("treatments.labels.keyBenefits")}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {treatment.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conditions Treated */}
                  <div className="mb-6">
                    <h4 className="mb-3 font-semibold text-foreground">
                      {t("treatments.labels.treats")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {treatment.conditions
                        .slice(0, 2)
                        .map((condition, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {condition}
                          </Badge>
                        ))}
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        +{treatment.conditions.length - 2}{" "}
                        {t("treatments.labels.more")}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-lg font-bold text-foreground">
                          {treatment.successRate}%
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t("treatments.labels.successRate")}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-lg font-bold text-foreground">
                          {treatment.duration}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t("treatments.labels.duration")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link href={treatment.href}>
                      <Button
                        className={`w-full bg-gradient-to-r ${treatment.color} hover:opacity-90 text-white group-hover:shadow-lg transition-all duration-300`}
                      >
                        {t("treatments.labels.learnMore")}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      {t("treatments.labels.bookConsultation")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
            <h3 className="text-2xl font-playfair font-bold mb-4">
              {t("treatments.cta.title")}
            </h3>
            <p className="mb-6 max-w-2xl mx-auto text-primary-foreground/85">
              {t("treatments.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-background text-primary hover:bg-muted"
              >
                {t("treatments.cta.assessmentButton")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                {t("treatments.cta.expertButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TreatmentOverview;
