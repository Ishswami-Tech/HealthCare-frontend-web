"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Droplets,
  Flame,
  Zap,
  Heart,
  Baby,
  GraduationCap,
  Building,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Award,
} from "lucide-react";

import { ServicesCatalog } from "@/components/services/services-catalog";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function TreatmentsPage() {
  const mainTreatments = [
    {
      id: "panchakarma",
      title: "Panchakarma",
      subtitle: "Complete Detoxification",
      icon: Droplets,
      color: "from-primary to-primary/80",
      bgColor: "from-background to-muted/50",
      description:
        "5000-year-old complete body-mind-soul purification system with five sacred procedures.",
      successRate: 95,
      duration: "21 days",
      sessions: "21-day program",
      conditions: [
        "Chronic Diseases",
        "Digestive Disorders",
        "Skin Conditions",
        "Mental Health",
      ],
      href: "/panchakarma",
    },
    {
      id: "agnikarma",
      title: "Agnikarma",
      subtitle: "Therapeutic Heat Healing",
      icon: Flame,
      color: "from-primary to-primary/80",
      bgColor: "from-background to-muted/50",
      description:
        "Precision fire therapy for instant pain relief using controlled micro-cauterization.",
      successRate: 92,
      duration: "2-3 weeks",
      sessions: "3-5 sessions",
      conditions: [
        "Chronic Knee Pain",
        "Sciatica",
        "Frozen Shoulder",
        "Arthritis",
      ],
      href: "/agnikarma",
    },
    {
      id: "viddha-karma",
      title: "Viddha Karma",
      subtitle: "Precision Needling Therapy",
      icon: Zap,
      color: "from-primary to-primary/80",
      bgColor: "from-background to-muted/50",
      description:
        "Strategic marma point stimulation using specialized instruments for complete healing.",
      successRate: 89,
      duration: "3-4 weeks",
      sessions: "4-6 sessions",
      conditions: [
        "Neurological Disorders",
        "Joint Pain",
        "Digestive Issues",
        "Stress & Anxiety",
      ],
      href: "/viddha-karma",
    },
  ];

  const specializedPrograms = [
    {
      title: "Fertility & Reproductive Health",
      icon: Baby,
      color: "from-primary to-primary/80",
      description:
        "Natural solutions for creating new life with comprehensive fertility services.",
      services: [
        "Male Fertility Enhancement",
        "Female Fertility Optimization",
        "PCOD/PCOS Treatment",
        "IVF Support",
      ],
      successRate: 88,
    },
    {
      title: "Corporate Wellness",
      icon: Building,
      color: "from-primary to-primary/80",
      description:
        "Executive health programs and workplace stress management solutions.",
      services: [
        "Executive Health Programs",
        "Workplace Stress Management",
        "Employee Wellness Days",
        "Ergonomic Consultations",
      ],
      successRate: 92,
    },
    {
      title: "Ayurveda Education",
      icon: GraduationCap,
      color: "from-primary to-primary/80",
      description:
        "Professional training programs to become certified Ayurvedic healers.",
      services: [
        "Certificate Courses",
        "Diploma Programs",
        "Advanced Specialization",
        "International Certification",
      ],
      successRate: 96,
    },
    {
      title: "Community Seva",
      icon: Heart,
      color: "from-primary to-primary/80",
      description:
        "Free healing services to humanity as our sacred duty to society.",
      services: [
        "Free Treatment Days",
        "Rural Health Missions",
        "Senior Citizen Care",
        "Educational Workshops",
      ],
      successRate: 100,
    },
  ];

  const treatmentPackages = [
    {
      name: "Ultimate Pain Relief",
      treatments: "Agnikarma + Viddha Karma",
      promise: "Pain-free living guarantee",
      popularity: 90,
      color: "from-primary to-primary/80",
    },
    {
      name: "Complete Wellness",
      treatments: "All therapies + lifestyle coaching",
      promise: "Total health transformation",
      popularity: 85,
      color: "from-blue-500 to-cyan-600",
    },
    {
      name: "Family Healing Plan",
      treatments: "Treatment for multiple family members",
      promise: "Family wellness ecosystem",
      popularity: 75,
      color: "from-primary to-primary/80",
    },
    {
      name: "Executive Health",
      treatments: "VIP treatment + annual maintenance",
      promise: "Lifetime wellness partnership",
      popularity: 80,
      color: "from-primary to-primary/80",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 glass animate-fade-in-down">
              <Heart className="w-4 h-4 mr-2" />
              Comprehensive Treatment Offerings
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-6 gradient-text">
              Ancient Healing Arts for{" "}
              <span className="text-primary">Modern Wellness</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover our complete range of authentic Ayurvedic treatments,
              each designed to address specific health challenges with proven
              results and lasting transformation.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="bg-green-100 text-green-800 border-green-200 glass interactive">
                <CheckCircle className="w-4 h-4 mr-2" />
                5000+ Lives Transformed
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 glass interactive">
                <Award className="w-4 h-4 mr-2" />
                Government Certified
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 glass interactive">
                <Star className="w-4 h-4 mr-2" />
                4.9/5 Patient Rating
              </Badge>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg px-8 interactive"
            >
              Take Free Health Assessment
            </Button>
          </div>
        </div>
      </section>

      {/* Main Treatments */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4 gradient-text">
                Core Ayurvedic Treatments
              </h2>
              <p className="text-lg text-muted-foreground">
                Our signature therapies with proven healing results
              </p>
            </div>

            <div className="space-y-12">
              {mainTreatments.map((treatment, index) => {
                const IconComponent = treatment.icon;
                const isEven = index % 2 === 0;

                return (
                  <Card
                    key={treatment.id}
                    className="bg-card shadow-xl border-0 overflow-hidden glass card-hover"
                  >
                    <CardContent className="p-0">
                      <div
                        className={`grid lg:grid-cols-2 ${
                          !isEven ? "lg:grid-flow-col-dense" : ""
                        }`}
                      >
                        <div
                          className={`bg-gradient-to-br ${
                            treatment.bgColor
                          } p-8 flex flex-col justify-center ${
                            !isEven ? "lg:col-start-2" : ""
                          }`}
                        >
                          <div
                            className={`w-20 h-20 bg-gradient-to-r ${
                              treatment.color
                            } rounded-full flex items-center justify-center mb-6 ${
                              isEven ? "" : "ml-auto"
                            } interactive`}
                          >
                            <IconComponent className="w-10 h-10 text-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground gradient-text">
                                {treatment.successRate}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Success Rate
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground gradient-text">
                                {treatment.sessions}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Duration
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`p-8 flex flex-col justify-center ${
                            !isEven ? "lg:col-start-1" : ""
                          }`}
                        >
                          <h3 className="text-3xl font-playfair font-bold text-foreground mb-2 gradient-text">
                            {treatment.title}
                          </h3>
                          <p className="text-lg text-muted-foreground mb-4">
                            {treatment.subtitle}
                          </p>
                          <p className="text-muted-foreground mb-6 leading-relaxed">
                            {treatment.description}
                          </p>

                          <div className="mb-6">
                            <h4 className="font-semibold text-foreground mb-3">
                              Treats:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {treatment.conditions.map(
                                (condition, condIndex) => (
                                  <Badge
                                    key={condIndex}
                                    variant="outline"
                                    className="text-muted-foreground"
                                  >
                                    {condition}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Link href={treatment.href}>
                              <Button
                                className={`w-full bg-gradient-to-r ${treatment.color} hover:opacity-90 text-white interactive`}
                              >
                                Learn More
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="w-full border-border text-muted-foreground hover:bg-muted/50 interactive"
                            >
                              Book Session
                            </Button>
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

      {/* Specialized Programs */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-muted/50 to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4 gradient-text">
                Specialized Programs & Services
              </h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive wellness solutions for every aspect of life
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {specializedPrograms.map((program, index) => {
                const IconComponent = program.icon;

                return (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-all duration-300 border-0 bg-card glass card-hover"
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-4 mb-4">
                        <div
                          className={`w-16 h-16 bg-gradient-to-r ${program.color} rounded-full flex items-center justify-center interactive`}
                        >
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-foreground gradient-text">
                            {program.title}
                          </CardTitle>
                          <Badge className="bg-primary/10 text-primary border-primary/20 mt-2">
                            {program.successRate}% Success Rate
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {program.description}
                      </p>

                      <div className="space-y-3 mb-6">
                        {program.services.map((service, serviceIndex) => (
                          <div
                            key={serviceIndex}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-muted-foreground">
                              {service}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className={`w-full bg-gradient-to-r ${program.color} hover:opacity-90 text-white interactive`}
                      >
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Packages */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4 gradient-text">
                Combination Treatment Packages
              </h2>
              <p className="text-lg text-muted-foreground">
                Most popular - 90% of patients choose these comprehensive
                programs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {treatmentPackages.map((pkg, index) => (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/50 glass card-hover"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle className="text-xl text-foreground gradient-text">
                        {pkg.name}
                      </CardTitle>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {pkg.popularity}% Choose This
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">
                          Treatments Included:
                        </h4>
                        <p className="text-muted-foreground">
                          {pkg.treatments}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-2">
                          Transformation Promise:
                        </h4>
                        <p className="text-muted-foreground font-medium">
                          {pkg.promise}
                        </p>
                      </div>

                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Popularity
                          </span>
                          <span className="text-sm font-bold text-primary">
                            {pkg.popularity}%
                          </span>
                        </div>
                        <Progress value={pkg.popularity} className="h-2" />
                      </div>

                      <Button
                        className={`w-full bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white mt-6 interactive`}
                      >
                        Choose This Package
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              Begin Your Healing Journey Today
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Choose from our comprehensive range of treatments or let our
              experts create a personalized healing plan just for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-background text-primary hover:bg-primary/10 text-lg px-8 interactive"
              >
                Book Free Consultation
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 interactive"
              >
                Take Health Assessment
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-primary-foreground/80">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Government Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>5000+ Success Stories</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Services Catalog */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ServicesCatalog variant="grid" columns={3} showDetails={true} />
        </div>
      </section>
    </div>
  );
}
