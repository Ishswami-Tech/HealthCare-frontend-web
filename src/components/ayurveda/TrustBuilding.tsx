"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

const TrustBuilding = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: t("trust.faq.questions.different"),
      answer: t("trust.faq.answers.different"),
    },
    {
      question: t("trust.faq.questions.results"),
      answer: t("trust.faq.answers.results"),
    },
    {
      question: t("trust.faq.questions.safe"),
      answer: t("trust.faq.answers.safe"),
    },
    {
      question: t("trust.faq.questions.guarantees"),
      answer: t("trust.faq.answers.guarantees"),
    },
    {
      question: t("trust.faq.questions.certifications"),
      answer: t("trust.faq.answers.certifications"),
    },
  ];

  const guarantees = [
    {
      condition: t("trust.guarantees.conditions.chronicPain.condition"),
      guarantee: t("trust.guarantees.conditions.chronicPain.guarantee"),
      timeframe: t("trust.guarantees.conditions.chronicPain.timeframe"),
      measurement: t("trust.guarantees.conditions.chronicPain.measurement"),
    },
    {
      condition: t("trust.guarantees.conditions.neurological.condition"),
      guarantee: t("trust.guarantees.conditions.neurological.guarantee"),
      timeframe: t("trust.guarantees.conditions.neurological.timeframe"),
      measurement: t("trust.guarantees.conditions.neurological.measurement"),
    },
    {
      condition: t("trust.guarantees.conditions.stress.condition"),
      guarantee: t("trust.guarantees.conditions.stress.guarantee"),
      timeframe: t("trust.guarantees.conditions.stress.timeframe"),
      measurement: t("trust.guarantees.conditions.stress.measurement"),
    },
    {
      condition: t("trust.guarantees.conditions.digestive.condition"),
      guarantee: t("trust.guarantees.conditions.digestive.guarantee"),
      timeframe: t("trust.guarantees.conditions.digestive.timeframe"),
      measurement: t("trust.guarantees.conditions.digestive.measurement"),
    },
    {
      condition: t("trust.guarantees.conditions.sleep.condition"),
      guarantee: t("trust.guarantees.conditions.sleep.guarantee"),
      timeframe: t("trust.guarantees.conditions.sleep.timeframe"),
      measurement: t("trust.guarantees.conditions.sleep.measurement"),
    },
    {
      condition: t("trust.guarantees.conditions.energy.condition"),
      guarantee: t("trust.guarantees.conditions.energy.guarantee"),
      timeframe: t("trust.guarantees.conditions.energy.timeframe"),
      measurement: t("trust.guarantees.conditions.energy.measurement"),
    },
    {
      condition: t("trust.guarantees.conditions.immunity.condition"),
      guarantee: t("trust.guarantees.conditions.immunity.guarantee"),
      timeframe: t("trust.guarantees.conditions.immunity.timeframe"),
      measurement: t("trust.guarantees.conditions.immunity.measurement"),
    },
    {
      condition: t("trust.guarantees.conditions.wellness.condition"),
      guarantee: t("trust.guarantees.conditions.wellness.guarantee"),
      timeframe: t("trust.guarantees.conditions.wellness.timeframe"),
      measurement: t("trust.guarantees.conditions.wellness.measurement"),
    },
  ];

  const certifications = [
    {
      name: t("stats.certifications.governmentCertified.title"),
      description: t("stats.certifications.governmentCertified.description"),
    },
    {
      name: t("stats.certifications.iso9001.title"),
      description: t("stats.certifications.iso9001.description"),
    },
    {
      name: t("stats.certifications.excellenceAward.title"),
      description: t("stats.certifications.excellenceAward.description"),
    },
    {
      name: t("stats.certifications.safetyCertified.title"),
      description: t("stats.certifications.safetyCertified.description"),
    },
  ];

  return (
    <div className="space-y-20">
      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-background via-background/95 to-muted/20 dark:from-background dark:via-background/95 dark:to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <Shield className="w-4 h-4 mr-2" />
                {t("trust.title")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
                {t("trust.faq.title")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("trust.faq.subtitle")}
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const IconComponent = Shield; // Default icon
                const isOpen = openFaq === index;

                return (
                  <Card
                    key={index}
                    className="bg-card/80 dark:bg-card/90 shadow-lg border border-border/50 overflow-hidden backdrop-blur-sm"
                  >
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors duration-200"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 bg-gradient-to-r ${
                              index === 0
                                ? "from-pink-600 to-rose-800"
                                : index === 1
                                ? "from-yellow-500 to-amber-700"
                                : index === 2
                                ? "from-indigo-600 to-blue-800"
                                : index === 3
                                ? "from-red-600 to-pink-800"
                                : "from-green-600 to-teal-800"
                            } rounded-full flex items-center justify-center`}
                          >
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {faq.question}
                          </h3>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    {isOpen && (
                      <CardContent className="pt-0">
                        <div className="pl-16">
                          <p className="text-card-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Matrix */}
      <section className="py-20 bg-gradient-to-br from-background via-background/95 to-muted/10 dark:from-background dark:via-background/95 dark:to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <Target className="w-4 h-4 mr-2" />
                Comprehensive Guarantee Matrix
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
                Our Promise to You - Guaranteed Results
              </h2>
              <p className="text-lg text-muted-foreground">
                Measurable outcomes with specific timelines for every condition
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 p-4 bg-gradient-to-r from-primary to-primary/80 dark:from-primary dark:to-primary/90 text-primary-foreground rounded-t-lg font-semibold">
                  <div>Condition</div>
                  <div className="text-center">Our Guarantee</div>
                  <div className="text-center">Timeframe</div>
                  <div className="text-center">Measurement Method</div>
                  <div className="text-center">Success Rate</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {guarantees.map((item, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow duration-300 rounded-none border-x border-b border-border bg-card/80 dark:bg-card/90 backdrop-blur-sm"
                    >
                      <CardContent className="p-4">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          <div className="font-semibold text-foreground">
                            {item.condition}
                          </div>
                          <div className="text-center text-primary font-medium">
                            {item.guarantee}
                          </div>
                          <div className="text-center">
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              {item.timeframe}
                            </Badge>
                          </div>
                          <div className="text-center text-muted-foreground text-sm">
                            {item.measurement}
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Progress
                                value={90} // Hardcoded success rate
                                className="w-16 h-2"
                              />
                              <span className="font-bold text-primary">
                                90%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant Results Challenge */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-orange-50/80 to-yellow-50/80 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800 shadow-xl backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-yellow-700 dark:from-orange-500 dark:to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Instant Results Challenge
                    </h3>
                    <p className="text-lg text-muted-foreground mb-6">
                      &quot;Feel 50% better after first session or receive
                      additional support&quot;
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Live pain scale rating with witnesses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Immediate mobility tests documented</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Patient satisfaction survey</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Public transparency in outcomes</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-gradient-to-br from-muted/30 to-background dark:from-muted/50 dark:to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <Award className="w-4 h-4 mr-2" />
                Certifications & Accreditations
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
                Internationally Recognized Excellence
              </h2>
              <p className="text-lg text-muted-foreground">
                Our commitment to quality validated by leading healthcare
                authorities
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {certifications.map((cert, index) => {
                const IconComponent = Award; // Default icon

                return (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-all duration-300 border border-border/50 bg-card/80 dark:bg-card/90 backdrop-blur-sm"
                  >
                    <CardContent className="p-8">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${
                          index === 0
                            ? "from-cyan-600 to-sky-800 dark:from-cyan-500 dark:to-sky-700"
                            : index === 1
                            ? "from-lime-600 to-green-900 dark:from-lime-500 dark:to-green-800"
                            : index === 2
                            ? "from-orange-600 to-amber-800 dark:from-orange-500 dark:to-amber-700"
                            : "from-slate-700 to-zinc-900 dark:from-slate-600 dark:to-zinc-800"
                        } rounded-full flex items-center justify-center mx-auto mb-6`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {cert.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {cert.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Trust Statistics */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  20,000+
                </div>
                <div className="text-sm text-muted-foreground">
                  Treatments with Zero Major Adverse Events
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <div className="text-sm text-muted-foreground">
                  Patient Satisfaction Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">50+</div>
                <div className="text-sm text-muted-foreground">
                  Research Publications
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">
                  Emergency Support Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TrustBuilding;
