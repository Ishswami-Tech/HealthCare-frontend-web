"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import TherapyBadge, { TherapyType } from "@/components/ayurveda/TherapyBadge";
import { useAppointmentServices } from "@/hooks/query/useAppointments";

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

export default function AyurvedaConsultationTypes({
  selectedType,
  onSelect,
  availableTypes,
  showPricing = true,
  showDetails = true,
  className
}: AyurvedaConsultationTypesProps) {
  const { t } = useTranslation();
  const [expandedType, setExpandedType] = useState<TherapyType | null>(null);
  const { data: services = [] } = useAppointmentServices();

  const consultations = useMemo(() => {
    const allowedTypes = availableTypes?.length ? new Set(availableTypes) : null;

    return services
      .filter((service) => !allowedTypes || allowedTypes.has(service.treatmentType as TherapyType))
      .map((service) => ({
        type: service.treatmentType as TherapyType,
        name: service.label,
        description: service.description,
        duration: service.defaultDurationMinutes,
        category: service.category,
        ...(service.videoConsultationFee !== undefined
          ? { price: service.videoConsultationFee }
          : {}),
        prerequisites: [],
        contraindications: [],
      }));
  }, [availableTypes, services]);

  const consultationDetailsByType = useMemo(
    () =>
      consultations.reduce(
        (acc, consultation) => {
          acc[consultation.type] = consultation;
          return acc;
        },
        {} as Record<TherapyType, ConsultationType>
      ),
    [consultations]
  );

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
                {isExpanded ? t("common.less") : t("common.more")}
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
                  <h4 className="font-medium text-sm text-green-700 mb-1">{t("consultations.prerequisites")}:</h4>
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
                  <h4 className="font-medium text-sm text-red-700 mb-1">{t("consultations.contraindications")}:</h4>
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
  const groupedConsultations = consultations.reduce((groups, consultation) => {
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
        <h2 className="text-2xl font-bold mb-2">{t("consultations.selectType")}</h2>
        <p className="text-gray-600">
          {t("consultations.selectDescription")}
        </p>
      </div>

      {Object.entries(groupedConsultations).map(([category, consultations]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            {category.replace(/_/g, " ")} {t("consultations.treatments")}
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

      {selectedType && consultationDetailsByType[selectedType] && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TherapyBadge type={selectedType} />
            <span className="font-medium">{t("consultations.selected")}: {consultationDetailsByType[selectedType].name}</span>
          </div>
          <div className="text-sm text-gray-600">
            <p>{t("consultations.duration")}: {consultationDetailsByType[selectedType].duration} {t("common.minutes")}</p>
            {showPricing && consultationDetailsByType[selectedType].price && (
              <p>{t("consultations.price")}: ₹{consultationDetailsByType[selectedType].price}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { ConsultationType };
