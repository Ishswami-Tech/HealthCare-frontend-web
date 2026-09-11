"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Stethoscope, Activity, Sparkles } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { AyurvedaSummaryCards } from "./AyurvedaSummaryCards";
import { useAyurvedaDashboard } from "@/hooks/query/useAyurvedaDashboard";

export default function AyurvedaDashboardContent() {
  const data = useAyurvedaDashboard();

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Ayurveda Practice"
        title="Ayurvedic Wellness Workspace"
        description="Prakriti assessments, Nadi Pariksha readings, dosha tracking, and personalized treatment plans."
        actions={[
          { label: "New Prakriti", href: "/ayurveda/dashboard#prakriti", icon: <Leaf className="size-4" /> },
          { label: "Nadi Pariksha", href: "/ayurveda/dashboard#nadi", icon: <Stethoscope className="size-4" /> },
        ]}
      />

      <AyurvedaSummaryCards summary={data.summary} isLoading={data.isLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card id="prakriti">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="size-4" />
              Recent Prakriti Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPrakriti.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent prakriti assessments captured.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentPrakriti.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="rounded border p-3">
                    <p className="text-sm font-semibold">Patient: {entry.patientId}</p>
                    <p className="text-xs text-muted-foreground">
                      Dominant dosha: {entry.dominantDosha || "Pending analysis"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card id="nadi">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Recent Nadi Pariksha
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentNadi.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent nadi readings.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentNadi.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="rounded border p-3">
                    <p className="text-sm font-semibold">Patient: {entry.patientId}</p>
                    <p className="text-xs text-muted-foreground">
                      Recorded: {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              Dosha Imbalance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.doshaTrends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dosha records yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.doshaTrends.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between text-sm">
                    <span>{entry.dominantDosha || "Unclassified"}</span>
                    <span className="text-xs text-muted-foreground">{entry.imbalanceLevel}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ayurvedic Diagnoses</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentDiagnoses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No diagnoses recorded.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentDiagnoses.slice(0, 5).map((d) => (
                  <li key={d.id} className="rounded border p-3">
                    <p className="text-sm font-semibold">{d.diagnosisLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      Primary dosha: {d.primaryDosha} · Severity: {d.severity}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageShell>
  );
}
