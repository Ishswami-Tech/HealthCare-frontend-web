"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import TherapyBadge from "@/components/ayurveda/TherapyBadge";
import type { TherapyType } from "@/types/therapy.types";
import { useAppointmentServices } from "@/hooks/query/useAppointments";
import ConsultationCard, { ConsultationType } from "./ConsultationCard";

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

  const handleToggleExpand = (type: TherapyType | null) => {
    setExpandedType(type);
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
    <div className="gap-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">{t("consultations.selectType")}</h2>
        <p className="text-gray-600">
          {t("consultations.selectDescription")}
        </p>
      </div>

      {Object.entries(groupedConsultations).map(([category, consultations]) => (
        <div key={category} className="gap-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            {category.replace(/_/g, " ")} {t("consultations.treatments")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultations.map((consultation) => (
              <ConsultationCard
                key={consultation.type}
                consultation={consultation}
                selectedType={selectedType ?? undefined}
                expandedType={expandedType}
                onSelect={onSelect}
                onToggleExpand={handleToggleExpand}
                showPricing={showPricing}
                showDetails={showDetails}
                className={className}
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
