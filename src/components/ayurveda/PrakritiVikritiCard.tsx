"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import {
  User,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { DoshaData } from "./DoshaChart";
import DoshaComparison from "./DoshaComparison";

export interface PrakritiVikritiData {
  prakriti: DoshaData; // Natural constitution
  vikriti: DoshaData; // Current state
  patientName?: string;
  assessmentDate?: string;
  recommendations?: string[];
}

interface PrakritiVikritiCardProps {
  data: PrakritiVikritiData;
  showRecommendations?: boolean;
  className?: string;
}

const DOSHA_COLORS = {
  vata: "#8B5CF6",
  pitta: "#EF4444",
  kapha: "#10B981",
};

// Helper functions defined at module scope (not inside component)
function calculateDifference(doshaKey: keyof DoshaData, vikriti: DoshaData, prakriti: DoshaData) {
  return vikriti[doshaKey] - prakriti[doshaKey];
}

function getDifferenceIcon(difference: number) {
  if (difference > 10) return <TrendingUp className="size-4 text-red-500" />;
  if (difference < -10) return <TrendingDown className="size-4 text-blue-500" />;
  return <Minus className="size-4 text-gray-500" />;
}

function getDifferenceColor(difference: number) {
  if (Math.abs(difference) > 15) return "text-red-600";
  if (Math.abs(difference) > 10) return "text-orange-600";
  if (Math.abs(difference) > 5) return "text-yellow-600";
  return "text-green-600";
}

export default function PrakritiVikritiCard({
  data,
  showRecommendations = true,
  className,
}: PrakritiVikritiCardProps) {
  const { t } = useTranslation();
  const { prakriti, vikriti, patientName, assessmentDate, recommendations } = data;

  const DOSHA_NAMES = {
    vata: t("doshas.vata"),
    pitta: t("doshas.pitta"),
    kapha: t("doshas.kapha"),
  };

  // Calculate differences between Prakriti and Vikriti
  const getDifference = (doshaKey: keyof DoshaData) => calculateDifference(doshaKey, vikriti, prakriti);

  const getBalanceStatus = () => {
    const totalDifference =
      Math.abs(getDifference("vata")) +
      Math.abs(getDifference("pitta")) +
      Math.abs(getDifference("kapha"));

    if (totalDifference < 15)
      return { status: t("prakritiVikriti.balanced"), color: "text-green-600", icon: CheckCircle };
    if (totalDifference < 30)
      return {
        status: t("prakritiVikriti.mildImbalance"),
        color: "text-yellow-600",
        icon: AlertTriangle,
      };
    return {
      status: t("prakritiVikriti.significantImbalance"),
      color: "text-red-600",
      icon: AlertTriangle,
    };
  };

  const balanceStatus = getBalanceStatus();
  const BalanceIcon = balanceStatus.icon;

  // Translation helper for DoshaComparison
  const translate = (key: string) => t(key);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            {t("prakritiVikriti.title")}
            {patientName && <Badge variant="outline">{patientName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <BalanceIcon className={cn("size-4", balanceStatus.color)} />
            <span
              className={cn(
                "text-sm font-medium capitalize",
                balanceStatus.color
              )}
            >
              {balanceStatus.status}
            </span>
          </div>
        </div>
        {assessmentDate && (
          <p className="text-sm text-gray-600">
            {t("prakritiVikriti.assessmentDate")}: {formatDateInIST(assessmentDate)}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-y-6">
        {/* Constitution Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Activity className="size-4 text-blue-600" />
              {t("prakritiVikriti.constitutionAnalysis")}
            </h3>
            <div className="flex flex-col gap-y-4">
              <DoshaComparison
                doshaKey="vata"
                prakriti={prakriti}
                vikriti={vikriti}
                getDifference={getDifference}
                getDifferenceIcon={getDifferenceIcon}
                getDifferenceColor={getDifferenceColor}
                DOSHA_NAMES={DOSHA_NAMES}
                DOSHA_COLORS={DOSHA_COLORS}
                translation={translate}
              />
              <DoshaComparison
                doshaKey="pitta"
                prakriti={prakriti}
                vikriti={vikriti}
                getDifference={getDifference}
                getDifferenceIcon={getDifferenceIcon}
                getDifferenceColor={getDifferenceColor}
                DOSHA_NAMES={DOSHA_NAMES}
                DOSHA_COLORS={DOSHA_COLORS}
                translation={translate}
              />
              <DoshaComparison
                doshaKey="kapha"
                prakriti={prakriti}
                vikriti={vikriti}
                getDifference={getDifference}
                getDifferenceIcon={getDifferenceIcon}
                getDifferenceColor={getDifferenceColor}
                DOSHA_NAMES={DOSHA_NAMES}
                DOSHA_COLORS={DOSHA_COLORS}
                translation={translate}
              />
            </div>
          </div>

          <div className="flex flex-col gap-y-4">
            <h3 className="font-semibold text-lg">{t("prakritiVikriti.balanceOverview")}</h3>
            <div className="flex flex-col gap-y-3 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <BalanceIcon className={cn("size-5", balanceStatus.color)} />
                <span
                  className={cn("font-medium capitalize", balanceStatus.color)}
                >
                  {balanceStatus.status}
                </span>
              </div>

              <div className="flex flex-col gap-y-2 text-sm text-gray-600">
                <p>
                  <strong>{t("prakritiVikriti.prakriti")}</strong> {t("prakritiVikriti.prakritDescription")}
                </p>
                <p>
                  <strong>{t("prakritiVikriti.vikriti")}</strong> {t("prakritiVikriti.vikritiDescription")}
                </p>
              </div>

              {/* Key Imbalances */}
              <div className="flex flex-col gap-y-2">
                <h4 className="font-medium text-sm">{t("prakritiVikriti.keyObservations")}:</h4>
                <div className="flex flex-col gap-y-1">
                  {(["vata", "pitta", "kapha"] as const).map((dosha) => {
                    const diff = getDifference(dosha);
                    if (Math.abs(diff) > 10) {
                      return (
                        <div
                          key={dosha}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="size-2 rounded-full"
                            style={{ backgroundColor: DOSHA_COLORS[dosha] }}
                          />
                          <span className="capitalize">{dosha}</span>
                          <span className={getDifferenceColor(diff)}>
                            {diff > 0 ? t("prakritiVikriti.elevated") : t("prakritiVikriti.reduced")} {t("prakritiVikriti.by")}{" "}
                            {Math.abs(diff)}%
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {showRecommendations &&
          recommendations &&
          recommendations.length > 0 && (
            <div className="gap-y-3">
              <h3 className="font-semibold text-lg">{t("prakritiVikriti.recommendations")}</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="gap-y-2">
                  {recommendations.map((recommendation) => (
                    <li key={recommendation} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
