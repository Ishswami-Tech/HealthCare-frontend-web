"use server";

import { authenticatedApi, getServerSession } from "./auth.server";
import { API_ENDPOINTS } from "../config/config";
import type {
  CreateDietChartFoodInput,
  DietChartFood,
  DietChartFoodSearchParams,
  UpdateDietChartFoodInput,
  UpsertVisitDietChartInput,
  VisitDietChart,
} from "@/types/visit-diet-chart.types";

async function requireSession(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }
}

function clinicHeaders(clinicId: string): Record<string, string> {
  return clinicId ? { "X-Clinic-ID": clinicId } : {};
}

const EMPTY_CHART = (visitId: string): VisitDietChart => ({
  visitId,
  printLanguage: "en",
  notes: null,
  items: [],
  updatedAt: null,
});

// ===== PER-VISIT CHART =====

export async function getVisitDietChart(clinicId: string, visitId: string): Promise<VisitDietChart> {
  await requireSession();
  const { data } = await authenticatedApi<VisitDietChart>(API_ENDPOINTS.PATIENT_VISITS.DIET_CHART(visitId), {
    headers: clinicHeaders(clinicId),
  });
  return data ?? EMPTY_CHART(visitId);
}

export async function upsertVisitDietChart(
  clinicId: string,
  visitId: string,
  input: UpsertVisitDietChartInput,
): Promise<VisitDietChart> {
  await requireSession();
  const { data } = await authenticatedApi<VisitDietChart>(API_ENDPOINTS.PATIENT_VISITS.DIET_CHART(visitId), {
    method: "PUT",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data ?? EMPTY_CHART(visitId);
}

// ===== FOOD MASTER =====

export async function searchDietChartFoods(
  clinicId: string,
  params: DietChartFoodSearchParams = {},
): Promise<DietChartFood[]> {
  await requireSession();
  const query = new URLSearchParams();
  const q = params.q?.trim();
  const group = params.group?.trim();
  if (q) query.set("q", q);
  if (group) query.set("group", group);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  const suffix = query.toString();
  const endpoint = `${API_ENDPOINTS.PATIENT_VISITS.DIET_CHART_FOODS}${suffix ? `?${suffix}` : ""}`;
  const { data } = await authenticatedApi<DietChartFood[]>(endpoint, {
    headers: clinicHeaders(clinicId),
  });
  return Array.isArray(data) ? data : [];
}

export async function createDietChartFood(
  clinicId: string,
  input: CreateDietChartFoodInput,
): Promise<DietChartFood> {
  await requireSession();
  const { data } = await authenticatedApi<DietChartFood>(API_ENDPOINTS.PATIENT_VISITS.DIET_CHART_FOODS, {
    method: "POST",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function updateDietChartFood(
  clinicId: string,
  foodId: string,
  input: UpdateDietChartFoodInput,
): Promise<DietChartFood> {
  await requireSession();
  const { data } = await authenticatedApi<DietChartFood>(API_ENDPOINTS.PATIENT_VISITS.DIET_CHART_FOOD(foodId), {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}
