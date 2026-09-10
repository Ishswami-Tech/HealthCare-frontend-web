"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Activity, Sparkles, Stethoscope } from "lucide-react";

type SummaryProps = {
  summary: {
    totalPrakriti: number;
    totalNadi: number;
    totalDosha: number;
    totalDiagnoses: number;
  };
  isLoading: boolean;
};

export function AyurvedaSummaryCards({ summary, isLoading }: SummaryProps) {
  const items = [
    { label: "Prakriti", value: summary.totalPrakriti, Icon: Leaf },
    { label: "Nadi Readings", value: summary.totalNadi, Icon: Activity },
    { label: "Dosha Records", value: summary.totalDosha, Icon: Sparkles },
    { label: "Diagnoses", value: summary.totalDiagnoses, Icon: Stethoscope },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map(({ label, value, Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {isLoading ? "…" : value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
