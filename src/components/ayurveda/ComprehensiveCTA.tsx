"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Zap,
  Heart,
  Brain,
  Phone,
  MessageCircle,
  Calendar,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Clock,
  Shield,
  Award,
  Target,
  Mail,
  Video,
} from "lucide-react";

const ComprehensiveCTA = () => {
  const { t } = useTranslation();
  const { isAuthenticated, session } = useAuth();
  const router = useRouter();
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  // Authentication handlers
  const handleBookConsultation = () => {
    if (!isAuthenticated) {
      router.push("/auth/register");
    } else {
      // Navigate to booking or dashboard
      const dashboardPath = `/${session?.user?.role.toLowerCase()}/dashboard`;
      router.push(dashboardPath);
    }
  };

  const handleFreeConsultation = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else {
      // Navigate to consultation booking
      const dashboardPath = `/${session?.user?.role.toLowerCase()}/dashboard`;
      router.push(dashboardPath);
    }
  };

  const engagementLevels = [
    {
      id: "high",
      title: t("comprehensiveCTA.engagementLevels.urgent.title"),
      subtitle: t("comprehensiveCTA.engagementLevels.urgent.subtitle"),
      description: t("comprehensiveCTA.engagementLevels.urgent.description"),
      icon: Zap,
      color: "from-orange-500 to-red-600",
      bgColor:
        "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
      actions: [
        {
          label: t(
            "comprehensiveCTA.engagementLevels.urgent.features.helpline"
          ),
          subtext: "24/7 immediate response",
          urgent: true,
        },
        {
          label: t(
            "comprehensiveCTA.engagementLevels.urgent.features.consultation"
          ),
          subtext: "Same day appointment",
          urgent: true,
        },
        {
          label: t("comprehensiveCTA.engagementLevels.urgent.features.video"),
          subtext: "Instant expert advice",
          urgent: false,
        },
        {
          label: t(
            "comprehensiveCTA.engagementLevels.urgent.features.whatsapp"
          ),
          subtext: "Quick guidance",
          urgent: false,
        },
      ],
    },
    {
      id: "medium",
      title: t("comprehensiveCTA.engagementLevels.moderate.title"),
      subtitle: t("comprehensiveCTA.engagementLevels.moderate.subtitle"),
      description: t("comprehensiveCTA.engagementLevels.moderate.description"),
      icon: Heart,
      color: "from-blue-500 to-cyan-600",
      bgColor:
        "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      actions: [
        {
          label: t(
            "comprehensiveCTA.engagementLevels.moderate.features.consultation"
          ),
          subtext: "Within 48 hours",
          urgent: false,
        },
        {
          label: t(
            "comprehensiveCTA.engagementLevels.moderate.features.assessment"
          ),
          subtext: "Comprehensive evaluation",
          urgent: false,
        },
        {
          label: t(
            "comprehensiveCTA.engagementLevels.moderate.features.planning"
          ),
          subtext: "Personalized approach",
          urgent: false,
        },
        {
          label: t(
            "comprehensiveCTA.engagementLevels.moderate.features.followup"
          ),
          subtext: "Ongoing support",
          urgent: false,
        },
      ],
    },
    {
      id: "low",
      title: t("comprehensiveCTA.engagementLevels.preventive.title"),
      subtitle: t("comprehensiveCTA.engagementLevels.preventive.subtitle"),
      description: t(
        "comprehensiveCTA.engagementLevels.preventive.description"
      ),
      icon: Brain,
      color: "from-green-500 to-emerald-600",
      bgColor:
        "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      actions: [
        {
          label: t(
            "comprehensiveCTA.engagementLevels.preventive.features.consultation"
          ),
          subtext: "Preventive care",
          urgent: false,
        },
        {
          label: t(
            "comprehensiveCTA.engagementLevels.preventive.features.guidance"
          ),
          subtext: "Health optimization",
          urgent: false,
        },
        {
          label: t(
            "comprehensiveCTA.engagementLevels.preventive.features.checkups"
          ),
          subtext: "Maintenance care",
          urgent: false,
        },
        {
          label: t(
            "comprehensiveCTA.engagementLevels.preventive.features.resources"
          ),
          subtext: "Health knowledge",
          urgent: false,
        },
      ],
    },
  ];

  const contactChannels = [
    {
      channel: t("comprehensiveCTA.contactChannels.channels.whatsapp.title"),
      number: t("comprehensiveCTA.contactChannels.channels.whatsapp.number"),
      response: t(
        "comprehensiveCTA.contactChannels.channels.whatsapp.description"
      ),
      icon: MessageCircle,
      color: "bg-green-500",
    },
    {
      channel: t("comprehensiveCTA.contactChannels.channels.helpline.title"),
      number: t("comprehensiveCTA.contactChannels.channels.helpline.number"),
      response: t(
        "comprehensiveCTA.contactChannels.channels.helpline.description"
      ),
      icon: Phone,
      color: "bg-blue-500",
    },
    {
      channel: t("comprehensiveCTA.contactChannels.channels.emergency.title"),
      number: t("comprehensiveCTA.contactChannels.channels.emergency.number"),
      response: t(
        "comprehensiveCTA.contactChannels.channels.emergency.description"
      ),
      icon: Shield,
      color: "bg-red-500",
    },
    {
      channel: t("comprehensiveCTA.contactChannels.channels.video.title"),
      number: t("comprehensiveCTA.contactChannels.channels.video.action"),
      response: t(
        "comprehensiveCTA.contactChannels.channels.video.description"
      ),
      icon: Video,
      color: "bg-purple-500",
    },
  ];

  const guarantees = [
    { icon: Shield, text: t("comprehensiveCTA.benefits.satisfaction") },
    { icon: Award, text: t("comprehensiveCTA.benefits.expertCare") },
    { icon: CheckCircle, text: t("comprehensiveCTA.benefits.safety") },
    { icon: Users, text: t("comprehensiveCTA.benefits.partnership") },
    { icon: Star, text: t("comprehensiveCTA.benefits.results") },
  ];

  return (
    <div className="space-y-20">
      {/* Multi-Level Engagement Strategy */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <Target className="w-4 h-4 mr-2" />
                {t("comprehensiveCTA.strategy.title")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
                {t("comprehensiveCTA.strategy.subtitle")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("comprehensiveCTA.strategy.description")}
              </p>
            </div>

            <div className="space-y-8">
              {engagementLevels.map((level) => {
                const IconComponent = level.icon;
                const isSelected = selectedIntent === level.id;

                return (
                  <Card
                    key={level.id}
                    className={`cursor-pointer transition-all duration-300 border-2 bg-card overflow-hidden ${
                      isSelected
                        ? "border-primary shadow-xl scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:shadow-lg"
                    }`}
                    onClick={() =>
                      setSelectedIntent(isSelected ? null : level.id)
                    }
                  >
                    <CardContent className="p-0">
                      <div className="grid lg:grid-cols-3 min-h-[200px]">
                        <div
                          className={`bg-gradient-to-br ${level.bgColor} p-6 flex flex-col justify-center min-h-[200px]`}
                        >
                          <div
                            className={`w-14 h-14 bg-gradient-to-r ${level.color} rounded-xl flex items-center justify-center mb-4 flex-shrink-0`}
                          >
                            <IconComponent className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-card-foreground mb-2 line-clamp-2">
                            {level.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                            {level.subtitle}
                          </p>
                          <p className="text-muted-foreground text-sm line-clamp-3 flex-grow">
                            {level.description}
                          </p>
                        </div>

                        <div className="lg:col-span-2 p-6 flex flex-col justify-center">
                          <div className="grid md:grid-cols-2 gap-3">
                            {(level.actions || []).map(
                              (action, actionIndex) => (
                                <Button
                                  key={actionIndex}
                                  variant={
                                    action.urgent ? "default" : "outline"
                                  }
                                  className={`h-auto p-3 justify-start min-h-[60px] ${
                                    action.urgent
                                      ? `bg-gradient-to-r ${level.color} hover:opacity-90 text-white`
                                      : `border-border text-foreground hover:bg-muted`
                                  }`}
                                >
                                  <div className="text-left flex-grow">
                                    <div className="font-semibold text-sm line-clamp-1">
                                      {action.label}
                                    </div>
                                    <div className="text-xs opacity-75 line-clamp-1">
                                      {action.subtext}
                                    </div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 ml-2 flex-shrink-0" />
                                </Button>
                              )
                            )}
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

      {/* Omnichannel Contact */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <Phone className="w-4 h-4 mr-2" />
                {t("comprehensiveCTA.contactChannels.title")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
                {t("comprehensiveCTA.contactChannels.subtitle")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("comprehensiveCTA.contactChannels.description")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {(contactChannels || []).map((contact, index) => {
                const IconComponent = contact.icon;

                return (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-all duration-300 border-0 bg-card"
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-r ${contact.color} rounded-full flex items-center justify-center`}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-card-foreground">
                            {contact.channel}
                          </CardTitle>
                          <p className="text-muted-foreground font-semibold">
                            {contact.number}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {contact.response}
                      </p>
                      <Button
                        className={`w-full bg-gradient-to-r ${contact.color} hover:opacity-90 text-white`}
                      >
                        {t(
                          "comprehensiveCTA.contactChannels.channels.whatsapp.button"
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Response Time Guarantees */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-4 bg-primary/10 rounded-lg">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="font-bold text-primary">2 Rings</div>
                <div className="text-xs text-muted-foreground">
                  {t("comprehensiveCTA.contactChannels.responseTimes.phone")}
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="font-bold text-primary">30 Seconds</div>
                <div className="text-xs text-muted-foreground">
                  {t("comprehensiveCTA.contactChannels.responseTimes.chat")}
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="font-bold text-primary">4 Hours</div>
                <div className="text-xs text-muted-foreground">
                  {t("comprehensiveCTA.contactChannels.responseTimes.email")}
                </div>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <Phone className="w-8 h-8 text-destructive mx-auto mb-2" />
                <div className="font-bold text-destructive">10 Minutes</div>
                <div className="text-xs text-muted-foreground">
                  {t("comprehensiveCTA.contactChannels.responseTimes.callback")}
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="font-bold text-primary">30 Minutes</div>
                <div className="text-xs text-muted-foreground">
                  {t(
                    "comprehensiveCTA.contactChannels.responseTimes.confirmation"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ultimate Value Proposition */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              {t("comprehensiveCTA.guarantees.title")}
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 leading-relaxed">
              {t("comprehensiveCTA.guarantees.subtitle")}
            </p>

            {/* Emotional Vision */}
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4">
                {t("comprehensiveCTA.transformLife.title")}
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary-foreground/70" />
                    <span>
                      {t("comprehensiveCTA.transformLife.benefits.0")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary-foreground/70" />
                    <span>
                      {t("comprehensiveCTA.transformLife.benefits.1")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary-foreground/70" />
                    <span>
                      {t("comprehensiveCTA.transformLife.benefits.2")}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary-foreground/70" />
                    <span>
                      {t("comprehensiveCTA.transformLife.benefits.3")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary-foreground/70" />
                    <span>
                      {t("comprehensiveCTA.transformLife.benefits.4")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary-foreground/70" />
                    <span>
                      {t("comprehensiveCTA.transformLife.benefits.5")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {(guarantees || []).map((guarantee, index) => {
                const IconComponent = guarantee.icon;
                return (
                  <div key={index} className="text-center">
                    <IconComponent className="w-8 h-8 text-primary-foreground/70 mx-auto mb-2" />
                    <div className="text-sm text-primary-foreground/80">
                      {guarantee.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final CTA */}
            <div className="space-y-6">
              <p className="text-lg text-primary-foreground/80">
                {t("comprehensiveCTA.guarantees.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4"
                  onClick={handleBookConsultation}
                >
                  {isAuthenticated ? "Book Consultation" : "Get Started"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-4"
                  onClick={handleFreeConsultation}
                >
                  {isAuthenticated ? "Book Free Consultation" : "Login"}
                </Button>
              </div>

              <p className="text-sm text-primary-foreground/70">
                {t("comprehensiveCTA.joinThousands.title")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {t("comprehensiveCTA.newsletter.title")}
            </h3>
            <p className="text-muted-foreground mb-8">
              {t("comprehensiveCTA.newsletter.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t("comprehensiveCTA.newsletter.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {t("comprehensiveCTA.newsletter.button")}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              {t("comprehensiveCTA.newsletter.privacy")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ComprehensiveCTA;
