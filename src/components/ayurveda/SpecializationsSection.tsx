"use client";

import { useTranslation } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, Flame, Zap, Award } from "lucide-react";

export default function SpecializationsSection() {
  const { t } = useTranslation();

  const specializations = [
    {
      icon: Droplets,
      title: t("homepage.specializations.panchakarma.title"),
      description: t("homepage.specializations.panchakarma.description"),
      color: "from-primary to-primary/80",
      bgColor: "from-primary/[0.05] to-primary/[0.08]",
      textColor: "text-foreground",
      borderColor: "border-primary/15",
    },
    {
      icon: Flame,
      title: t("homepage.specializations.agnikarma.title"),
      description: t("homepage.specializations.agnikarma.description"),
      color: "from-primary/90 to-emerald-700",
      bgColor: "from-emerald-500/[0.05] to-emerald-500/[0.08]",
      textColor: "text-foreground",
      borderColor: "border-emerald-500/15",
    },
    {
      icon: Zap,
      title: t("homepage.specializations.viddhakarma.title"),
      description: t("homepage.specializations.viddhakarma.description"),
      color: "from-slate-600 to-slate-800",
      bgColor: "from-slate-500/[0.05] to-slate-500/[0.08]",
      textColor: "text-foreground",
      borderColor: "border-slate-500/15",
    },
  ];

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-14">
          <Badge className="mb-5 border-primary/20 bg-primary/10 px-4 py-1.5 text-primary animate-fade-in-down">
            <Award className="w-4 h-4 mr-2" />
            Specialized Treatments
          </Badge>
          <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("homepage.specializations.title")}
          </h2>
          <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t("homepage.specializations.subtitle")}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {specializations.map((spec, index) => {
            const IconComponent = spec.icon;
            return (
              <Card
                key={index}
                className={`rounded-2xl border bg-card/95 p-6 text-center shadow-sm ring-1 ring-border/25 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg ${spec.borderColor} bg-gradient-to-br ${spec.bgColor}`}
              >
                <CardContent className="p-0">
                  <div
                    className={`mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-r ${spec.color} shadow-sm`}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3
                    className={`mb-3 text-xl font-semibold ${spec.textColor}`}
                  >
                    {spec.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {spec.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
