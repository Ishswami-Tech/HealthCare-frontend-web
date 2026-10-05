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
        "cursor-pointer transition-shadow duration-200 hover:shadow-md",
        isSelected && "bg-mint-soft ring-2 ring-brand ring-offset-2 ring-offset-background",
        className
      )}
      onClick={() => onSelect(consultation.type)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TherapyBadge type={consultation.type} />
            <div>
              <CardTitle className="text-base font-bold text-ink">{consultation.name}</CardTitle>
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
        <p className="mb-3 text-sm text-ink-muted">
          {consultation.description}
        </p>

        {showDetails && isExpanded && (
          <div className="flex flex-col gap-y-3 border-t border-hair pt-3">
            {consultation.prerequisites && consultation.prerequisites.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-bold text-brand-dark">{t("consultations.prerequisites")}:</h4>
                <ul className="space-y-1 text-xs text-ink-muted">
                  {consultation.prerequisites.map((prereq) => (
                    <li key={prereq} className="flex items-start gap-1">
                      <span className="mt-0.5 text-brand" aria-hidden="true">•</span>
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {consultation.contraindications && consultation.contraindications.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-bold text-[#be123c] dark:text-rose-300">{t("consultations.contraindications")}:</h4>
                <ul className="space-y-1 text-xs text-ink-muted">
                  {consultation.contraindications.map((contra) => (
                    <li key={contra} className="flex items-start gap-1">
                      <span className="mt-0.5 text-[#e11d48] dark:text-rose-300" aria-hidden="true">•</span>
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
