"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Bone,
  Zap,
  Wind,
  Heart,
  Sparkles,
  Scale,
  Activity,
  Baby,
  Scissors,
  Droplets,
  Star,
  Plus,
  ChevronRight,
  Phone,
  Calendar,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const ComprehensiveServices = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const serviceCategories = [
    {
      id: "neurological",
      title: t("services.neurological"),
      icon: Brain,
      color: "from-purple-500 to-indigo-600",
      bgColor:
        "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
      conditions: [
        "Autism",
        "Cerebral Palsy", 
        "Mental Health Disorders",
        "Neurological Rehabilitation",
        "Paralysis",
        "Stroke Recovery"
      ],
      description: t("services.neurologicalDesc"),
    },
    {
      id: "jointBone",
      title: t("services.jointBone"),
      icon: Bone,
      color: "from-orange-500 to-red-600",
      bgColor:
        "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
      conditions: [
        "Arthritis",
        "Joint Pain",
        "Spinal Disorders",
        "Gout",
        "Sports Injuries",
        "Muscular Disorders"
      ],
      description: t("services.jointBoneDesc"),
    },
    {
      id: "spinal",
      title: "Spinal Care",
      icon: Zap,
      color: "from-yellow-500 to-orange-600",
      bgColor:
        "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
      conditions: [
        "Sciatica",
        "Back Pain",
        "Disc Problems",
        "Spinal Stenosis",
        "Scoliosis",
        "Neck Pain"
      ],
      description: "Comprehensive spinal care using traditional Ayurvedic methods.",
    },
    {
      id: "respiratory",
      title: t("services.respiratory"),
      icon: Wind,
      color: "from-cyan-500 to-blue-600",
      bgColor:
        "from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20",
      conditions: [
        "Asthma",
        "Bronchitis",
        "Sinusitis",
        "Allergic Rhinitis",
        "Cough",
        "Breathing Difficulties"
      ],
      description: t("services.respiratoryDesc"),
    },
    {
      id: "digestive",
      title: "Digestive Health",
      icon: Heart,
      color: "from-green-500 to-emerald-600",
      bgColor:
        "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      conditions: [
        "Acidity",
        "Piles",
        "Constipation",
        "IBS",
        "Ulcers",
        "Digestive Disorders"
      ],
      description: t("services.digestiveDesc"),
    },
    {
      id: "kidneyGallbladder",
      title: t("services.kidneyStones"),
      icon: Heart,
      color: "from-teal-500 to-cyan-600",
      bgColor:
        "from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20",
      conditions: [
        "Kidney Stones",
        "Gallbladder Stones",
        "Urinary Problems",
        "Kidney Disorders",
        "Bladder Issues",
        "Stone Prevention"
      ],
      description: t("services.kidneyStonesDesc"),
    },
    {
      id: "skin",
      title: t("services.skinDiseases"),
      icon: Sparkles,
      color: "from-pink-500 to-rose-600",
      bgColor:
        "from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20",
      conditions: [
        "Psoriasis",
        "Eczema",
        "Fungal Infections",
        "Acne",
        "Vitiligo",
        "Skin Allergies"
      ],
      description: t("services.skinDiseasesDesc"),
    },
    {
      id: "obesity",
      title: "Weight Management",
      icon: Scale,
      color: "from-indigo-500 to-purple-600",
      bgColor:
        "from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20",
      conditions: [
        "Obesity",
        "Weight Loss",
        "Metabolic Disorders",
        "Thyroid Issues",
        "Diabetes Management",
        "Lifestyle Diseases"
      ],
      description: "Natural weight management and metabolic health solutions.",
    },
    {
      id: "metabolic",
      title: t("services.metabolic"),
      icon: Activity,
      color: "from-red-500 to-pink-600",
      bgColor:
        "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
      conditions: [
        "Diabetes",
        "Thyroid Disorders",
        "Metabolic Syndrome",
        "Cholesterol Issues",
        "Blood Pressure",
        "Hormonal Imbalances"
      ],
      description: t("services.metabolicDesc"),
    },
    {
      id: "stress",
      title: "Stress & Mental Health",
      icon: Heart,
      color: "from-emerald-500 to-teal-600",
      bgColor:
        "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
      conditions: [
        "Stress",
        "Anxiety",
        "Depression",
        "Insomnia",
        "Mental Fatigue",
        "Emotional Balance"
      ],
      description: "Holistic approach to mental health and stress management.",
    },
    {
      id: "gynecological",
      title: t("services.gynecological"),
      icon: Baby,
      color: "from-violet-500 to-purple-600",
      bgColor:
        "from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20",
      conditions: [
        "Menstrual Problems",
        "Infertility",
        "PCOS",
        "Menopause",
        "Pregnancy Care",
        "Women's Health"
      ],
      description: t("services.gynecologicalDesc"),
    },
    {
      id: "hair",
      title: t("services.hairProblems"),
      icon: Scissors,
      color: "from-amber-500 to-orange-600",
      bgColor:
        "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
      conditions: [
        "Hair Fall",
        "Dandruff",
        "Scalp Disorders",
        "Premature Greying",
        "Hair Growth",
        "Hair Care"
      ],
      description: t("services.hairProblemsDesc"),
    },
    {
      id: "panchakarma",
      title: t("services.panchakarma"),
      icon: Droplets,
      color: "from-blue-500 to-cyan-600",
      bgColor:
        "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      conditions: [
        "Detoxification",
        "Rejuvenation",
        "Preventive Care",
        "Chronic Diseases",
        "Stress Relief",
        "Anti-aging"
      ],
      description: t("treatments.panchakarma.description"),
    },
    {
      id: "beauty",
      title: t("services.beautyAntiAging"),
      icon: Star,
      color: "from-rose-500 to-pink-600",
      bgColor:
        "from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20",
      conditions: [
        "Anti-aging",
        "Skin Rejuvenation",
        "Beauty Treatments",
        "Natural Glow",
        "Youthful Skin",
        "Beauty Care"
      ],
      description: t("services.beautyAntiAgingDesc"),
    },
    {
      id: "other",
      title: "Other Conditions",
      icon: Plus,
      color: "from-gray-500 to-slate-600",
      bgColor:
        "from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20",
      conditions: [
        "General Wellness",
        "Immunity Boost",
        "Energy Enhancement",
        "Sleep Disorders",
        "Chronic Fatigue",
        "Custom Treatments"
      ],
      description: "Comprehensive care for various health conditions and general wellness.",
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800 mb-4">
            <Heart className="w-4 h-4 mr-2" />
            {t("services.title")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
            {t("services.subtitle")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t("services.description")}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-12">
          {serviceCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;

            return (
              <Card
                key={category.id}
                className={cn(
                  "group cursor-pointer transition-all duration-300 border-0 overflow-hidden",
                  isSelected
                    ? "ring-2 ring-orange-500 dark:ring-orange-400 shadow-xl scale-105"
                    : "hover:shadow-lg hover:scale-102",
                  "bg-white dark:bg-gray-800"
                )}
                onClick={() =>
                  setSelectedCategory(isSelected ? null : category.id)
                }
              >
                <CardHeader
                  className={`bg-gradient-to-br ${category.bgColor} relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                    <IconComponent className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-playfair font-bold text-gray-900 dark:text-white mb-2">
                      {category.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {category.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="space-y-2 mb-4">
                    {category.conditions
                      .slice(0, isSelected ? category.conditions.length : 3)
                      .map((condition: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <ChevronRight className="w-3 h-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {condition}
                          </span>
                        </div>
                      ))}
                    {!isSelected && category.conditions.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        +{category.conditions.length - 3} more conditions
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open("tel:+919860370961", "_self")}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {t("common.bookAppointment")}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-8 border border-orange-200 dark:border-orange-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t("treatments.cta.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t("treatments.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                onClick={() => window.open("tel:+919860370961", "_self")}
              >
                <Phone className="w-4 h-4 mr-2" />
                {t("common.callNow")}: +91-9860370961
              </Button>
              <Button size="lg" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                {t("common.bookAppointment")}
              </Button>
            </div>
            <div className="text-center mt-4">
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                {t("common.noCharges")} - Viddhakarma & Agnikarma
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComprehensiveServices;
