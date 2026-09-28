import { keepPreviousData } from "@tanstack/react-query";
import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import {
  createDietChartFood,
  getVisitDietChart,
  searchDietChartFoods,
  updateDietChartFood,
  upsertVisitDietChart,
} from "@/lib/actions/visit-diet-chart.server";
import type {
  CreateDietChartFoodInput,
  UpdateDietChartFoodInput,
  UpsertVisitDietChartInput,
} from "@/types/visit-diet-chart.types";

export const visitDietChartKeys = {
  all: ["visit-diet-chart"] as const,
  chart: (clinicId: string, visitId: string) => ["visit-diet-chart", "chart", clinicId, visitId] as const,
  foods: (clinicId: string, q: string, group: string) =>
    ["visit-diet-chart", "foods", clinicId, q, group] as const,
};

// ===== CHART =====

export const useVisitDietChart = (clinicId: string, visitId: string) =>
  useQueryData(
    visitDietChartKeys.chart(clinicId, visitId),
    async () => getVisitDietChart(clinicId, visitId),
    { enabled: !!clinicId && !!visitId },
  );

export const useUpsertVisitDietChart = () =>
  useMutationOperation(
    async ({
      clinicId,
      visitId,
      input,
    }: {
      clinicId: string;
      visitId: string;
      input: UpsertVisitDietChartInput;
    }) => upsertVisitDietChart(clinicId, visitId, input),
    {
      toastId: "visit-diet-chart-save",
      loadingMessage: "Saving diet chart...",
      successMessage: "Diet chart saved",
      invalidateQueries: [[...visitDietChartKeys.all]],
    },
  );

// ===== FOOD MASTER =====

/**
 * Search the food master (system rows + this clinic). Debounce `q` in the
 * component; the previous result set is kept while a new search is in flight
 * so the picker never flashes empty between keystrokes.
 */
export const useDietChartFoods = (clinicId: string, q: string = "", group: string = "") =>
  useQueryData(
    visitDietChartKeys.foods(clinicId, q.trim(), group.trim()),
    async () => searchDietChartFoods(clinicId, { q: q.trim(), group: group.trim(), limit: 50 }),
    { enabled: !!clinicId, placeholderData: keepPreviousData, staleTime: 5 * 60 * 1000 },
  );

export const useCreateDietChartFood = () =>
  useMutationOperation(
    async ({ clinicId, input }: { clinicId: string; input: CreateDietChartFoodInput }) =>
      createDietChartFood(clinicId, input),
    {
      toastId: "diet-chart-food-create",
      loadingMessage: "Adding food...",
      successMessage: "Food added to your clinic's list",
      invalidateQueries: [[...visitDietChartKeys.all, "foods"]],
    },
  );

export const useUpdateDietChartFood = () =>
  useMutationOperation(
    async ({
      clinicId,
      foodId,
      input,
    }: {
      clinicId: string;
      foodId: string;
      input: UpdateDietChartFoodInput;
    }) => updateDietChartFood(clinicId, foodId, input),
    {
      toastId: "diet-chart-food-update",
      loadingMessage: "Saving food...",
      successMessage: "Food updated",
      invalidateQueries: [[...visitDietChartKeys.all, "foods"]],
    },
  );
