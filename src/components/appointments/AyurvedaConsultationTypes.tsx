"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TherapyBadge, { TherapyType, getTherapyDuration, getTherapyCategory } from "@/components/ayurveda/TherapyBadge";

interface ConsultationType {
  type: TherapyType;
  name: string;
  description: string;
  duration: number;
  category: string;
  price?: number;
  prerequisites?: string[];
  contraindications?: string[];
}

interface AyurvedaConsultationTypesProps {
  selectedType?: TherapyType;
  onSelect: (type: TherapyType) => void;
  availableTypes?: TherapyType[];
  showPricing?: boolean;
  showDetails?: boolean;
  className?: string;
}

const CONSULTATION_DETAILS: Record<TherapyType, ConsultationType> = {
  CONSULTATION: {
    type: "CONSULTATION",
    name: "General Consultation",
    description: "Comprehensive Ayurvedic consultation including pulse diagnosis, lifestyle assessment, and treatment planning.",
    duration: 30,
    category: "Diagnosis",
    price: 500,
    prerequisites: [],
    contraindications: []
  },
  NADI_PARIKSHA: {
    type: "NADI_PARIKSHA",
    name: "Nadi Pariksha",
    description: "Traditional pulse diagnosis to assess dosha imbalances and overall health status.",
    duration: 15,
    category: "Diagnosis",
    price: 300,
    prerequisites: ["Empty stomach preferred"],
    contraindications: ["Recent heavy meal", "Intense physical activity"]
  },
  AGNIKARMA: {
    type: "AGNIKARMA",
    name: "Agnikarma Therapy",
    description: "Thermal cautery therapy using heated instruments for treating specific conditions like arthritis and skin disorders.",
    duration: 45,
    category: "Surgical",
    price: 1500,
    prerequisites: ["Prior consultation required", "Fasting for 2 hours"],
    contraindications: ["Pregnancy", "Diabetes", "Blood disorders", "Skin infections"]
  },
  VIDDHAKARMA: {
    type: "VIDDHAKARMA",
    name: "Viddhakarma",
    description: "Surgical procedures including minor surgeries and therapeutic puncturing techniques.",
    duration: 60,
    category: "Surgical",
    price: 2000,
    prerequisites: ["Prior consultation required", "Blood tests", "Consent form"],
    contraindications: ["Pregnancy", "Blood clotting disorders", "Active infections"]
  },
  PANCHAKARMA: {
    type: "PANCHAKARMA",
    name: "Panchakarma Therapy",
    description: "Comprehensive detoxification and rejuvenation therapy involving five therapeutic procedures.",
    duration: 120,
    category: "Detox",
    price: 3500,
    prerequisites: ["Prior consultation", "Preparatory treatments", "Dietary restrictions"],
    contraindications: ["Pregnancy", "Severe illness", "Recent surgery", "Menstruation"]
  },
  SHIRODHARA: {
    type: "SHIRODHARA",
    name: "Shirodhara",
    description: "Continuous pouring of medicated oil or liquids on the forehead for deep relaxation and nervous system balance.",
    duration: 60,
    category: "Relaxation",
    price: 2500,
    prerequisites: ["Light meal 2 hours before", "Comfortable clothing"],
    contraindications: ["Pregnancy (first trimester)", "Severe hypertension", "Recent head injury"]
  },
  ABHYANGA: {
    type: "ABHYANGA",
    name: "Abhyanga Massage",
    description: "Full-body oil massage using warm medicated oils to improve circulation and eliminate toxins.",
    duration: 45,
    category: "Massage",
    price: 1800,
    prerequisites: ["Shower before treatment", "Comfortable clothing"],
    contraindications: ["Fever", "Acute illness", "Skin infections", "Recent surgery"]
  },
  SWEDANA: {
    type: "SWEDANA",
    name: "Swedana Steam Therapy",
    description: "Herbal steam therapy to induce sweating and eliminate toxins through the skin.",
    duration: 30,
    category: "Steam",
    price: 1200,
    prerequisites: ["Hydration", "Light clothing"],
    contraindications: ["Pregnancy", "Heart conditions", "High blood pressure", "Dehydration"]
  },
  VIRECHANA: {
    type: "VIRECHANA",
    name: "Virechana Purgation",
    description: "Therapeutic purgation therapy to eliminate excess pitta dosha and toxins from the body.",
    duration: 90,
    category: "Detox",
    price: 2800,
    prerequisites: ["Preparatory treatments", "Dietary restrictions", "Medical clearance"],
    contraindications: ["Pregnancy", "Severe weakness", "Chronic diarrhea", "Rectal disorders"]
  },
  BASTI: {
    type: "BASTI",
    name: "Basti Enema Therapy",
    description: "Medicated enema therapy to balance vata dosha and treat various neurological and digestive disorders.",
    duration: 45,
    category: "Detox",
    price: 2200,
    prerequisites: ["Preparatory treatments", "Empty bowels", "Medical assessment"],
    contraindications: ["Pregnancy", "Rectal bleeding", "Severe colitis", "Recent abdominal surgery"]
  }
};

export default function AyurvedaConsultationTypes({
  selectedType,
  onSelect,
  availableTypes = Object.keys(CONSULTATION_DETAILS) as TherapyType[],
  showPricing = true,
  showDetails = true,
  className
}: AyurvedaConsultationTypesProps) {
  const [expandedType, setExpandedType] = useState<TherapyType | null>(null);

  const ConsultationCard = ({ consultation }: { consultation: ConsultationType }) => {
    const isSelected = selectedType === consultation.type;
    const isExpanded = expandedType === consultation.type;

    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50",
          className
        )}
        onClick={() => onSelect(consultation.type)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TherapyBadge type={consultation.type} />
              <div>
                <CardTitle className="text-lg">{consultation.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {consultation.duration} min
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {consultation.category}
                  </Badge>
                  {showPricing && consultation.price && (
                    <Badge variant="outline" className="text-xs">
                      ₹{consultation.price}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedType(isExpanded ? null : consultation.type);
                }}
              >
                {isExpanded ? "Less" : "More"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-gray-600 text-sm mb-3">
            {consultation.description}
          </p>

          {showDetails && isExpanded && (
            <div className="space-y-3 border-t pt-3">
              {consultation.prerequisites && consultation.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-green-700 mb-1">Prerequisites:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {consultation.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-green-600 mt-0.5">•</span>
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {consultation.contraindications && consultation.contraindications.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-red-700 mb-1">Contraindications:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {consultation.contraindications.map((contra, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-600 mt-0.5">•</span>
                        {contra}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Group consultations by category
  const groupedConsultations = availableTypes.reduce((groups, type) => {
    const consultation = CONSULTATION_DETAILS[type];
    const category = consultation.category;
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(consultation);
    
    return groups;
  }, {} as Record<string, ConsultationType[]>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Consultation Type</h2>
        <p className="text-gray-600">
          Choose the type of Ayurvedic consultation or therapy that best suits your needs
        </p>
      </div>

      {Object.entries(groupedConsultations).map(([category, consultations]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            {category} Treatments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultations.map((consultation) => (
              <ConsultationCard 
                key={consultation.type} 
                consultation={consultation} 
              />
            ))}
          </div>
        </div>
      ))}

      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TherapyBadge type={selectedType} />
            <span className="font-medium">Selected: {CONSULTATION_DETAILS[selectedType].name}</span>
          </div>
          <div className="text-sm text-gray-600">
            <p>Duration: {CONSULTATION_DETAILS[selectedType].duration} minutes</p>
            {showPricing && CONSULTATION_DETAILS[selectedType].price && (
              <p>Price: ₹{CONSULTATION_DETAILS[selectedType].price}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export consultation details for use in other components
export { CONSULTATION_DETAILS };
export type { ConsultationType };
