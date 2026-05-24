"use client";

import { Activity, CheckCircle, TestTube2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LabCategoryStats = {
  hematology: number;
  urineAnalysis: number;
  biochemistry: number;
  microbiology: number;
};

interface LabTechnicianCategoryStatsProps {
  categoryStats: LabCategoryStats;
}

export function LabTechnicianCategoryStats({ categoryStats }: LabTechnicianCategoryStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lab Statistics by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <TestTube2 className="size-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700">{categoryStats.hematology}</div>
              <div className="text-sm font-medium text-blue-600/80">Hematology</div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
            <div className="rounded-lg bg-purple-100 p-2">
              <Activity className="size-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-700">{categoryStats.urineAnalysis}</div>
              <div className="text-sm font-medium text-purple-600/80">Urine Analysis</div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="rounded-lg bg-emerald-100 p-2">
              <CheckCircle className="size-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">{categoryStats.biochemistry}</div>
              <div className="text-sm font-medium text-emerald-600/80">Biochemistry</div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-orange-100 bg-orange-50/50 p-4">
            <div className="rounded-lg bg-orange-100 p-2">
              <TestTube2 className="size-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-700">{categoryStats.microbiology}</div>
              <div className="text-sm font-medium text-orange-600/80">Microbiology</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
