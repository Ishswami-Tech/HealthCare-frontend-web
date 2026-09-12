"use client";

import { useQueryData } from "@/hooks/core/useQueryData";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import {
  getPrakritiAssessments,
  getDoshaImbalances,
  getAyurvedicDiagnoses,
  getNadiParikshaRecords,
  getAyurvedaTimeline,
} from "@/lib/actions/ayurveda.server";

type PrakritiEntry = {
  id: string;
  patientId: string;
  dominantDosha: string;
  createdAt?: string;
};

type NadiEntry = {
  id: string;
  patientId: string;
  createdAt: string;
};

type DoshaEntry = {
  id: string;
  patientId: string;
  dominantDosha: string;
  imbalanceLevel: string;
};

type DiagnosisEntry = {
  id: string;
  patientId: string;
  diagnosisLabel: string;
  primaryDosha: string;
  severity: string;
};

type Summary = {
  totalPrakriti: number;
  totalNadi: number;
  totalDosha: number;
  totalDiagnoses: number;
};

export function useAyurvedaDashboard() {
  const { isConnected } = useWebSocketStatus();

  const prakritiQuery = useQueryData<PrakritiEntry[]>(
    ["ayurveda", "prakriti"],
    async () => {
      try {
        const data = await getPrakritiAssessments("");
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const nadiQuery = useQueryData<NadiEntry[]>(
    ["ayurveda", "nadi"],
    async () => {
      try {
        const data = await getNadiParikshaRecords("");
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const doshaQuery = useQueryData<DoshaEntry[]>(
    ["ayurveda", "dosha"],
    async () => {
      try {
        const data = await getDoshaImbalances("");
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const diagnosisQuery = useQueryData<DiagnosisEntry[]>(
    ["ayurveda", "diagnoses"],
    async () => {
      try {
        const data = await getAyurvedicDiagnoses("");
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const prakritiData = prakritiQuery.data ?? [];
  const nadiData = nadiQuery.data ?? [];
  const doshaData = doshaQuery.data ?? [];
  const diagnosisData = diagnosisQuery.data ?? [];

  const summary: Summary = {
    totalPrakriti: prakritiData.length,
    totalNadi: nadiData.length,
    totalDosha: doshaData.length,
    totalDiagnoses: diagnosisData.length,
  };

  const isLoading = prakritiQuery.isPending || nadiQuery.isPending;

  return {
    summary,
    recentPrakriti: prakritiData.slice(0, 10),
    recentNadi: nadiData.slice(0, 10),
    doshaTrends: doshaData.slice(0, 10),
    recentDiagnoses: diagnosisData.slice(0, 10),
    isLoading,
    refetch: () => {
      prakritiQuery.refetch();
      nadiQuery.refetch();
      doshaQuery.refetch();
      diagnosisQuery.refetch();
    },
  };
}
