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
  AlertCircle,
  Clock,
  Users,
  Shield,
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
    <div className="relative min-h-screen flex items-center bg-background ayurveda-gradient">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full">
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Trust Indicators */}
            <StaggerContainer className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Badge className="bg-primary/10 text-primary border-primary/20 glass interactive">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t("hero.trustIndicators.governmentCertified")}
                  </Badge>
                </HoverAnimation>
              </StaggerItem>
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Badge className="bg-primary/10 text-primary border-primary/20 glass interactive">
                    <Award className="w-3 h-3 mr-1" />
                    {t("hero.trustIndicators.iso9001")}
                  </Badge>
                </HoverAnimation>
              </StaggerItem>
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Badge className="bg-primary/10 text-primary border-primary/20 glass interactive">
                    <Star className="w-3 h-3 mr-1" />
                    {t("hero.trustIndicators.rating")}
                  </Badge>
                </HoverAnimation>
              </StaggerItem>
            </StaggerContainer>

            {/* Enhanced Main Headline with Advanced Animations */}
            <ScrollReveal direction="up">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight gradient-text">
                <div className="block">{t("hero.title1")}</div>

                <div
                  className="block text-primary"
                  style={{
                    backgroundSize: "200% 200%",
                  }}
                >
                  <div className="block">{t("hero.title2")}</div>
                </div>

                <div className="block">
                  <div className="block">{t("hero.title")}</div>
                </div>
              </h1>
            </ScrollReveal>

            {/* Subheadline */}
            <ScrollReveal direction="up" delay={0.3}>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                {t("hero.description")}
              </p>
            </ScrollReveal>

            {/* Key Benefits */}
            <ScrollReveal direction="up" delay={0.4}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{t("hero.benefits.yearsExperience")}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{t("hero.benefits.patientsHealed")}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>{t("hero.benefits.governmentCertified")}</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Live Social Proof */}
            <ScrollReveal direction="up" delay={0.5}>
              <HoverAnimation type="lift">
                <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 mb-8 border border-border shadow-lg glass">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-semibold text-card-foreground">
                        Live Activity
                      </span>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 glass interactive">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      High Demand
                    </Badge>
                  </div>
                  <div
                    className="text-sm text-muted-foreground"
                    key={currentTestimonial}
                  >
                    {testimonials[currentTestimonial]}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>
                      <CounterAnimation
                        from={100}
                        to={liveCount}
                        suffix=" people viewing"
                      />
                    </span>
                    <span>Bookings Increased</span>
                  </div>
                </div>
              </HoverAnimation>
            </ScrollReveal>

            {/* Enhanced Action Buttons */}
            <StaggerContainer
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8"
              staggerDelay={0.2}
            >
              <StaggerItem>
                <HoverAnimation type="glow">
                  <div className="relative">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold px-10 py-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden interactive"
                    >
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      <div className="relative z-10 flex items-center space-x-2">
                        <div className="text-2xl">🔥</div>
                        {t("hero.primaryCta")}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
                    </Button>
                  </div>
                </HoverAnimation>
              </StaggerItem>

              <StaggerItem>
                <HoverAnimation type="scale">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-3 border-primary text-primary hover:bg-primary/10 hover:border-primary/80 text-lg font-semibold px-10 py-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group interactive"
                    >
                      <div className="flex items-center space-x-2">
                        <Phone className="w-6 h-6" />
                        {t("hero.secondaryCta")}
                      </div>
                    </Button>
                  </div>
                </HoverAnimation>
              </StaggerItem>
            </StaggerContainer>

            {/* Secondary Actions */}
            <StaggerContainer
              className="flex flex-wrap justify-center lg:justify-start gap-4 mt-6"
              staggerDelay={0.1}
            >
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-primary/80 interactive"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Journeys
                  </Button>
                </HoverAnimation>
              </StaggerItem>
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-primary/80 interactive"
                  >
                    🏥 Virtual Tour
                  </Button>
                </HoverAnimation>
              </StaggerItem>
              <StaggerItem>
                <HoverAnimation type="scale">
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-primary/80 interactive"
                  >
                    📋 Health Assessment
                  </Button>
                </HoverAnimation>
              </StaggerItem>
            </StaggerContainer>

            {/* Urgency Notice */}
            <div className="mt-6 p-3 bg-primary/10 border border-primary/20 rounded-lg glass animate-pulse-soft">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Today Only
                </span>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            <Card className="bg-card/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden glass card-hover">
              <CardContent className="p-0">
                <div className="aspect-video bg-primary/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg interactive">
                      <span className="text-4xl">🕉️</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Ayurvedic Wisdom
                    </h3>
                    <p className="text-muted-foreground px-4">
                      Discover the ancient art of Ayurveda and its modern
                      application.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-6">
                  <div className="text-center glass p-3 rounded-lg interactive">
                    <div className="text-2xl font-bold text-primary gradient-text">
                      5000+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Lives Transformed
                    </div>
                  </div>
                  <div className="text-center glass p-3 rounded-lg interactive">
                    <div className="text-2xl font-bold text-primary gradient-text">
                      20+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Years Legacy
                    </div>
                  </div>
                  <div className="text-center glass p-3 rounded-lg interactive">
                    <div className="text-2xl font-bold text-primary gradient-text">
                      95%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Success Rate
                    </div>
                  </div>
                  <div className="text-center glass p-3 rounded-lg interactive">
                    <div className="text-2xl font-bold text-primary gradient-text">
                      4.9★
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Patient Rating
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground p-3 rounded-full shadow-lg animate-bounce interactive">
              <MessageCircle className="w-6 h-6" />
            </div>

            <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground p-3 rounded-full shadow-lg interactive">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
