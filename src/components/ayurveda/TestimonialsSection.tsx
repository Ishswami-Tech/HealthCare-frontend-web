"use client";

import React, { useState, useEffect } from "react";
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
      name: "Rajesh Kumar",
      age: 48,
      location: "Delhi",
      condition: "Diabetes & Hypertension",
      treatment: "21-day Panchakarma",
      rating: 5,
      image: "/api/placeholder/80/80",
      quote:
        "The 21-day Panchakarma program was life-changing. My diabetes is now under control without heavy medications, and my blood pressure has normalized. I feel 20 years younger!",
      result: "Medication reduced by 70%",
      videoUrl: "#",
    },
    {
      id: 5,
      name: "Sunita Joshi",
      age: 35,
      location: "Bangalore",
      condition: "PCOD & Fertility Issues",
      treatment: "Specialized Fertility Program",
      rating: 5,
      image: "/api/placeholder/80/80",
      quote:
        "After struggling with PCOD for years, the fertility program here helped me conceive naturally. The holistic approach addressed not just my physical health but emotional well-being too.",
      result: "Successful natural conception",
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
    <section className="py-20 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-4">
            <Heart className="w-4 h-4 mr-2" />
            {t("testimonials.title")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
            {t("testimonials.subtitle")}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t("testimonials.description")}
          </p>
        </div>

        {/* Main Testimonial */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-white shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                {/* Left Side - Patient Info */}
                <div className="p-8 bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {current.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{current.name}</h3>
                      <p className="text-orange-100">
                        Age {current.age}, {current.location}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        {[...Array(current.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-current text-yellow-300"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-orange-100 mb-1">
                        Condition Treated:
                      </h4>
                      <p className="font-medium">{current.condition}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-100 mb-1">
                        Treatment Received:
                      </h4>
                      <p className="font-medium">{current.treatment}</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-100 mb-1">
                        Result Achieved:
                      </h4>
                      <p className="font-bold text-lg">{current.result}</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="mt-6 bg-white text-orange-600 hover:bg-orange-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Video Story
                  </Button>
                </div>

                {/* Right Side - Testimonial */}
                <div className="p-8 flex flex-col justify-center">
                  <Quote className="w-12 h-12 text-orange-300 mb-6" />
                  <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 italic">
                    &quot;{current.quote}&quot;
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        Verified Patient
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
                  ? "bg-orange-500 w-8"
                  : "bg-orange-200 hover:bg-orange-300"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              4,200+
            </div>
            <div className="text-sm text-gray-600">Patient Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">4.9★</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">95%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">100%</div>
            <div className="text-sm text-gray-600">Verified Stories</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Ready to start your own healing journey?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
            >
              Book Your Consultation
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              View All Success Stories
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
