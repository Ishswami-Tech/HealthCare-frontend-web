"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Heart,
  Zap,
  Droplets,
  DollarSign,
  Mountain,
  Phone,
  Calendar,
  CheckCircle,
  Star,
  Users,
  Award,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

const SpecialtyTreatments = () => {
  const { t } = useTranslation();

  const specialties = [
    {
      id: "viddhakarma-autism",
      title: t.specialties.viddhakarmaAutism.title,
      description: t.specialties.viddhakarmaAutism.description,
      icon: Brain,
      color: "from-purple-500 to-indigo-600",
      bgColor:
        "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
      features: [
        "Unique brain disorder treatment",
        "Accurate precision required",
        "Few specialists available in India",
        "Proven results in autism care",
      ],
      stats: { patients: "200+", successRate: "85%", experience: "15 years" },
    },
    {
      id: "viddhakarma-cp",
      title: t.specialties.viddhakarmaCP.title,
      description: t.specialties.viddhakarmaCP.description,
      icon: Heart,
      color: "from-red-500 to-pink-600",
      bgColor:
        "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
      features: [
        "Birth brain injury treatment",
        "Regeneration possible",
        "Rehabilitation support",
        "Hope for recovery",
      ],
      stats: { patients: "150+", successRate: "78%", experience: "12 years" },
    },
    {
      id: "mental-health",
      title: t.specialties.mentalHealth.title,
      description: t.specialties.mentalHealth.description,
      icon: Zap,
      color: "from-green-500 to-emerald-600",
      bgColor:
        "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      features: [
        "Holistic mental health approach",
        "Counseling and therapy",
        "Mind-body wellness",
        "Optimal well-being focus",
      ],
      stats: { patients: "500+", successRate: "90%", experience: "20 years" },
    },
    {
      id: "panchakarma-special",
      title: t.specialties.panchakarmaSpecial.title,
      description: t.specialties.panchakarmaSpecial.description,
      icon: Droplets,
      color: "from-blue-500 to-cyan-600",
      bgColor:
        "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      features: [
        "Specialized for children",
        "Expert Vaman procedures",
        "Difficult patient care",
        "Mastery in Panchakarma",
      ],
      stats: { patients: "1000+", successRate: "95%", experience: "20 years" },
    },
    {
      id: "affordability",
      title: t.specialties.affordability.title,
      description: t.specialties.affordability.description,
      icon: DollarSign,
      color: "from-orange-500 to-red-600",
      bgColor:
        "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
      features: [
        "No daily treatment charges",
        "Accessible healthcare",
        "Quality for everyone",
        "Community service focus",
      ],
      stats: { patients: "Free", successRate: "100%", experience: "Always" },
    },
    {
      id: "wellness-retreats",
      title: t.specialties.wellnessRetreats.title,
      description: t.specialties.wellnessRetreats.description,
      icon: Mountain,
      color: "from-teal-500 to-cyan-600",
      bgColor:
        "from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20",
      features: [
        "Stress relief programs",
        "Nature immersion",
        "Healthy food focus",
        "Transformative experiences",
      ],
      stats: { patients: "50+", successRate: "98%", experience: "5 years" },
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800 mb-4">
            <Star className="w-4 h-4 mr-2" />
            Specialty Treatments
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
            Unique Ayurvedic Specializations
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Pioneering treatments and specialized care that sets us apart in the
            field of Ayurvedic medicine
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {specialties.map((specialty) => {
            const IconComponent = specialty.icon;

            return (
              <Card
                key={specialty.id}
                className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-white dark:bg-gray-800"
              >
                <CardHeader
                  className={`bg-gradient-to-br ${specialty.bgColor} relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <IconComponent className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${specialty.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-playfair font-bold text-gray-900 dark:text-white mb-2">
                      {specialty.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    {specialty.description}
                  </p>

                  {/* Key Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Key Features:
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {specialty.features.map((feature, index) => (
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

                  {/* Stats */}
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {specialty.stats.patients}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Patients
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="font-bold text-lg text-green-600 dark:text-green-400">
                          {specialty.stats.successRate}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Success Rate
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {specialty.stats.experience}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Experience
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open("tel:+919860370961", "_self")}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Consult Now
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 shadow-xl">
            <CardContent className="p-8">
              <div className="max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Experience Specialized Ayurvedic Care
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  Join thousands who have experienced the unique healing power
                  of our specialized treatments. Dr. Chandrakumar
                  Deshmukh&apos;s expertise in rare Ayurvedic techniques offers
                  hope where conventional medicine falls short.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    onClick={() => window.open("tel:+919860370961", "_self")}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call for Specialized Consultation
                  </Button>
                  <Button size="lg" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Join Wellness Retreat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SpecialtyTreatments;
