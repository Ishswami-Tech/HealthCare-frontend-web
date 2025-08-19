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

const TrustBuilding = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question:
        "What makes your treatments different from other Ayurvedic centers?",
      answer:
        "We combine traditional authentic Ayurveda with modern scientific validation. Our treatments are research-backed, government certified, and have documented success rates of 90%+.",
    },
    {
      question: "How long does it take to see results?",
      answer:
        "Results vary by condition and treatment type. Agnikarma shows immediate relief within 1-3 sessions. Viddhakarma typically shows improvement in 2-4 weeks.",
    },
    {
      question: "Are your treatments safe for all ages?",
      answer:
        "Yes, our treatments are completely natural and safe for all ages. We have successfully treated children as young as 3 years and patients over 80 years old.",
    },
    {
      question: "Do you provide treatment guarantees?",
      answer:
        "We provide specific measurable guarantees for each condition with defined timelines. If you do not achieve the promised improvement, we provide additional sessions at no cost.",
    },
    {
      question: "What certifications do you have?",
      answer:
        "We are government certified, ISO accredited, and have received multiple awards for excellence in Ayurvedic healthcare.",
    },
  ];

  const guarantees = [
    {
      condition: "Chronic Pain Relief",
      guarantee: "50% reduction in pain",
      timeframe: "Within 2 weeks",
      measurement: "Pain scale assessment",
    },
    {
      condition: "Neurological Disorders",
      guarantee: "Significant improvement",
      timeframe: "Within 4 weeks",
      measurement: "Neurological evaluation",
    },
    {
      condition: "Stress & Anxiety",
      guarantee: "Calm and peaceful mind",
      timeframe: "Within 1 week",
      measurement: "Stress level assessment",
    },
    {
      condition: "Digestive Issues",
      guarantee: "Improved digestion",
      timeframe: "Within 3 days",
      measurement: "Digestive health evaluation",
    },
    {
      condition: "Sleep Quality",
      guarantee: "Better sleep patterns",
      timeframe: "Within 1 week",
      measurement: "Sleep quality assessment",
    },
    {
      condition: "Energy Levels",
      guarantee: "Increased vitality",
      timeframe: "Within 2 weeks",
      measurement: "Energy level assessment",
    },
    {
      condition: "Immunity Boost",
      guarantee: "Stronger immune system",
      timeframe: "Within 3 weeks",
      measurement: "Immunity assessment",
    },
    {
      condition: "Overall Wellness",
      guarantee: "Complete transformation",
      timeframe: "Within 21 days",
      measurement: "Comprehensive health evaluation",
    },
  ];

  const certifications = [
    {
      name: "Government Certified",
      description: "Officially recognized by health authorities",
    },
    {
      name: "ISO Accredited",
      description: "International quality standards certified",
    },
    {
      name: "Ayurvedic Excellence Award",
      description: "Recognized for outstanding Ayurvedic care",
    },
    {
      name: "Patient Safety Certified",
      description: "Highest standards of patient safety",
    },
  ];

  return (
    <div className="space-y-20">
      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 mb-4">
                <Shield className="w-4 h-4 mr-2" />
                Trust & Transparency
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Everything you need to know about our treatments and guarantees
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const IconComponent = Shield; // Default icon
                const isOpen = openFaq === index;

                return (
                  <Card
                    key={index}
                    className="bg-white shadow-lg border-0 overflow-hidden"
                  >
                    <CardHeader
                      className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center`}
                          >
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {faq.question}
                          </h3>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </CardHeader>
                    {isOpen && (
                      <CardContent className="pt-0">
                        <div className="pl-16">
                          <p className="text-gray-700 leading-relaxed">
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
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800 mb-4">
                <Target className="w-4 h-4 mr-2" />
                Comprehensive Guarantee Matrix
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
                Our Promise to You - Guaranteed Results
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Measurable outcomes with specific timelines for every condition
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg font-semibold">
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
                      className="hover:shadow-md transition-shadow duration-300 rounded-none border-x border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <CardContent className="p-4">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.condition}
                          </div>
                          <div className="text-center text-green-600 dark:text-green-400 font-medium">
                            {item.guarantee}
                          </div>
                          <div className="text-center">
                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                              {item.timeframe}
                            </Badge>
                          </div>
                          <div className="text-center text-gray-700 dark:text-gray-300 text-sm">
                            {item.measurement}
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Progress
                                value={90} // Hardcoded success rate
                                className="w-16 h-2"
                              />
                              <span className="font-bold text-green-600 dark:text-green-400">
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
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Instant Results Challenge
                    </h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                      &quot;Feel 50% better after first session or receive
                      additional support&quot;
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Live pain scale rating with witnesses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Immediate mobility tests documented</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Patient satisfaction survey</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
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
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4">
                <Award className="w-4 h-4 mr-2" />
                Certifications & Accreditations
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Internationally Recognized Excellence
              </h2>
              <p className="text-lg text-gray-600">
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
                    className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white"
                  >
                    <CardContent className="p-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {cert.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
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
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  20,000+
                </div>
                <div className="text-sm text-gray-600">
                  Treatments with Zero Major Adverse Events
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  95%
                </div>
                <div className="text-sm text-gray-600">
                  Patient Satisfaction Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  50+
                </div>
                <div className="text-sm text-gray-600">
                  Research Publications
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  24/7
                </div>
                <div className="text-sm text-gray-600">
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
