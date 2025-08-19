"use client";

import React, { useState } from "react";
import {
  Brain,
  Bone,
  Heart,
  Sparkles,
  Activity,
  Baby,
  Scissors,
  Flower2,
  Zap,
  Leaf,
  ChevronRight,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface ServiceCategory {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  treatments: string[];
  duration: string;
  suitableFor: string[];
  benefits: string[];
  color: string;
}

interface ServicesCatalogProps {
  className?: string;
  variant?: "grid" | "list" | "cards";
  showDetails?: boolean;
  columns?: 1 | 2 | 3 | 4;
}

export function ServicesCatalog({
  className,
  variant = "grid",
  showDetails = true,
  columns = 3,
}: ServicesCatalogProps) {
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const serviceCategories: ServiceCategory[] = [
    {
      id: "panchakarma",
      icon: <Leaf className="w-6 h-6" />,
      name: t("services.panchakarma"),
      description: t("treatments.panchakarma.description"),
      treatments: ["Vaman", "Virechan", "Basti", "Nasya", "Raktamokshan"],
      duration: t("treatments.panchakarma.duration"),
      suitableFor: [t("treatments.panchakarma.suitableFor")],
      benefits: [t("treatments.panchakarma.benefits")],
      color: "green",
    },
    {
      id: "viddhakarma",
      icon: <Brain className="w-6 h-6" />,
      name: t("services.viddhakarma"),
      description: t("treatments.viddhakarma.description"),
      treatments: [
        "Autism Treatment",
        "Cerebral Palsy Care",
        "Mental Health Therapy",
        "Neurological Rehabilitation",
      ],
      duration: t("treatments.viddhakarma.duration"),
      suitableFor: [t("treatments.viddhakarma.suitableFor")],
      benefits: [t("treatments.viddhakarma.benefits")],
      color: "purple",
    },
    {
      id: "agnikarma",
      icon: <Zap className="w-6 h-6" />,
      name: t("services.agnikarma"),
      description: t("treatments.agnikarma.description"),
      treatments: [
        "Joint Pain Relief",
        "Arthritis Treatment",
        "Sports Injury Care",
        "Muscular Disorders",
      ],
      duration: t("treatments.agnikarma.duration"),
      suitableFor: [t("treatments.agnikarma.suitableFor")],
      benefits: [t("treatments.agnikarma.benefits")],
      color: "orange",
    },
    {
      id: "neurological",
      icon: <Brain className="w-6 h-6" />,
      name: t("services.neurological"),
      description: t("services.neurologicalDesc"),
      treatments: [
        "Paralysis",
        "Autism",
        "Cerebral Palsy",
        "Mental Health",
        "Epilepsy",
        "Migraine",
      ],
      duration: "3-12 months",
      suitableFor: [
        "Neurological disorders",
        "Developmental issues",
        "Mental health conditions",
      ],
      benefits: [
        "Improved brain function",
        "Better motor skills",
        "Enhanced cognitive abilities",
        "Emotional stability",
      ],
      color: "indigo",
    },
    {
      id: "joint-bone",
      icon: <Bone className="w-6 h-6" />,
      name: t("services.jointBone"),
      description: t("services.jointBoneDesc"),
      treatments: [
        "Arthritis",
        "Gout",
        "Cervical Spondylosis",
        "Lumbar Spondylosis",
        "Sciatica",
        "Joint Pain",
      ],
      duration: "2-6 months",
      suitableFor: [
        "Joint pain",
        "Bone disorders",
        "Spinal problems",
        "Mobility issues",
      ],
      benefits: [
        "Pain relief",
        "Improved mobility",
        "Reduced inflammation",
        "Better joint function",
      ],
      color: "blue",
    },
    {
      id: "respiratory",
      icon: <Heart className="w-6 h-6" />,
      name: t("services.respiratory"),
      description: t("services.respiratoryDesc"),
      treatments: [
        "Asthma",
        "Bronchitis",
        "Chronic Cough",
        "Allergic Rhinitis",
        "Sinusitis",
      ],
      duration: "1-4 months",
      suitableFor: [
        "Breathing difficulties",
        "Chronic respiratory issues",
        "Allergic conditions",
      ],
      benefits: [
        "Better breathing",
        "Reduced inflammation",
        "Improved lung capacity",
        "Natural immunity",
      ],
      color: "cyan",
    },
    {
      id: "digestive",
      icon: <Heart className="w-6 h-6" />,
      name: t("services.digestive"),
      description: t("services.digestiveDesc"),
      treatments: [
        "Acidity",
        "Piles",
        "Fistula",
        "Constipation",
        "IBS",
        "Gastritis",
      ],
      duration: "1-3 months",
      suitableFor: [
        "Digestive problems",
        "Chronic gastric issues",
        "Bowel disorders",
      ],
      benefits: [
        "Better digestion",
        "Reduced acidity",
        "Regular bowel movements",
        "Improved gut health",
      ],
      color: "red",
    },
    {
      id: "kidney-stones",
      icon: <Activity className="w-6 h-6" />,
      name: t("services.kidneyStones"),
      description: t("services.kidneyStonesDesc"),
      treatments: [
        "Kidney Stones",
        "Gallbladder Stones",
        "Urinary Disorders",
        "Renal Care",
      ],
      duration: "2-6 months",
      suitableFor: ["Stone formation", "Urinary problems", "Kidney disorders"],
      benefits: [
        "Stone dissolution",
        "Pain relief",
        "Improved kidney function",
        "Prevention of recurrence",
      ],
      color: "teal",
    },
    {
      id: "skin-diseases",
      icon: <Sparkles className="w-6 h-6" />,
      name: t("services.skinDiseases"),
      description: t("services.skinDiseasesDesc"),
      treatments: [
        "Psoriasis",
        "Eczema",
        "Fungal Infections",
        "Allergies",
        "Acne",
        "Dermatitis",
      ],
      duration: "2-8 months",
      suitableFor: [
        "Skin disorders",
        "Chronic skin conditions",
        "Allergic reactions",
      ],
      benefits: [
        "Clear skin",
        "Reduced inflammation",
        "Natural healing",
        "Long-term relief",
      ],
      color: "pink",
    },
    {
      id: "metabolic",
      icon: <Activity className="w-6 h-6" />,
      name: t("services.metabolic"),
      description: t("services.metabolicDesc"),
      treatments: [
        "Diabetes",
        "Thyroid Disorders",
        "Obesity",
        "Weight Management",
        "PCOD",
        "Cholesterol",
      ],
      duration: "3-12 months",
      suitableFor: [
        "Metabolic disorders",
        "Hormonal imbalances",
        "Weight issues",
      ],
      benefits: [
        "Better metabolism",
        "Weight control",
        "Hormonal balance",
        "Improved energy",
      ],
      color: "yellow",
    },
    {
      id: "gynecological",
      icon: <Baby className="w-6 h-6" />,
      name: t("services.gynecological"),
      description: t("services.gynecologicalDesc"),
      treatments: [
        "Menstrual Disorders",
        "PCOD/PCOS",
        "Infertility Support",
        "Menopause Care",
        "Leucorrhea",
      ],
      duration: "3-9 months",
      suitableFor: [
        "Women's health issues",
        "Reproductive disorders",
        "Hormonal problems",
      ],
      benefits: [
        "Regular cycles",
        "Hormonal balance",
        "Fertility support",
        "Overall wellness",
      ],
      color: "rose",
    },
    {
      id: "hair-problems",
      icon: <Scissors className="w-6 h-6" />,
      name: t("services.hairProblems"),
      description: t("services.hairProblemsDesc"),
      treatments: [
        "Hair Fall",
        "Dandruff",
        "Alopecia",
        "Scalp Disorders",
        "Premature Graying",
      ],
      duration: "3-6 months",
      suitableFor: ["Hair loss", "Scalp problems", "Hair quality issues"],
      benefits: [
        "Reduced hair fall",
        "Healthy scalp",
        "Hair regrowth",
        "Natural shine",
      ],
      color: "amber",
    },
    {
      id: "beauty-antiaging",
      icon: <Sparkles className="w-6 h-6" />,
      name: t("services.beautyAntiAging"),
      description: t("services.beautyAntiAgingDesc"),
      treatments: [
        "Facial Treatments",
        "Anti-aging Care",
        "Skin Rejuvenation",
        "Natural Beauty Enhancement",
      ],
      duration: "1-6 months",
      suitableFor: ["Aging skin", "Beauty enhancement", "Skin rejuvenation"],
      benefits: [
        "Youthful appearance",
        "Glowing skin",
        "Natural radiance",
        "Reduced aging signs",
      ],
      color: "violet",
    },
    {
      id: "wellness-retreats",
      icon: <Flower2 className="w-6 h-6" />,
      name: t("services.wellnessRetreats"),
      description: t("services.wellnessRetreatsDesc"),
      treatments: [
        "Detox Programs",
        "Stress Management",
        "Lifestyle Counseling",
        "Preventive Care",
      ],
      duration: "7-21 days",
      suitableFor: [
        "Stress relief",
        "Health maintenance",
        "Lifestyle improvement",
      ],
      benefits: [
        "Complete detox",
        "Stress relief",
        "Better lifestyle",
        "Enhanced vitality",
      ],
      color: "emerald",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: "bg-green-50 border-green-200 text-green-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
      orange: "bg-orange-50 border-orange-200 text-orange-800",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      cyan: "bg-cyan-50 border-cyan-200 text-cyan-800",
      red: "bg-red-50 border-red-200 text-red-800",
      teal: "bg-teal-50 border-teal-200 text-teal-800",
      pink: "bg-pink-50 border-pink-200 text-pink-800",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
      rose: "bg-rose-50 border-rose-200 text-rose-800",
      amber: "bg-amber-50 border-amber-200 text-amber-800",
      violet: "bg-violet-50 border-violet-200 text-violet-800",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.green;
  };

  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  if (variant === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        {serviceCategories.map((service) => (
          <div
            key={service.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div
                className={cn("p-3 rounded-lg", getColorClasses(service.color))}
              >
                {service.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600 mb-3">{service.description}</p>
                <div className="flex flex-wrap gap-2">
                  {service.treatments.slice(0, 4).map((treatment, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {treatment}
                    </span>
                  ))}
                  {service.treatments.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      +{service.treatments.length - 4} more
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t("services.title")}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t("services.subtitle")}
        </p>
      </div>

      <div className={cn("grid gap-6", gridClasses[columns])}>
        {serviceCategories.map((service) => (
          <div
            key={service.id}
            className={cn(
              "bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer",
              selectedService === service.id && "ring-2 ring-green-500"
            )}
            onClick={() =>
              setSelectedService(
                selectedService === service.id ? null : service.id
              )
            }
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    getColorClasses(service.color)
                  )}
                >
                  {service.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {service.name}
                </h3>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {service.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{service.treatments.length} treatments</span>
                </div>
              </div>

              {showDetails && selectedService === service.id && (
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Treatments Included:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {service.treatments.map((treatment, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {treatment}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Key Benefits:
                    </h4>
                    <div className="space-y-1">
                      {service.benefits.slice(0, 3).map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
