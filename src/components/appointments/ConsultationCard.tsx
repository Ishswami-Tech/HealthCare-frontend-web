"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import TherapyBadge from "@/components/ayurveda/TherapyBadge";
import type { TherapyType } from "@/types/therapy.types";

export interface ConsultationType {
  type: TherapyType;
  name: string;
  description: string;
  duration: number;
  category: string;
  price?: number;
  prerequisites?: string[];
  contraindications?: string[];
}

interface ConsultationCardProps {
  consultation: ConsultationType;
  selectedType?: TherapyType | undefined;
  expandedType: TherapyType | null;
  onSelect: (type: TherapyType) => void;
  onToggleExpand: (type: TherapyType | null) => void;
  showPricing?: boolean | undefined;
  showDetails?: boolean | undefined;
  className?: string | undefined;
}

export default function ConsultationCard({
  consultation,
  selectedType,
  expandedType,
  onSelect,
  onToggleExpand,
  showPricing = true,
  showDetails = true,
  className,
}: ConsultationCardProps) {
  const { t } = useTranslation();
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
                onToggleExpand(isExpanded ? null : consultation.type);
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
          <div className="gap-y-3 border-t pt-3">
            {consultation.prerequisites && consultation.prerequisites.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-green-700 mb-1">{t("consultations.prerequisites")}:</h4>
                <ul className="text-xs text-gray-600 gap-y-1">
                  {consultation.prerequisites.map((prereq) => (
                    <li key={prereq} className="flex items-start gap-1">
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
                <ul className="text-xs text-gray-600 gap-y-1">
                  {consultation.contraindications.map((contra) => (
                    <li key={contra} className="flex items-start gap-1">
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
}

export type { ConsultationCardProps };
