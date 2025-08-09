"use client";

import React from "react";
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
  Users,
} from "lucide-react";

const TreatmentOverview = () => {
  const treatments = [
    {
      id: "panchakarma",
      title: "Panchakarma",
      subtitle: "Complete Detoxification",
      icon: Droplets,
      color: "from-blue-500 to-cyan-600",
      bgColor:
        "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      description:
        "5000-year-old complete body-mind-soul purification system with five sacred procedures.",
      features: [
        "Complete detoxification",
        "Treats root cause",
        "21-day program",
        "Scientifically validated",
      ],
      conditions: [
        "Chronic Diseases",
        "Digestive Disorders",
        "Skin Conditions",
        "Mental Health",
      ],
      successRate: 95,
      duration: "21 days",
      href: "/ayurveda/panchakarma",
    },
    {
      id: "agnikarma",
      title: "Agnikarma",
      subtitle: "Therapeutic Heat Healing",
      icon: Flame,
      color: "from-orange-500 to-red-600",
      bgColor:
        "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
      description:
        "Precision fire therapy for instant pain relief using controlled micro-cauterization.",
      features: [
        "Instant pain relief",
        "Zero side effects",
        "Precision targeting",
        "Permanent solution",
      ],
      conditions: [
        "Chronic Knee Pain",
        "Sciatica",
        "Frozen Shoulder",
        "Arthritis",
      ],
      successRate: 92,
      duration: "3-5 sessions",
      href: "/ayurveda/agnikarma",
    },
    {
      id: "viddha-karma",
      title: "Viddha Karma",
      subtitle: "Precision Needling Therapy",
      icon: Zap,
      color: "from-purple-500 to-indigo-600",
      bgColor:
        "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
      description:
        "Strategic marma point stimulation using specialized instruments for complete healing.",
      features: [
        "Marma point targeting",
        "Energy flow restoration",
        "Deep tissue healing",
        "Nervous system balance",
      ],
      conditions: [
        "Neurological Disorders",
        "Joint Pain",
        "Digestive Issues",
        "Stress & Anxiety",
      ],
      successRate: 89,
      duration: "4-6 sessions",
      href: "/ayurveda/viddha-karma",
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800 mb-4">
            <Heart className="w-4 h-4 mr-2" />
            Comprehensive Treatment Offerings
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
            Ancient Healing Arts for Modern Wellness
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the power of authentic Ayurvedic treatments, each
            designed to address specific health challenges with proven results
            and lasting transformation.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {treatments.map((treatment) => {
            const IconComponent = treatment.icon;

            return (
              <Card
                key={treatment.id}
                className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
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
                    <CardTitle className="text-2xl font-playfair font-bold text-gray-900 dark:text-white mb-2">
                      {treatment.title}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      {treatment.subtitle}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    {treatment.description}
                  </p>

                  {/* Key Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Key Benefits:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {treatment.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conditions Treated */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Treats:
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
                        className="text-xs text-gray-500 dark:text-gray-400"
                      >
                        +{treatment.conditions.length - 2} more
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-lg text-gray-900">
                          {treatment.successRate}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        Success Rate
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-lg text-gray-900">
                          {treatment.duration}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">Duration</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link href={treatment.href}>
                      <Button
                        className={`w-full bg-gradient-to-r ${treatment.color} hover:opacity-90 text-white group-hover:shadow-lg transition-all duration-300`}
                      >
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Book Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-playfair font-bold mb-4">
              Not Sure Which Treatment is Right for You?
            </h3>
            <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
              Take our comprehensive health assessment or speak with our
              Ayurvedic experts to get personalized treatment recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-orange-600 hover:bg-orange-50"
              >
                Take Health Assessment
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Speak with Expert
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TreatmentOverview;
