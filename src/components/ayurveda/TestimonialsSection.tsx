"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Play,
  Heart,
  CheckCircle,
} from "lucide-react";

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: t("testimonials.patients.rekha.name"),
      age: 45,
      location: t("testimonials.patients.rekha.location"),
      condition: t("testimonials.patients.rekha.condition"),
      treatment: t("testimonials.patients.rekha.treatment"),
      rating: 5,
      image: "/api/placeholder/80/80",
      quote: t("testimonials.patients.rekha.quote"),
      result: t("testimonials.patients.rekha.result"),
      videoUrl: "#",
    },
    {
      id: 2,
      name: t("testimonials.patients.suresh.name"),
      age: 52,
      location: t("testimonials.patients.suresh.location"),
      condition: t("testimonials.patients.suresh.condition"),
      treatment: t("testimonials.patients.suresh.treatment"),
      rating: 5,
      image: "/api/placeholder/80/80",
      quote: t("testimonials.patients.suresh.quote"),
      result: t("testimonials.patients.suresh.result"),
      videoUrl: "#",
    },
    {
      id: 3,
      name: t("testimonials.patients.priya.name"),
      age: 38,
      location: t("testimonials.patients.priya.location"),
      condition: t("testimonials.patients.priya.condition"),
      treatment: t("testimonials.patients.priya.treatment"),
      rating: 5,
      image: "/api/placeholder/80/80",
      quote: t("testimonials.patients.priya.quote"),
      result: t("testimonials.patients.priya.result"),
      videoUrl: "#",
    },
    {
      id: 4,
      name: t("testimonials.patients.rajesh.name"),
      age: 48,
      location: t("testimonials.patients.rajesh.location"),
      condition: t("testimonials.patients.rajesh.condition"),
      treatment: t("testimonials.patients.rajesh.treatment"),
      rating: 5,
      image: "/api/placeholder/80/80",
      quote: t("testimonials.patients.rajesh.quote"),
      result: t("testimonials.patients.rajesh.result"),
      videoUrl: "#",
    },
    {
      id: 5,
      name: t("testimonials.patients.sunita.name"),
      age: 35,
      location: t("testimonials.patients.sunita.location"),
      condition: t("testimonials.patients.sunita.condition"),
      treatment: t("testimonials.patients.sunita.treatment"),
      rating: 5,
      image: "/api/placeholder/80/80",
      quote: t("testimonials.patients.sunita.quote"),
      result: t("testimonials.patients.sunita.result"),
      videoUrl: "#",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const current = testimonials[currentTestimonial] || testimonials[0]!;

  return (
    <section className="bg-base-200/55 py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center sm:mb-14">
          <Badge className="mb-4 border-primary/20 bg-primary/10 px-4 py-1.5 text-primary">
            <Heart className="w-4 h-4 mr-2" />
            {t("testimonials.title")}
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("testimonials.subtitle")}
          </h2>
          <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t("testimonials.description")}
          </p>
        </div>

        {/* Main Testimonial */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="overflow-hidden border-border/80 bg-card/95 shadow-xl ring-1 ring-border/30 animate-fade-in-up">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                {/* Left Side - Patient Info */}
                <div className="bg-primary p-6 text-primary-foreground sm:p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-primary-foreground/15 rounded-full flex items-center justify-center interactive">
                      <span className="text-2xl font-bold">
                        {current.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{current.name}</h3>
                      <p className="text-primary-foreground/80">
                        {t("testimonials.age")} {current.age},{" "}
                        {current.location}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        {[...Array(current.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-current text-primary-foreground"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-primary-foreground/80 mb-1">
                        {t("testimonials.conditionTreated")}:
                      </h4>
                      <p className="font-medium">{current.condition}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-foreground/80 mb-1">
                        {t("testimonials.treatmentReceived")}:
                      </h4>
                      <p className="font-medium">{current.treatment}</p>
                    </div>
                    <div className="bg-primary-foreground/20 rounded-lg p-4">
                      <h4 className="font-semibold text-primary-foreground/80 mb-1">
                        {t("testimonials.resultAchieved")}:
                      </h4>
                      <p className="font-bold text-lg">{current.result}</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="mt-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90 interactive"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t("testimonials.watchVideo")}
                  </Button>
                </div>

                {/* Right Side - Testimonial */}
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <Quote className="w-12 h-12 text-primary/60 mb-6 animate-pulse-soft" />
                  <blockquote className="text-lg text-card-foreground leading-relaxed mb-6 italic">
                    &quot;{current.quote}&quot;
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {t("testimonials.verifiedPatient")}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevTestimonial}
                        className="rounded-full w-10 h-10 p-0"
                        aria-label="Previous testimonial"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextTestimonial}
                        className="rounded-full w-10 h-10 p-0"
                        aria-label="Next testimonial"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonial Indicators */}
        <div className="flex justify-center space-x-2 mb-12">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentTestimonial
                  ? "bg-primary w-8"
                  : "bg-primary/20 hover:bg-primary/30"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up">
          <div className="rounded-2xl border border-border/70 bg-card/95 p-4 text-center shadow-sm">
            <div className="mb-1 text-2xl font-bold text-foreground">
              4,200+
            </div>
            <div className="text-sm text-muted-foreground">
              {t("testimonials.stats.patientReviews")}
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/95 p-4 text-center shadow-sm">
            <div className="mb-1 text-2xl font-bold text-foreground">
              4.9★
            </div>
            <div className="text-sm text-muted-foreground">
              {t("testimonials.stats.averageRating")}
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/95 p-4 text-center shadow-sm">
            <div className="mb-1 text-2xl font-bold text-foreground">
              95%
            </div>
            <div className="text-sm text-muted-foreground">
              {t("testimonials.stats.successRate")}
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/95 p-4 text-center shadow-sm">
            <div className="mb-1 text-2xl font-bold text-foreground">
              100%
            </div>
            <div className="text-sm text-muted-foreground">
              {t("testimonials.stats.verifiedStories")}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            {t("testimonials.cta.title")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground interactive"
            >
              {t("testimonials.cta.bookConsultation")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/5 interactive"
            >
              {t("testimonials.cta.viewStories")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
