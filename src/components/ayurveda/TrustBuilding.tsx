"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  CheckCircle,
  Clock,
  Star,
  Award,
  Heart,
  Brain,
  Phone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const TrustBuilding = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is Ayurveda scientifically proven and safe?",
      answer:
        "Absolutely proven and completely safe! Ayurveda is increasingly validated by modern research with thousands of published studies. We have contributed research to international peer-reviewed journals, and our treatments show measurable results in clinical parameters. Our approach combines 5000-year-old time-tested wisdom with modern safety standards, continuous monitoring, and scientific documentation. Zero major adverse events in 20,000+ treatments.",
      icon: Shield,
      color: "from-green-500 to-emerald-600",
    },
    {
      question: "Will treatments interfere with my current medications?",
      answer:
        "Our doctors are trained in both Ayurvedic and modern medicine interactions. We work closely with your existing healthcare providers to ensure safe, complementary treatment. Many patients gradually reduce medications under joint medical supervision as their natural healing progresses. We maintain detailed drug interaction databases and collaborate with your physicians throughout treatment.",
      icon: Heart,
      color: "from-blue-500 to-cyan-600",
    },
    {
      question: "How long does treatment really take to show results?",
      answer:
        "Treatment duration varies by condition and individual constitution. Acute conditions often improve within days, while chronic conditions typically show significant improvement within 3-6 weeks. We provide realistic, personalized timelines during consultation based on your specific case history and track progress weekly with measurable parameters.",
      icon: Clock,
      color: "from-orange-500 to-red-600",
    },
    {
      question: "Are Ayurvedic medicines completely safe for long-term use?",
      answer:
        "When prepared and prescribed correctly by qualified practitioners, Ayurvedic medicines are extremely safe with minimal side effects. Our in-house pharmacy follows strict international quality control measures, and all preparations are laboratory tested for purity, potency, and heavy metal content. We use only authentic, properly processed herbs from certified organic sources.",
      icon: CheckCircle,
      color: "from-purple-500 to-indigo-600",
    },
    {
      question: "What if I have a medical emergency during treatment?",
      answer:
        "We maintain partnerships with leading hospitals and have comprehensive emergency protocols in place. Our senior doctors are trained in both traditional and modern emergency care. We provide 24/7 consultation availability for any concerns during treatment, and our facility has emergency medical equipment and direct hospital connectivity.",
      icon: Phone,
      color: "from-red-500 to-pink-600",
    },
  ];

  const guarantees = [
    {
      condition: "Sciatica",
      guarantee: "70% pain reduction",
      timeframe: "14 days",
      measurement: "VAS pain scale + mobility tests",
      successRate: 92,
    },
    {
      condition: "Chronic Knee Pain",
      guarantee: "Walking without support",
      timeframe: "21 days",
      measurement: "Distance walked + pain scale",
      successRate: 95,
    },
    {
      condition: "Frozen Shoulder",
      guarantee: "50% mobility increase",
      timeframe: "30 days",
      measurement: "Range of motion measurement",
      successRate: 88,
    },
    {
      condition: "Tennis Elbow",
      guarantee: "Return to normal activities",
      timeframe: "10 days",
      measurement: "Grip strength + pain assessment",
      successRate: 94,
    },
    {
      condition: "Plantar Fasciitis",
      guarantee: "Pain-free walking",
      timeframe: "15 days",
      measurement: "Morning pain + walking test",
      successRate: 90,
    },
    {
      condition: "Cervical Spondylosis",
      guarantee: "60% symptom improvement",
      timeframe: "20 days",
      measurement: "Neck mobility + pain reduction",
      successRate: 87,
    },
    {
      condition: "Arthritis",
      guarantee: "Joint function improvement",
      timeframe: "25 days",
      measurement: "Joint assessment + inflammation markers",
      successRate: 89,
    },
    {
      condition: "Fertility Issues",
      guarantee: "Conception support",
      timeframe: "180 days",
      measurement: "Medical tests + monitoring",
      successRate: 88,
    },
  ];

  const certifications = [
    {
      name: "ISO 9001:2015",
      description: "Quality Management System",
      icon: Award,
    },
    {
      name: "NABH Accreditation",
      description: "National Accreditation Board for Hospitals",
      icon: Shield,
    },
    {
      name: "Government Certified",
      description: "Ministry of AYUSH certification",
      icon: CheckCircle,
    },
    {
      name: "WHO-GMP Compliance",
      description: "Laboratory certification for medicine preparation",
      icon: Star,
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
                Fear Elimination & Complete Trust Building
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
                Every Concern Addressed with Expert Care
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Get honest, detailed answers to all your questions about
                Ayurvedic treatment
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const IconComponent = faq.icon;
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
                            className={`w-12 h-12 bg-gradient-to-r ${faq.color} rounded-full flex items-center justify-center`}
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
                                value={item.successRate}
                                className="w-16 h-2"
                              />
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {item.successRate}%
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
                      "Feel 50% better after first session or receive additional
                      support"
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
                const IconComponent = cert.icon;

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
