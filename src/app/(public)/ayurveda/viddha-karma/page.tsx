"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  CheckCircle,
  Star,
  Target,
  Brain,
  Heart,
  Shield,
  Award,
  Activity,
} from "lucide-react";

export default function ViddhaKarmaPage() {
  const { t } = useTranslation();
  const processSteps = [
    {
      step: 1,
      title: "Marma Point Mapping",
      description: "Identifying vital energy points specific to condition",
      icon: Target,
      color: "from-blue-500 to-cyan-600",
    },
    {
      step: 2,
      title: "Ultra-Fine Needling",
      description: "Sterile, single-use micro-needles for precise stimulation",
      icon: Zap,
      color: "from-purple-500 to-indigo-600",
    },
    {
      step: 3,
      title: "Energy Flow Restoration",
      description: "Clearing blockages in prana (life energy) channels",
      icon: Activity,
      color: "from-green-500 to-emerald-600",
    },
    {
      step: 4,
      title: "Dosha Balancing",
      description: "Harmonizing Vata, Pitta, Kapha for optimal health",
      icon: Heart,
      color: "from-orange-500 to-red-600",
    },
    {
      step: 5,
      title: "Deep Tissue Healing",
      description: "Stimulating circulation and natural repair mechanisms",
      icon: Shield,
      color: "from-pink-500 to-rose-600",
    },
  ];

  const specializedApplications = [
    {
      category: "Neurological Disorders",
      treatments: ["Facial paralysis", "Trigeminal neuralgia"],
      benefits: "Nerve regeneration",
      successRate: 89,
      color: "from-blue-500 to-indigo-600",
    },
    {
      category: "Joint & Muscle Pain",
      treatments: ["Arthritis", "Fibromyalgia", "Spasms"],
      benefits: "Deep tissue healing",
      successRate: 92,
      color: "from-green-500 to-emerald-600",
    },
    {
      category: "Digestive Issues",
      treatments: ["IBS", "Constipation", "Acidity"],
      benefits: "Digestive fire enhancement",
      successRate: 85,
      color: "from-orange-500 to-red-600",
    },
    {
      category: "Respiratory Problems",
      treatments: ["Asthma", "Bronchitis", "Chronic cough"],
      benefits: "Lung capacity improvement",
      successRate: 87,
      color: "from-cyan-500 to-blue-600",
    },
    {
      category: "Stress & Mental Health",
      treatments: ["Anxiety", "Insomnia", "Depression"],
      benefits: "Nervous system balancing",
      successRate: 83,
      color: "from-purple-500 to-violet-600",
    },
    {
      category: "Women&apos;s Health",
      treatments: ["PCOD", "Irregular periods", "Fertility"],
      benefits: "Hormonal harmony",
      successRate: 88,
      color: "from-pink-500 to-rose-600",
    },
  ];

  const advancedTechniques = [
    {
      name: "Micro-Viddha",
      description: "For sensitive areas and pediatric patients",
      icon: Target,
      color: "from-blue-500 to-cyan-600",
    },
    {
      name: "Agni-Viddha",
      description: "Combining heat therapy with needling",
      icon: Zap,
      color: "from-orange-500 to-red-600",
    },
    {
      name: "Herbal-Viddha",
      description: "Using medicated needles for enhanced healing",
      icon: Heart,
      color: "from-green-500 to-emerald-600",
    },
    {
      name: "Marma-Viddha",
      description: "Targeting specific energy points for maximum impact",
      icon: Activity,
      color: "from-purple-500 to-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-6">
              <Zap className="w-4 h-4 mr-2" />
              {t("viddhakarma.badge")}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-6">
              {t("viddhakarma.title")}
            </h1>

            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              {t("viddhakarma.subtitle")}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                89% Success Rate
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Target className="w-4 h-4 mr-2" />
                107 Marma Points
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Shield className="w-4 h-4 mr-2" />
                Scientifically Proven
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-lg px-8"
              >
                Book Viddha Karma Session
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50 text-lg px-8"
              >
                Free Marma Assessment
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Viddha Karma */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Understanding Viddha Karma
              </h2>
              <p className="text-lg text-gray-600">
                The science behind precision needling therapy
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Scientific Definition
                  </h3>
                  <p className="text-sm text-gray-600">
                    Therapeutic needling technique using specialized instruments
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Historical Significance
                  </h3>
                  <p className="text-sm text-gray-600">
                    Foundation of Ayurvedic para-surgery from classical texts
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Modern Relevance
                  </h3>
                  <p className="text-sm text-gray-600">
                    Scientifically proven method for chronic pain management
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Marma Science
                  </h3>
                  <p className="text-sm text-gray-600">
                    Targeting 107 vital energy points for maximum healing
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Process */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Viddha Karma Treatment Process
              </h2>
              <p className="text-lg text-gray-600">
                Precision healing through strategic energy point stimulation
              </p>
            </div>

            <div className="space-y-8">
              {processSteps.map((step, index) => {
                const IconComponent = step.icon;

                return (
                  <Card
                    key={index}
                    className="bg-white shadow-lg border-0 overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="grid lg:grid-cols-4">
                        <div
                          className={`bg-gradient-to-br ${step.color} text-white p-8 flex flex-col justify-center`}
                        >
                          <div className="text-center lg:text-left">
                            <div className="text-4xl font-bold mb-2">
                              {step.step}
                            </div>
                            <IconComponent className="w-12 h-12 mx-auto lg:mx-0 mb-4" />
                          </div>
                        </div>

                        <div className="lg:col-span-3 p-8 flex flex-col justify-center">
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            {step.title}
                          </h3>
                          <p className="text-lg text-gray-700 leading-relaxed">
                            {step.description}
                          </p>
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

      {/* Specialized Applications */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Specialized Applications
              </h2>
              <p className="text-lg text-gray-600">
                Targeted healing for specific health conditions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {specializedApplications.map((application, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50"
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${application.color} rounded-full flex items-center justify-center mb-4`}
                    >
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 mb-2">
                      {application.category}
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800 w-fit">
                      {application.successRate}% Success Rate
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Specific Treatments:
                        </h4>
                        <ul className="space-y-1">
                          {application.treatments.map(
                            (treatment, treatmentIndex) => (
                              <li
                                key={treatmentIndex}
                                className="flex items-center space-x-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-gray-700">
                                  {treatment}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Unique Benefits:
                        </h4>
                        <p className="text-gray-700">{application.benefits}</p>
                      </div>

                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Success Rate
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {application.successRate}%
                          </span>
                        </div>
                        <Progress
                          value={application.successRate}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Techniques */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Advanced Viddha Karma Techniques
              </h2>
              <p className="text-lg text-gray-600">
                Specialized approaches for different conditions and patient
                needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {advancedTechniques.map((technique, index) => {
                const IconComponent = technique.icon;

                return (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white"
                  >
                    <CardContent className="p-8">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${technique.color} rounded-full flex items-center justify-center mx-auto mb-6`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {technique.name}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {technique.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Packages */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Viddha Karma Treatment Packages
              </h2>
              <p className="text-lg text-gray-600">
                Choose the program that best fits your healing needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg text-gray-900">
                    Essential Treatment
                  </CardTitle>
                  <div className="text-2xl font-bold text-purple-600">
                    4 Sessions
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Stress-related conditions</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Success Rate</span>
                    <span className="font-bold text-green-600">85%</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    Choose Package
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-orange-300 relative">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white">
                  Most Popular
                </Badge>
                <CardHeader className="text-center">
                  <CardTitle className="text-lg text-gray-900">
                    Comprehensive Care
                  </CardTitle>
                  <div className="text-2xl font-bold text-purple-600">
                    6 Sessions
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Chronic pain conditions</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Success Rate</span>
                    <span className="font-bold text-green-600">90%</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white">
                    Choose Package
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg text-gray-900">
                    Advanced Healing
                  </CardTitle>
                  <div className="text-2xl font-bold text-purple-600">
                    8 Sessions
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Complex disorders + medicines</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Success Rate</span>
                    <span className="font-bold text-green-600">92%</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    Choose Package
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gold-300 bg-gradient-to-br from-yellow-50 to-orange-50">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white">
                  Premium
                </Badge>
                <CardHeader className="text-center">
                  <CardTitle className="text-lg text-gray-900">
                    Holistic Transformation
                  </CardTitle>
                  <div className="text-2xl font-bold text-purple-600">
                    Complete Program
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Total mind-body wellness</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Success Rate</span>
                    <span className="font-bold text-green-600">95%</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                    Choose Package
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              Unlock Your Body&apos;s Natural Healing Power
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Experience the precision of Viddha Karma therapy. Restore energy
              flow, balance your doshas, and achieve complete wellness
              naturally.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8"
              >
                Book Viddha Karma Session
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                Free Marma Assessment
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-purple-100">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>107 Marma Points</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Safe & Natural</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>89% Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
