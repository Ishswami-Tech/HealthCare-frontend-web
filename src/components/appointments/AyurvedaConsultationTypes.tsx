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

    return services.reduce<ConsultationType[]>((acc, service) => {
      if (allowedTypes && !allowedTypes.has(service.treatmentType as TherapyType)) {
        return acc;
      }

      acc.push({
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
      });

      return acc;
    }, []);
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
    <div className="flex flex-col gap-y-6">
      <div className="text-center">
        <h2 className="m-0 mb-2 text-2xl font-extrabold tracking-[-0.4px] text-ink">{t("consultations.selectType")}</h2>
        <p className="m-0 text-sm text-ink-muted">
          {t("consultations.selectDescription")}
        </p>
      </div>

      {Object.entries(groupedConsultations).map(([category, consultations]) => (
        <div key={category} className="flex flex-col gap-y-3">
          <h3 className="m-0 border-b border-hair pb-2 text-base font-bold text-ink">
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
        <div className="mt-6 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-[#065f46] dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <TherapyBadge type={selectedType} />
            <span className="font-bold">{t("consultations.selected")}: {consultationDetailsByType[selectedType].name}</span>
          </div>
          <div className="text-sm">
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
