"use client";

import React from "react";
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
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50",
      textColor: "text-green-800",
      borderColor: "border-green-200",
    },
    {
      icon: Flame,
      title: t("homepage.specializations.agnikarma.title"),
      description: t("homepage.specializations.agnikarma.description"),
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-50 to-cyan-50",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
    },
    {
      icon: Zap,
      title: t("homepage.specializations.viddhakarma.title"),
      description: t("homepage.specializations.viddhakarma.description"),
      color: "from-purple-500 to-indigo-600",
      bgColor: "from-purple-50 to-indigo-50",
      textColor: "text-purple-800",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 glass animate-fade-in-down">
            <Award className="w-4 h-4 mr-2" />
            Specialized Treatments
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-6 gradient-text">
            {t("homepage.specializations.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("homepage.specializations.subtitle")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {specializations.map((spec, index) => {
            const IconComponent = spec.icon;
            return (
              <Card
                key={index}
                className={`text-center p-6 ${spec.bgColor} rounded-lg border-2 ${spec.borderColor} glass card-hover`}
              >
                <CardContent className="p-0">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${spec.color} rounded-full flex items-center justify-center mx-auto mb-4 interactive`}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3
                    className={`text-xl font-semibold ${spec.textColor} mb-3`}
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
